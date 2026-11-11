import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DrillSection, JlptLevel } from '../lib/jlpt-drill';
import { useLearningStore } from './useLearningStore';

/**
 * JLPT drill results per level and section, saved per account on this
 * device: questions answered, how many were right, the best drill score and
 * when it was last practised.
 */

export type StatKey = DrillSection | 'mixed';

export interface SectionStat {
  answered: number;
  correct: number;
  best: number; // best drill score, 0-100
  drills: number;
  lastAt: string | null;
}

type Stats = Partial<Record<JlptLevel, Partial<Record<StatKey, SectionStat>>>>;

interface JlptState {
  loadedFor: string | null | undefined;
  stats: Stats;
  lastLevel: JlptLevel;
  load: (userId: string | null) => Promise<void>;
  setLastLevel: (level: JlptLevel) => void;
  /** Save a finished drill: per-section right/wrong counts, plus the overall score. */
  recordDrill: (
    level: JlptLevel,
    kind: StatKey,
    perSection: Partial<Record<DrillSection, { answered: number; correct: number }>>
  ) => Promise<void>;
}

const keyFor = (userId: string) => `aimprove.jlpt.${userId}.v1`;
const EMPTY: SectionStat = { answered: 0, correct: 0, best: 0, drills: 0, lastAt: null };

export const useJlptStore = create<JlptState>((set, get) => {
  const save = async () => {
    const userId = get().loadedFor;
    if (!userId) return;
    try {
      await AsyncStorage.setItem(keyFor(userId), JSON.stringify({ stats: get().stats, lastLevel: get().lastLevel }));
    } catch {
      // non-fatal
    }
  };

  return {
    loadedFor: undefined,
    stats: {},
    lastLevel: 'N5',

    load: async (userId) => {
      if (get().loadedFor === userId) return;
      if (!userId) {
        set({ loadedFor: null, stats: {}, lastLevel: 'N5' });
        return;
      }
      let saved: { stats?: Stats; lastLevel?: JlptLevel } = {};
      try {
        const raw = await AsyncStorage.getItem(keyFor(userId));
        if (raw) saved = JSON.parse(raw);
      } catch {
        // start fresh
      }
      set({ loadedFor: userId, stats: saved.stats || {}, lastLevel: saved.lastLevel || 'N5' });
    },

    setLastLevel: (level) => {
      set({ lastLevel: level });
      void save();
    },

    recordDrill: async (level, kind, perSection) => {
      const now = new Date().toISOString();
      const levelStats = { ...(get().stats[level] || {}) };
      let answered = 0;
      let correct = 0;
      for (const [section, r] of Object.entries(perSection) as [DrillSection, { answered: number; correct: number }][]) {
        answered += r.answered;
        correct += r.correct;
        const s = levelStats[section] || EMPTY;
        levelStats[section] = { ...s, answered: s.answered + r.answered, correct: s.correct + r.correct, lastAt: now };
      }
      // The drill's own score counts toward the best of what was drilled
      // (one section, or the mixed test).
      const score = answered ? Math.round((correct / answered) * 100) : 0;
      const k = levelStats[kind] || EMPTY;
      levelStats[kind] = {
        ...k,
        best: Math.max(k.best, score),
        drills: k.drills + 1,
        lastAt: now,
        ...(kind === 'mixed' ? { answered: k.answered + answered, correct: k.correct + correct } : {}),
      };
      set({ stats: { ...get().stats, [level]: levelStats } });
      await save();
      if (answered) await useLearningStore.getState().recordStudyItems(answered);
    },
  };
});
