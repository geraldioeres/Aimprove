import { create } from 'zustand';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateNextWaniKaniStage, WANIKANI_STAGES, WaniKaniStage } from '../lib/srs-wanikani';
import { getSupabaseClient } from '../lib/supabase';
import { QW_BY_ID, QW_BY_LEVEL, QW_ITEMS, QW_MAX_LEVEL, QW_TOTAL, QuranWord } from '../data/quran-words';
import { useLearningStore } from './useLearningStore';

/**
 * Quran words: WaniKani-style SRS over the Quran's vocabulary, most frequent
 * words first. A level opens once 90% of the previous level reaches Guru.
 *
 * Saved per account on the device and synced to Supabase
 * (`user_quran_words`, one row per started word, newest change wins).
 * Unlocked-but-unstarted words are worked out from progress on each device
 * and never uploaded, so a device that is behind can't undo another's work.
 */

export interface WordProgress {
  stage: WaniKaniStage; // 0 = unlocked, waiting for its lesson
  next: string | null; // next review (ISO), null at stage 0 or burned
  guru: boolean; // has reached Guru at least once
  started: string | null;
  burned: string | null;
  updated: string; // ISO; epoch for derived unlocks
}

const EPOCH = new Date(0).toISOString();
const LEVEL_UP_SHARE = 0.9;
const keyFor = (userId: string) => `aimprove.qwords.${userId}.v1`;

interface QuranWordsState {
  loadedFor: string | null | undefined; // undefined until the first load
  progress: Record<string, WordProgress>;
  dirty: string[]; // started words changed here and not yet uploaded
  load: (userId: string | null) => Promise<void>;
  completeLessons: (ids: string[]) => Promise<void>;
  submitReview: (
    id: string,
    mistakes: number
  ) => Promise<{ previous: string; next: string; leveledUpTo: number | null }>;
}

// ---------------------------------------------------------------------------
// Selectors

export function selectWordLevel(progress: Record<string, WordProgress>): number {
  let level = 1;
  for (let l = QW_MAX_LEVEL; l >= 1; l--) {
    if ((QW_BY_LEVEL[l] || []).some((w) => progress[w.i])) {
      level = l;
      break;
    }
  }
  return level;
}

/** Unlocked words waiting for their lesson, most frequent first. */
export function selectWordLessons(progress: Record<string, WordProgress>): QuranWord[] {
  return QW_ITEMS.filter((w) => progress[w.i]?.stage === 0);
}

export function selectDueWords(progress: Record<string, WordProgress>, now = new Date()): QuranWord[] {
  const t = now.getTime();
  return QW_ITEMS.filter((w) => {
    const p = progress[w.i];
    return p && p.stage >= 1 && p.stage <= 8 && p.next && Date.parse(p.next) <= t;
  }).sort((a, b) => Date.parse(progress[a.i].next!) - Date.parse(progress[b.i].next!));
}

/** Reviews still waiting on their timer, soonest first ("Review ahead"). */
export function selectUpcomingWords(progress: Record<string, WordProgress>, now = new Date()): QuranWord[] {
  const t = now.getTime();
  return QW_ITEMS.filter((w) => {
    const p = progress[w.i];
    return p && p.stage >= 1 && p.stage <= 8 && p.next && Date.parse(p.next) > t;
  }).sort((a, b) => Date.parse(progress[a.i].next!) - Date.parse(progress[b.i].next!));
}

/** Share of all word pieces in the Quran covered by words at Guru or above. */
export function selectKnownCoverage(progress: Record<string, WordProgress>): number {
  let n = 0;
  for (const w of QW_ITEMS) if (progress[w.i]?.guru) n += w.n;
  return n / QW_TOTAL;
}

export function selectLevelProgress(progress: Record<string, WordProgress>, level: number) {
  const words = QW_BY_LEVEL[level] || [];
  const guru = words.filter((w) => progress[w.i]?.guru).length;
  const started = words.filter((w) => (progress[w.i]?.stage ?? 0) >= 1).length;
  return { total: words.length, guru, started, needed: Math.ceil(words.length * LEVEL_UP_SHARE) };
}

/**
 * Words unlocked by progress: level 1 always, and each level whose previous
 * level is 90% Guru. Missing ones are added at stage 0 with an epoch stamp,
 * so a real row from another device always wins over them.
 */
function withUnlocks(progress: Record<string, WordProgress>): Record<string, WordProgress> {
  let out = progress;
  for (let l = 1; l <= QW_MAX_LEVEL; l++) {
    const words = QW_BY_LEVEL[l] || [];
    for (const w of words) {
      if (!out[w.i]) {
        if (out === progress) out = { ...progress };
        out[w.i] = { stage: 0, next: null, guru: false, started: null, burned: null, updated: EPOCH };
      }
    }
    const guru = words.filter((w) => out[w.i].guru).length;
    if (guru < Math.ceil(words.length * LEVEL_UP_SHARE)) break;
  }
  return out;
}

// ---------------------------------------------------------------------------

interface Row {
  word_id: string;
  stage: number;
  next_review_at: string | null;
  passed_guru: boolean;
  started_at: string | null;
  burned_at: string | null;
  updated_at: string;
}

const toRow = (id: string, p: WordProgress): Row => ({
  word_id: id,
  stage: p.stage,
  next_review_at: p.next,
  passed_guru: p.guru,
  started_at: p.started,
  burned_at: p.burned,
  updated_at: p.updated,
});

const fromRow = (r: Row): WordProgress => ({
  stage: Math.min(9, Math.max(0, r.stage)) as WaniKaniStage,
  next: r.next_review_at,
  guru: r.passed_guru,
  started: r.started_at,
  burned: r.burned_at,
  updated: r.updated_at,
});

let appStateHooked = false;
const PAGE = 1000;

export const useQuranWords = create<QuranWordsState>((set, get) => {
  const writeLocal = async () => {
    const userId = get().loadedFor;
    if (!userId) return;
    // Only started words are worth keeping; unlocks are re-derived on load.
    const started: Record<string, WordProgress> = {};
    for (const [id, p] of Object.entries(get().progress)) if (p.stage >= 1) started[id] = p;
    try {
      await AsyncStorage.setItem(keyFor(userId), JSON.stringify({ progress: started, dirty: get().dirty }));
    } catch {
      // non-fatal
    }
  };

  const push = async () => {
    const sb = getSupabaseClient();
    const userId = get().loadedFor;
    const ids = get().dirty;
    if (!sb || !userId || ids.length === 0) return;
    const rows = ids.map((id) => get().progress[id] && toRow(id, get().progress[id])).filter(Boolean) as Row[];
    try {
      const { error } = await sb.rpc('upsert_quran_words', { p_rows: rows });
      if (error || get().loadedFor !== userId) return;
      // Keep anything that changed again while uploading.
      const sent = new Map(rows.map((r) => [r.word_id, r.updated_at]));
      set({ dirty: get().dirty.filter((id) => sent.get(id) !== get().progress[id]?.updated) });
      await writeLocal();
    } catch {
      // offline: stays dirty and goes up with the next change or launch
    }
  };

  const pull = async () => {
    const sb = getSupabaseClient();
    const userId = get().loadedFor;
    if (!sb || !userId) return;
    try {
      const rows: Row[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await sb
          .from('user_quran_words')
          .select('word_id, stage, next_review_at, passed_guru, started_at, burned_at, updated_at')
          .eq('user_id', userId)
          .range(from, from + PAGE - 1);
        if (error || get().loadedFor !== userId) return;
        rows.push(...((data || []) as Row[]));
        if (!data || data.length < PAGE) break;
      }
      const progress = { ...get().progress };
      let changed = false;
      for (const r of rows) {
        if (!QW_BY_ID[r.word_id]) continue;
        const mine = progress[r.word_id];
        if (!mine || Date.parse(r.updated_at) > Date.parse(mine.updated)) {
          progress[r.word_id] = fromRow(r);
          changed = true;
        }
      }
      if (changed) {
        set({ progress: withUnlocks(progress) });
        await writeLocal();
      }
      await push();
    } catch {
      // offline: keep the local copy
    }
  };

  const save = async (ids: string[]) => {
    set({ dirty: [...new Set([...get().dirty, ...ids])] });
    await writeLocal();
    void push();
  };

  return {
    loadedFor: undefined,
    progress: {},
    dirty: [],

    load: async (userId) => {
      if (get().loadedFor === userId && userId !== undefined) return;
      if (!userId) {
        set({ loadedFor: null, progress: {}, dirty: [] });
        return;
      }
      let saved: { progress?: Record<string, WordProgress>; dirty?: string[] } = {};
      try {
        const raw = await AsyncStorage.getItem(keyFor(userId));
        if (raw) saved = JSON.parse(raw);
      } catch {
        // start fresh
      }
      set({ loadedFor: userId, progress: withUnlocks(saved.progress || {}), dirty: saved.dirty || [] });
      await pull();
      if (!appStateHooked) {
        appStateHooked = true;
        AppState.addEventListener('change', (s) => {
          if (s === 'active' && get().loadedFor) void pull();
        });
      }
    },

    completeLessons: async (ids) => {
      const now = new Date();
      const progress = { ...get().progress };
      for (const id of ids) {
        const outcome = calculateNextWaniKaniStage(0, 0, false, now);
        progress[id] = {
          stage: outcome.newStage,
          next: outcome.nextReviewAt,
          guru: false,
          started: now.toISOString(),
          burned: null,
          updated: now.toISOString(),
        };
      }
      set({ progress });
      await save(ids);
      await useLearningStore.getState().recordStudyItems(ids.length);
    },

    submitReview: async (id, mistakes) => {
      const now = new Date();
      const before = get().progress[id];
      const current = before && before.stage >= 1 ? before : { ...before, stage: 1 as WaniKaniStage, guru: false };
      const outcome = calculateNextWaniKaniStage(current.stage, mistakes, current.guru, now);
      const levelBefore = selectWordLevel(get().progress);
      const progress = withUnlocks({
        ...get().progress,
        [id]: {
          stage: outcome.newStage,
          next: outcome.nextReviewAt,
          guru: current.guru || outcome.newStage >= 5,
          started: current.started || now.toISOString(),
          burned: outcome.newStage === 9 ? now.toISOString() : null,
          updated: now.toISOString(),
        },
      });
      set({ progress });
      const levelAfter = selectWordLevel(progress);
      await save([id]);
      await useLearningStore.getState().recordStudyItems(1);
      return {
        previous: WANIKANI_STAGES[outcome.previousStage].name,
        next: WANIKANI_STAGES[outcome.newStage].name,
        leveledUpTo: levelAfter > levelBefore ? levelAfter : null,
      };
    },
  };
});
