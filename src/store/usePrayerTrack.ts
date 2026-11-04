import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { ayahsLeftInSurah, TOTAL_AYAHS } from '../data/surahs';
import { PRAYERS, PrayerKey, scheduleReminders } from '../lib/prayer-times';
import { localDayKey, useLearningStore } from './useLearningStore';

/**
 * Ayah-by-prayer memorisation: 3 new ayah in the 10 minutes before each of the
 * five prayers and 3 more after it, so up to 30 new ayah a day. It runs beside
 * the page-based Sabaq track and is stored per account on this device.
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
  dayKey: string; // the day `today` belongs to
  today: DoneBlock[]; // blocks finished today, in order
  history: DoneBlock[]; // recent finished blocks, newest first
}

interface PrayerTrackState extends Saved {
  loadedFor: string | null; // user id the state was loaded for
  load: (userId: string | null) => Promise<void>;
  start: (startIndex: number) => Promise<void>;
  setLocationFromDevice: () => Promise<{ ok: boolean; message?: string }>;
  setReminders: (on: boolean) => Promise<void>;
  completeSlot: (slot: SlotKey) => Promise<void>;
  undoLast: () => Promise<void>;
  reset: () => Promise<void>;
}

const EMPTY: Saved = {
  startIndex: null,
  cursor: 0,
  location: null,
  remindersOn: false,
  dayKey: '',
  today: [],
  history: [],
};

const keyFor = (userId: string) => `aimprove.prayer.user.${userId}.v1`;

/** Size of the block starting at `from`: 3 ayah, never crossing a surah. */
export function blockSize(from: number): number {
  if (from >= TOTAL_AYAHS) return 0;
  return Math.min(BLOCK_SIZE, ayahsLeftInSurah(from));
}

/**
 * Today's ten slots with the ayah each covers. Finished slots show what was
 * memorised; the rest preview the next blocks in slot order.
 */
export function planToday(state: Pick<Saved, 'cursor' | 'today'>) {
  const doneBy = new Map(state.today.map((b) => [b.slot, b]));
  let next = state.cursor;
  let firstOpen: SlotKey | null = null;
  return SLOTS.map((s) => {
    const done = doneBy.get(s.key);
    if (done) return { ...s, from: done.from, count: done.count, done: true, isNext: false };
    const from = next;
    const count = blockSize(from);
    next += count;
    const isNext = firstOpen === null && count > 0;
    if (isNext) firstOpen = s.key;
    return { ...s, from, count, done: false, isNext };
  });
}

export const usePrayerTrack = create<PrayerTrackState>((set, get) => {
  const save = async () => {
    const userId = get().loadedFor;
    if (!userId) return;
    const { startIndex, cursor, location, remindersOn, dayKey, today, history } = get();
    try {
      await AsyncStorage.setItem(
        keyFor(userId),
        JSON.stringify({ startIndex, cursor, location, remindersOn, dayKey, today, history })
      );
    } catch {
      // non-fatal
    }
  };

  // A new day starts with an empty set of slots; unfinished ayah simply wait.
  const rollDay = () => {
    const key = localDayKey(new Date());
    if (get().dayKey !== key) set({ dayKey: key, today: [] });
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
    },

    start: async (startIndex) => {
      set({ startIndex, cursor: startIndex, today: [], dayKey: localDayKey(new Date()) });
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
        await save();
        reschedule();
        return { ok: true };
      } catch (e: any) {
        return { ok: false, message: e?.message || "Couldn't get your location. Try again outside or near a window." };
      }
    },

    setReminders: async (on) => {
      set({ remindersOn: on });
      await save();
      reschedule();
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
  translationId: string;
}

const textKey = (key: string) => `aimprove.ayah.v2.${key}`;

export async function loadAyahText(key: string): Promise<AyahText> {
  try {
    const cached = await AsyncStorage.getItem(textKey(key));
    if (cached) return JSON.parse(cached);
  } catch {
    // fall through to the network
  }
  const res = await fetch(
    `https://api.quran.com/api/v4/verses/by_key/${key}?translations=33&fields=text_uthmani`
  );
  if (!res.ok) throw new Error(`Couldn't load ayah ${key} (HTTP ${res.status})`);
  const data = await res.json();
  const v = data.verse;
  const text: AyahText = {
    key,
    arabic: v?.text_uthmani || '',
    // Drop footnote markers (<sup foot_note=…>1</sup>) before stripping tags.
    translationId: String(v?.translations?.[0]?.text || '')
      .replace(/<sup[^>]*>.*?<\/sup>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim(),
  };
  AsyncStorage.setItem(textKey(key), JSON.stringify(text)).catch(() => {});
  return text;
}
