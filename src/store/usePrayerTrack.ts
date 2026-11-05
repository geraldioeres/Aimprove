import { create } from 'zustand';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { ayahsLeftInSurah, TOTAL_AYAHS } from '../data/surahs';
import { PRAYERS, PrayerKey, prayerTimesFor, scheduleReminders } from '../lib/prayer-times';
import { localDayKey, useLearningStore } from './useLearningStore';
import { getSupabaseClient } from '../lib/supabase';

/**
 * Ayah-by-prayer memorisation: 3 new ayah in the 10 minutes before each of the
 * five prayers and 3 more after it, so up to 30 new ayah a day. It runs beside
 * the page-based Sabaq track. It is saved on the device per account and synced
 * to Supabase (`user_prayer_track`), newest change wins. Location and
 * reminders are device settings and stay local.
 */

export type SlotPhase = 'before' | 'after';
export type SlotKey = `${PrayerKey}-${SlotPhase}`;

export const SLOTS: { key: SlotKey; prayer: PrayerKey; phase: SlotPhase }[] = PRAYERS.flatMap((p) =>
  (['before', 'after'] as const).map((phase) => ({ key: `${p.key}-${phase}` as SlotKey, prayer: p.key, phase }))
);

export const BLOCK_SIZE = 3;

export interface DoneBlock {
  slot: SlotKey;
  from: number; // global ayah index
  count: number;
  at: string; // ISO time
}

export interface PrayerLocation {
  lat: number;
  lng: number;
  label: string;
}

interface Saved {
  startIndex: number | null; // where the track began; null = not set up
  cursor: number; // next ayah to memorise
  location: PrayerLocation | null;
  remindersOn: boolean;
  tajweedColours: boolean;
  wordByWord: boolean;
  dayKey: string; // the day `today` belongs to
  today: DoneBlock[]; // blocks finished today, in order
  skipped: SlotKey[]; // today's slots that had already passed when the track started
  history: DoneBlock[]; // recent finished blocks, newest first
  updatedAt: string; // ISO time of the last synced change ('' = never changed)
}

// What travels between devices. Location and reminders are left out.
const SYNCED = ['startIndex', 'cursor', 'tajweedColours', 'wordByWord', 'dayKey', 'today', 'skipped', 'history'] as const;
type Synced = Pick<Saved, (typeof SYNCED)[number]>;

interface PrayerTrackState extends Saved {
  loadedFor: string | null; // user id the state was loaded for
  load: (userId: string | null) => Promise<void>;
  start: (startIndex: number) => Promise<void>;
  setLocationFromDevice: () => Promise<{ ok: boolean; message?: string }>;
  setReminders: (on: boolean) => Promise<void>;
  setTajweedColours: (on: boolean) => Promise<void>;
  setWordByWord: (on: boolean) => Promise<void>;
  completeSlot: (slot: SlotKey) => Promise<void>;
  undoLast: () => Promise<void>;
  reset: () => Promise<void>;
}

const EMPTY: Saved = {
  startIndex: null,
  cursor: 0,
  location: null,
  remindersOn: false,
  tajweedColours: true,
  wordByWord: false,
  dayKey: '',
  today: [],
  skipped: [],
  history: [],
  updatedAt: '',
};

const keyFor = (userId: string) => `aimprove.prayer.user.${userId}.v1`;

/** Size of the block starting at `from`: 3 ayah, never crossing a surah. */
export function blockSize(from: number): number {
  if (from >= TOTAL_AYAHS) return 0;
  return Math.min(BLOCK_SIZE, ayahsLeftInSurah(from));
}

/**
 * Slots to skip when starting at `now`, so the day begins at the nearest
 * prayer: the "after" block of the prayer just prayed if it is closer, or the
 * "before" block of the next prayer. Needs prayer times, so with no location
 * nothing is skipped and the day starts at Subuh.
 */
export function passedSlots(location: PrayerLocation | null, now: Date = new Date()): SlotKey[] {
  if (!location) return [];
  const times = prayerTimesFor(location.lat, location.lng, now);
  const t = now.getTime();
  const next = times.findIndex((p) => p.time.getTime() > t);
  const last = next === -1 ? times.length - 1 : next - 1;
  let firstOpen: SlotKey;
  if (last < 0) firstOpen = `${times[0].key}-before`; // before today's Subuh
  else if (next === -1) firstOpen = `${times[last].key}-after`; // after Isya
  else {
    const sinceLast = t - times[last].time.getTime();
    const untilNext = times[next].time.getTime() - t;
    firstOpen = sinceLast <= untilNext ? `${times[last].key}-after` : `${times[next].key}-before`;
  }
  const cut = SLOTS.findIndex((s) => s.key === firstOpen);
  return SLOTS.slice(0, cut).map((s) => s.key);
}

/**
 * Today's ten slots with the ayah each covers. Finished slots show what was
 * memorised; the rest preview the next blocks in slot order.
 */
export function planToday(state: Pick<Saved, 'cursor' | 'today'> & { skipped?: SlotKey[] }) {
  const doneBy = new Map(state.today.map((b) => [b.slot, b]));
  const skipped = new Set(state.skipped || []);
  let next = state.cursor;
  let firstOpen: SlotKey | null = null;
  return SLOTS.map((s) => {
    const done = doneBy.get(s.key);
    if (done) return { ...s, from: done.from, count: done.count, done: true, isNext: false, skipped: false };
    if (skipped.has(s.key)) return { ...s, from: next, count: 0, done: false, isNext: false, skipped: true };
    const from = next;
    const count = blockSize(from);
    next += count;
    const isNext = firstOpen === null && count > 0;
    if (isNext) firstOpen = s.key;
    return { ...s, from, count, done: false, isNext, skipped: false };
  });
}

let appStateHooked = false;

export const usePrayerTrack = create<PrayerTrackState>((set, get) => {
  const writeLocal = async () => {
    const userId = get().loadedFor;
    if (!userId) return;
    const {
      startIndex, cursor, location, remindersOn, tajweedColours, wordByWord, dayKey, today, skipped, history, updatedAt,
    } = get();
    try {
      await AsyncStorage.setItem(
        keyFor(userId),
        JSON.stringify({
          startIndex, cursor, location, remindersOn, tajweedColours, wordByWord, dayKey, today, skipped, history,
          updatedAt,
        })
      );
    } catch {
      // non-fatal
    }
  };

  const syncedState = (): Synced => {
    const st = get();
    return Object.fromEntries(SYNCED.map((k) => [k, st[k]])) as Synced;
  };

  // Take another device's newer track; keep this device's location and reminders.
  const adopt = async (state: Partial<Synced>, updatedAt: string) => {
    const patch: Partial<Saved> = { updatedAt };
    for (const k of SYNCED) if (state[k] !== undefined) (patch as any)[k] = state[k];
    set(patch);
    await writeLocal();
    rollDay();
    reschedule();
  };

  const push = async () => {
    const sb = getSupabaseClient();
    const userId = get().loadedFor;
    if (!sb || !userId || !get().updatedAt) return;
    try {
      const { data, error } = await sb.rpc('upsert_prayer_track', {
        p_state: syncedState(),
        p_updated_at: get().updatedAt,
      });
      if (error || !data || get().loadedFor !== userId) return;
      const row = data as { state: Partial<Synced>; updated_at: string };
      if (Date.parse(row.updated_at) > Date.parse(get().updatedAt)) await adopt(row.state, row.updated_at);
    } catch {
      // offline: the next change or launch pushes again
    }
  };

  const pull = async () => {
    const sb = getSupabaseClient();
    const userId = get().loadedFor;
    if (!sb || !userId) return;
    try {
      const { data, error } = await sb
        .from('user_prayer_track')
        .select('state, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error || get().loadedFor !== userId) return;
      // A track started before syncing existed has no timestamp: upload it
      // once if the account has nothing yet.
      if (!data && !get().updatedAt && get().startIndex !== null) {
        set({ updatedAt: new Date().toISOString() });
        await writeLocal();
      }
      const local = get().updatedAt ? Date.parse(get().updatedAt) : 0;
      const remote = data ? Date.parse(data.updated_at) : 0;
      if (data && remote > local) await adopt(data.state, data.updated_at);
      else if (local > remote) await push();
    } catch {
      // offline: keep the local copy
    }
  };

  /**
   * Save after a change. Track changes are stamped and pushed to the account;
   * device-only changes (location, reminders) are just written locally.
   */
  const save = async (opts: { sync?: boolean } = { sync: true }) => {
    if (opts.sync !== false) set({ updatedAt: new Date().toISOString() });
    await writeLocal();
    if (opts.sync !== false) void push();
  };

  // A new day starts with an empty set of slots; unfinished ayah simply wait.
  const rollDay = () => {
    const key = localDayKey(new Date());
    if (get().dayKey !== key) set({ dayKey: key, today: [], skipped: [] });
  };

  const reschedule = () => {
    const { location, remindersOn, startIndex } = get();
    void scheduleReminders(location?.lat ?? null, location?.lng ?? null, remindersOn && startIndex !== null);
  };

  return {
    ...EMPTY,
    loadedFor: null,

    load: async (userId) => {
      if (!userId) {
        set({ ...EMPTY, loadedFor: null });
        return;
      }
      if (get().loadedFor === userId) {
        rollDay();
        return;
      }
      let saved: Partial<Saved> = {};
      try {
        const raw = await AsyncStorage.getItem(keyFor(userId));
        if (raw) saved = JSON.parse(raw);
      } catch {
        // start empty
      }
      set({ ...EMPTY, ...saved, loadedFor: userId });
      rollDay();
      reschedule();
      await pull();
      if (!appStateHooked) {
        appStateHooked = true;
        AppState.addEventListener('change', (s) => {
          if (s === 'active' && get().loadedFor) void pull();
        });
      }
    },

    start: async (startIndex) => {
      // Begin at the nearest prayer: today's slots that already passed are skipped.
      set({
        startIndex,
        cursor: startIndex,
        today: [],
        skipped: passedSlots(get().location),
        dayKey: localDayKey(new Date()),
      });
      await save();
      reschedule();
    },

    setLocationFromDevice: async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          return { ok: false, message: 'Location is off for Aimprove. Allow it to work out prayer times.' };
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        let label = 'Your location';
        try {
          const [place] = await Location.reverseGeocodeAsync(pos.coords);
          label = place?.city || place?.subregion || place?.region || label;
        } catch {
          // reverse geocoding isn't available everywhere (e.g. web)
        }
        set({ location: { lat: pos.coords.latitude, lng: pos.coords.longitude, label } });
        await save({ sync: false });
        reschedule();
        return { ok: true };
      } catch (e: any) {
        return { ok: false, message: e?.message || "Couldn't get your location. Try again outside or near a window." };
      }
    },

    setReminders: async (on) => {
      set({ remindersOn: on });
      await save({ sync: false });
      reschedule();
    },

    setTajweedColours: async (on) => {
      set({ tajweedColours: on });
      await save();
    },

    setWordByWord: async (on) => {
      set({ wordByWord: on });
      await save();
    },

    completeSlot: async (slot) => {
      rollDay();
      const plan = planToday(get());
      const target = plan.find((p) => p.key === slot);
      if (!target || target.done || !target.isNext || target.count === 0) return;
      const block: DoneBlock = { slot, from: target.from, count: target.count, at: new Date().toISOString() };
      set({
        cursor: target.from + target.count,
        today: [...get().today, block],
        history: [block, ...get().history].slice(0, 300),
      });
      await save();
      await useLearningStore.getState().recordStudyItems(target.count);
      reschedule();
    },

    undoLast: async () => {
      const last = get().today[get().today.length - 1];
      if (!last) return;
      set({
        cursor: last.from,
        today: get().today.slice(0, -1),
        history: get().history.filter((b) => b !== last && b.at !== last.at),
      });
      await save();
      await useLearningStore.getState().recordStudyItems(-last.count);
    },

    reset: async () => {
      const { location, remindersOn } = get();
      set({ ...EMPTY, location, remindersOn });
      await save();
      reschedule();
    },
  };
});

// ---------------------------------------------------------------------------
// Ayah text (Arabic + Indonesian), fetched once and cached on the device.

export interface AyahText {
  key: string;
  arabic: string;
  tajweed: string; // Quran.com tajweed-marked HTML (parse with parseTajweed)
  translationId: string;
  words: { arabic: string; meaning: string }[]; // word-by-word, Indonesian
}

const textKey = (key: string) => `aimprove.ayah.v4.${key}`;
const AYAH_QUERY =
  'translations=33&fields=text_uthmani,text_uthmani_tajweed&words=true&word_fields=text_uthmani&language=id';

function toAyahText(v: any, key: string): AyahText {
  return {
    key,
    arabic: v?.text_uthmani || '',
    tajweed: v?.text_uthmani_tajweed || '',
    words: (v?.words || [])
      .filter((w: any) => w.char_type_name === 'word')
      .map((w: any) => ({ arabic: w.text_uthmani || '', meaning: w.translation?.text || '' })),
    // Drop footnote markers (<sup foot_note=…>1</sup>) before stripping tags.
    translationId: String(v?.translations?.[0]?.text || '')
      .replace(/<sup[^>]*>.*?<\/sup>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim(),
  };
}

export const SURAH_CHUNK = 50; // ayah per request (Quran.com's page size cap)

/**
 * One chunk of a surah for the reader: ayah (chunk-1)*50+1 onwards. Chunks are
 * cached, and each ayah also lands in the single-ayah cache.
 */
export async function loadSurahChunk(surah: number, chunk: number): Promise<AyahText[]> {
  const cacheKey = `aimprove.surah.v1.${surah}.${chunk}`;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // fall through to the network
  }
  const res = await fetch(
    `https://api.quran.com/api/v4/verses/by_chapter/${surah}?${AYAH_QUERY}&per_page=${SURAH_CHUNK}&page=${chunk}`
  );
  if (!res.ok) throw new Error(`Couldn't load surah ${surah} (HTTP ${res.status})`);
  const data = await res.json();
  const texts: AyahText[] = (data.verses || []).map((v: any) => toAyahText(v, v.verse_key));
  AsyncStorage.setItem(cacheKey, JSON.stringify(texts)).catch(() => {});
  for (const t of texts) AsyncStorage.setItem(textKey(t.key), JSON.stringify(t)).catch(() => {});
  return texts;
}

export interface SurahInfo {
  arabicName: string;
  meaning: string; // Indonesian, e.g. "Sapi Betina"
  place: 'makkah' | 'madinah' | '';
}

export async function loadSurahInfo(surah: number): Promise<SurahInfo> {
  const cacheKey = `aimprove.surahinfo.v1.${surah}`;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // fall through
  }
  const res = await fetch(`https://api.quran.com/api/v4/chapters/${surah}?language=id`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const c = (await res.json()).chapter;
  const info: SurahInfo = {
    arabicName: c?.name_arabic || '',
    meaning: c?.translated_name?.name || '',
    place: c?.revelation_place || '',
  };
  AsyncStorage.setItem(cacheKey, JSON.stringify(info)).catch(() => {});
  return info;
}

export async function loadAyahText(key: string): Promise<AyahText> {
  try {
    const cached = await AsyncStorage.getItem(textKey(key));
    if (cached) return JSON.parse(cached);
  } catch {
    // fall through to the network
  }
  const res = await fetch(
    `https://api.quran.com/api/v4/verses/by_key/${key}?${AYAH_QUERY}`
  );
  if (!res.ok) throw new Error(`Couldn't load ayah ${key} (HTTP ${res.status})`);
  const data = await res.json();
  const text = toAyahText(data.verse, key);
  AsyncStorage.setItem(textKey(key), JSON.stringify(text)).catch(() => {});
  return text;
}
