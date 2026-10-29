import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  INITIAL_JP_READING_PASSAGES,
  INITIAL_JP_SUBJECTS,
  JPReadingPassage,
  JPSubject,
  UserJPAssignment,
  UserJPMinedCard,
  buildInitialJPAssignments,
} from '../data/jp-seed';
import { buildInitialQuranProgress } from '../data/quran-seed';
import { calculateNextWaniKaniStage, WANIKANI_STAGES, WaniKaniStage } from '../lib/srs-wanikani';
import { evaluateQuranPageSession, QuranPageProgress } from '../lib/srs-fsrs';
import { configureRuntimeSupabase, getSupabaseClient } from '../lib/supabase';

const STORAGE_KEY = 'aimprove.learning.state.v1';

export interface ReviewLogEntry {
  id: string;
  domain: 'japanese' | 'quran';
  itemId: string;
  title: string;
  previousStage: string;
  newStage: string;
  mistakes: number;
  reviewedAt: string;
}

export interface ForecastHourBucket {
  hourOffset: number;
  label: string;
  jpCount: number;
  quranCount: number;
  cumulativeTotal: number;
}

interface LearningState {
  isHydrated: boolean;
  syncError: string | null;
  lastSyncedAt: string | null;
  userEmail: string | null;
  userId: string | null;
  sabqiWindowDays: number;
  currentJPLevel: number;

  // Curriculum & User Progress
  jpSubjects: JPSubject[];
  jpPassages: JPReadingPassage[];
  jpAssignments: Record<string, UserJPAssignment>;
  jpMinedCards: UserJPMinedCard[];
  quranProgress: Record<number, QuranPageProgress>;
  reviewLogs: ReviewLogEntry[];

  // Actions
  hydrate: () => Promise<void>;
  setSabqiWindowDays: (days: number) => Promise<void>;
  completeJPLessonBatch: (subjectIds: string[]) => Promise<string[]>;
  submitJPReviewOutcome: (
    subjectId: string,
    incorrectCount: number,
    isMinedCard?: boolean
  ) => Promise<{
    previousStageName: string;
    newStageName: string;
    newlyUnlockedIds: string[];
    leveledUpTo: number | null;
  }>;
  mineSentenceCard: (card: Omit<UserJPMinedCard, 'id' | 'srsStage' | 'nextReviewAt' | 'createdAt'>) => Promise<void>;
  startQuranSabaqPage: (pageNumber: number) => Promise<void>;
  submitQuranPageRecitation: (
    pageNumber: number,
    mistakes: number,
    flaggedAyahKeys: string[]
  ) => Promise<QuranPageProgress>;
  connectSupabaseRuntime: (url: string, anonKey: string) => Promise<{ ok: boolean; message: string }>;
  signInWithSupabase: (email: string, password: string, isSignUp: boolean) => Promise<{ ok: boolean; message: string }>;
  signOutSupabase: () => Promise<void>;
  resetDemoProgress: () => Promise<void>;
}

export const useLearningStore = create<LearningState>((set, get) => ({
  isHydrated: false,
  syncError: null,
  lastSyncedAt: null,
  userEmail: null,
  userId: null,
  sabqiWindowDays: 7,
  currentJPLevel: 1,
  jpSubjects: INITIAL_JP_SUBJECTS,
  jpPassages: INITIAL_JP_READING_PASSAGES,
  jpAssignments: buildInitialJPAssignments(),
  jpMinedCards: [],
  quranProgress: buildInitialQuranProgress(),
  reviewLogs: [],

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.supabaseUrl && parsed.supabaseKey) {
          configureRuntimeSupabase(parsed.supabaseUrl, parsed.supabaseKey);
        }
        set({
          jpAssignments: parsed.jpAssignments || buildInitialJPAssignments(),
          jpMinedCards: parsed.jpMinedCards || [],
          quranProgress: parsed.quranProgress || buildInitialQuranProgress(),
          reviewLogs: parsed.reviewLogs || [],
          sabqiWindowDays: parsed.sabqiWindowDays || 7,
          currentJPLevel: parsed.currentJPLevel || 1,
          userEmail: parsed.userEmail || null,
          userId: parsed.userId || null,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }

      // Check active Supabase session if configured
      const sb = getSupabaseClient();
      if (sb) {
        const { data } = await sb.auth.getSession();
        if (data?.session?.user) {
          set({
            userId: data.session.user.id,
            userEmail: data.session.user.email || null,
            lastSyncedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      set({ isHydrated: true, syncError: err?.message || 'Failed to load state' });
    }
  },

  setSabqiWindowDays: async (days: number) => {
    const clamped = Math.min(20, Math.max(3, days));
    set({ sabqiWindowDays: clamped });
    await persistState(get());
  },

  completeJPLessonBatch: async (subjectIds: string[]) => {
    const now = new Date();
    const assignments = { ...get().jpAssignments };
    const logs = [...get().reviewLogs];

    for (const id of subjectIds) {
      const existing = assignments[id];
      const outcome = calculateNextWaniKaniStage(0, 0, false, now);
      assignments[id] = {
        subjectId: id,
        srsStage: outcome.newStage,
        unlockedAt: existing?.unlockedAt || now.toISOString(),
        startedAt: now.toISOString(),
        nextReviewAt: outcome.nextReviewAt,
        passedGuru: existing?.passedGuru || false,
        burnedAt: null,
        correctStreak: 1,
        incorrectCount: 0,
      };
      const subj = get().jpSubjects.find((s) => s.id === id);
      logs.unshift({
        id: `${Date.now()}-${id}`,
        domain: 'japanese',
        itemId: id,
        title: subj ? `${subj.characters} (${subj.meanings[0]})` : id,
        previousStage: 'Lesson',
        newStage: WANIKANI_STAGES[outcome.newStage].name,
        mistakes: 0,
        reviewedAt: now.toISOString(),
      });
    }

    set({ jpAssignments: assignments, reviewLogs: logs.slice(0, 100) });
    await persistState(get());
    await syncAssignmentBatchToSupabase(subjectIds.map((id) => assignments[id]), get().userId);
    return subjectIds;
  },

  submitJPReviewOutcome: async (
    subjectId: string,
    incorrectCount: number,
    isMinedCard: boolean = false
  ) => {
    const now = new Date();

    if (isMinedCard) {
      const cards = [...get().jpMinedCards];
      const idx = cards.findIndex((c) => c.id === subjectId);
      if (idx === -1) {
        return {
          previousStageName: 'Apprentice I',
          newStageName: 'Apprentice I',
          newlyUnlockedIds: [],
          leveledUpTo: null,
        };
      }
      const card = cards[idx];
      const outcome = calculateNextWaniKaniStage(card.srsStage, incorrectCount, card.srsStage >= 5, now);
      cards[idx] = {
        ...card,
        srsStage: outcome.newStage,
        nextReviewAt: outcome.nextReviewAt,
      };
      set({ jpMinedCards: cards });
      await persistState(get());
      return {
        previousStageName: WANIKANI_STAGES[outcome.previousStage].name,
        newStageName: WANIKANI_STAGES[outcome.newStage].name,
        newlyUnlockedIds: [],
        leveledUpTo: null,
      };
    }

    const assignments = { ...get().jpAssignments };
    const current = assignments[subjectId] || {
      subjectId,
      srsStage: 1 as WaniKaniStage,
      unlockedAt: now.toISOString(),
      startedAt: now.toISOString(),
      nextReviewAt: now.toISOString(),
      passedGuru: false,
      burnedAt: null,
      correctStreak: 0,
      incorrectCount: 0,
    };

    const outcome = calculateNextWaniKaniStage(
      current.srsStage,
      incorrectCount,
      current.passedGuru,
      now
    );

    const updatedAssignment: UserJPAssignment = {
      ...current,
      srsStage: outcome.newStage,
      nextReviewAt: outcome.nextReviewAt,
      passedGuru: current.passedGuru || outcome.newStage >= 5,
      burnedAt: outcome.newStage === 9 ? now.toISOString() : current.burnedAt,
      correctStreak: incorrectCount === 0 ? current.correctStreak + 1 : 0,
      incorrectCount: current.incorrectCount + incorrectCount,
    };

    assignments[subjectId] = updatedAssignment;

    // Check WaniKani Dependency Unlocking!
    // When a Radical or Kanji reaches Guru I (stage >= 5), check all subjects that list it in componentIds
    const newlyUnlockedIds: string[] = [];
    const allSubjects = get().jpSubjects;

    if (updatedAssignment.passedGuru) {
      for (const candidate of allSubjects) {
        if (assignments[candidate.id]) continue; // Already unlocked
        if (candidate.componentIds.length === 0) continue;

        const allComponentsPassedGuru = candidate.componentIds.every(
          (compId) => assignments[compId]?.passedGuru
        );

        if (allComponentsPassedGuru) {
          assignments[candidate.id] = {
            subjectId: candidate.id,
            srsStage: 0, // Enters Lesson Queue!
            unlockedAt: now.toISOString(),
            startedAt: null,
            nextReviewAt: null,
            passedGuru: false,
            burnedAt: null,
            correctStreak: 0,
            incorrectCount: 0,
          };
          newlyUnlockedIds.push(candidate.id);
        }
      }
    }

    // Check Level-Up condition: 90% of current level's Kanji at Guru I or higher
    let currentLevel = get().currentJPLevel;
    let leveledUpTo: number | null = null;
    const levelKanji = allSubjects.filter((s) => s.level === currentLevel && s.kind === 'kanji');
    if (levelKanji.length > 0) {
      const guruKanjiCount = levelKanji.filter((k) => assignments[k.id]?.passedGuru).length;
      if (guruKanjiCount / levelKanji.length >= 0.9 && currentLevel < 60) {
        currentLevel += 1;
        leveledUpTo = currentLevel;
        // Unlock next level's Radicals and standalone Grammar into Lesson Queue
        for (const nextSubj of allSubjects.filter((s) => s.level === currentLevel)) {
          if (!assignments[nextSubj.id] && nextSubj.componentIds.length === 0) {
            assignments[nextSubj.id] = {
              subjectId: nextSubj.id,
              srsStage: 0,
              unlockedAt: now.toISOString(),
              startedAt: null,
              nextReviewAt: null,
              passedGuru: false,
              burnedAt: null,
              correctStreak: 0,
              incorrectCount: 0,
            };
            newlyUnlockedIds.push(nextSubj.id);
          }
        }
      }
    }

    const subj = allSubjects.find((s) => s.id === subjectId);
    const logs = [
      {
        id: `${Date.now()}-${subjectId}`,
        domain: 'japanese' as const,
        itemId: subjectId,
        title: subj ? `${subj.characters} (${subj.meanings[0]})` : subjectId,
        previousStage: WANIKANI_STAGES[outcome.previousStage].name,
        newStage: WANIKANI_STAGES[outcome.newStage].name,
        mistakes: incorrectCount,
        reviewedAt: now.toISOString(),
      },
      ...get().reviewLogs,
    ].slice(0, 100);

    set({
      jpAssignments: assignments,
      currentJPLevel: currentLevel,
      reviewLogs: logs,
    });

    await persistState(get());
    await syncAssignmentBatchToSupabase([updatedAssignment], get().userId);

    return {
      previousStageName: WANIKANI_STAGES[outcome.previousStage].name,
      newStageName: WANIKANI_STAGES[outcome.newStage].name,
      newlyUnlockedIds,
      leveledUpTo,
    };
  },

  mineSentenceCard: async (cardInput) => {
    const now = new Date();
    const outcome = calculateNextWaniKaniStage(0, 0, false, now);
    const newCard: UserJPMinedCard = {
      ...cardInput,
      id: `mined-${Date.now()}`,
      srsStage: outcome.newStage,
      nextReviewAt: outcome.nextReviewAt,
      createdAt: now.toISOString(),
    };
    const updated = [newCard, ...get().jpMinedCards];
    set({ jpMinedCards: updated });
    await persistState(get());
  },

  startQuranSabaqPage: async (pageNumber: number) => {
    const now = new Date();
    const map = { ...get().quranProgress };
    const existing = map[pageNumber];
    map[pageNumber] = {
      pageNumber,
      stage: 'sabaq',
      sabqiDaysCompleted: existing?.sabqiDaysCompleted || 0,
      sabqiTargetDays: get().sabqiWindowDays,
      stability: existing?.stability || 0.5,
      difficulty: existing?.difficulty || 5.0,
      reps: existing?.reps || 0,
      lapses: existing?.lapses || 0,
      lastReviewedAt: existing?.lastReviewedAt || null,
      dueAt: now.toISOString(),
      lastMistakeCount: existing?.lastMistakeCount || 0,
      flaggedAyahKeys: existing?.flaggedAyahKeys || [],
    };
    set({ quranProgress: map });
    await persistState(get());
    await syncQuranPageToSupabase(map[pageNumber], get().userId);
  },

  submitQuranPageRecitation: async (
    pageNumber: number,
    mistakes: number,
    flaggedAyahKeys: string[]
  ) => {
    const now = new Date();
    const map = { ...get().quranProgress };
    const current: QuranPageProgress = map[pageNumber] || {
      pageNumber,
      stage: 'unstarted',
      sabqiDaysCompleted: 0,
      sabqiTargetDays: get().sabqiWindowDays,
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      lastReviewedAt: null,
      dueAt: null,
      lastMistakeCount: 0,
      flaggedAyahKeys: [],
    };

    const nextProgress = evaluateQuranPageSession(
      current,
      mistakes,
      flaggedAyahKeys,
      get().sabqiWindowDays,
      now
    );

    map[pageNumber] = nextProgress;

    const logs = [
      {
        id: `${Date.now()}-p${pageNumber}`,
        domain: 'quran' as const,
        itemId: String(pageNumber),
        title: `Mushaf Page ${pageNumber}`,
        previousStage: current.stage.toUpperCase(),
        newStage: nextProgress.stage.toUpperCase(),
        mistakes,
        reviewedAt: now.toISOString(),
      },
      ...get().reviewLogs,
    ].slice(0, 100);

    set({ quranProgress: map, reviewLogs: logs });
    await persistState(get());
    await syncQuranPageToSupabase(nextProgress, get().userId);

    return nextProgress;
  },

  connectSupabaseRuntime: async (url: string, anonKey: string) => {
    const client = configureRuntimeSupabase(url, anonKey);
    if (!client) {
      return {
        ok: false,
        message: 'Enter a valid https:// Supabase URL and Anon Key.',
      };
    }
    await persistState(get(), url, anonKey);
    return {
      ok: true,
      message: 'Supabase cloud client configured. You can now sign in to sync your progress.',
    };
  },

  signInWithSupabase: async (email: string, password: string, isSignUp: boolean) => {
    const sb = getSupabaseClient();
    if (!sb) {
      return {
        ok: false,
        message: 'Configure your Supabase URL and Anon Key first in Settings.',
      };
    }

    const res = isSignUp
      ? await sb.auth.signUp({ email, password })
      : await sb.auth.signInWithPassword({ email, password });

    if (res.error) {
      return { ok: false, message: res.error.message };
    }

    const user = res.data.user;
    if (user) {
      set({
        userId: user.id,
        userEmail: user.email || email,
        lastSyncedAt: new Date().toISOString(),
        syncError: null,
      });
      await persistState(get());
    }

    return {
      ok: true,
      message: isSignUp
        ? 'Account created and connected to Supabase.'
        : 'Signed in to Supabase cloud.',
    };
  },

  signOutSupabase: async () => {
    const sb = getSupabaseClient();
    if (sb) {
      await sb.auth.signOut();
    }
    set({ userId: null, userEmail: null });
    await persistState(get());
  },

  resetDemoProgress: async () => {
    const freshJP = buildInitialJPAssignments();
    const freshQuran = buildInitialQuranProgress();
    set({
      jpAssignments: freshJP,
      jpMinedCards: [],
      quranProgress: freshQuran,
      reviewLogs: [],
      currentJPLevel: 1,
    });
    await persistState(get());
  },
}));

async function persistState(
  state: LearningState,
  supabaseUrl?: string,
  supabaseKey?: string
) {
  try {
    const payload: Record<string, any> = {
      jpAssignments: state.jpAssignments,
      jpMinedCards: state.jpMinedCards,
      quranProgress: state.quranProgress,
      reviewLogs: state.reviewLogs,
      sabqiWindowDays: state.sabqiWindowDays,
      currentJPLevel: state.currentJPLevel,
      userEmail: state.userEmail,
      userId: state.userId,
    };
    if (supabaseUrl && supabaseKey) {
      payload.supabaseUrl = supabaseUrl;
      payload.supabaseKey = supabaseKey;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Non-fatal storage write
  }
}

async function syncAssignmentBatchToSupabase(
  assignments: UserJPAssignment[],
  userId: string | null
) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    const rows = assignments.map((a) => ({
      user_id: userId,
      subject_id: a.subjectId,
      srs_stage: a.srsStage,
      unlocked_at: a.unlockedAt,
      started_at: a.startedAt,
      next_review_at: a.nextReviewAt,
      passed_guru: a.passedGuru,
      burned_at: a.burnedAt,
      correct_streak: a.correctStreak,
      incorrect_count: a.incorrectCount,
      updated_at: new Date().toISOString(),
    }));
    await sb.from('user_jp_assignments').upsert(rows);
  } catch {
    // Handled gracefully
  }
}

async function syncQuranPageToSupabase(
  progress: QuranPageProgress,
  userId: string | null
) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    await sb.from('user_quran_page_progress').upsert({
      user_id: userId,
      page_number: progress.pageNumber,
      stage: progress.stage,
      sabqi_days_completed: progress.sabqiDaysCompleted,
      sabqi_target_days: progress.sabqiTargetDays,
      stability: progress.stability,
      difficulty: progress.difficulty,
      reps: progress.reps,
      lapses: progress.lapses,
      last_reviewed_at: progress.lastReviewedAt,
      due_at: progress.dueAt,
      last_mistake_count: progress.lastMistakeCount,
      flagged_ayah_keys: progress.flaggedAyahKeys,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Handled gracefully
  }
}

/**
 * Selector helpers for Unified Home Queue & 24-Hour Review Forecast
 */
export function selectDueJapaneseReviews(state: LearningState, now: Date = new Date()): {
  subjects: JPSubject[];
  minedCards: UserJPMinedCard[];
  totalCount: number;
} {
  const nowMs = now.getTime();
  const subjects = state.jpSubjects.filter((subj) => {
    const assign = state.jpAssignments[subj.id];
    if (!assign || assign.srsStage < 1 || assign.srsStage >= 9 || !assign.nextReviewAt) {
      return false;
    }
    return new Date(assign.nextReviewAt).getTime() <= nowMs;
  });

  const minedCards = state.jpMinedCards.filter((card) => {
    if (card.srsStage < 1 || card.srsStage >= 9 || !card.nextReviewAt) return false;
    return new Date(card.nextReviewAt).getTime() <= nowMs;
  });

  return {
    subjects,
    minedCards,
    totalCount: subjects.length + minedCards.length,
  };
}

export function selectAvailableJapaneseLessons(state: LearningState): JPSubject[] {
  return state.jpSubjects.filter((subj) => {
    const assign = state.jpAssignments[subj.id];
    return assign && assign.srsStage === 0;
  });
}

export function selectDueQuranPages(state: LearningState, now: Date = new Date()): {
  sabaqPages: QuranPageProgress[];
  sabqiPages: QuranPageProgress[];
  manzilPages: QuranPageProgress[];
  totalDue: number;
} {
  const nowMs = now.getTime();
  const all = Object.values(state.quranProgress);

  const sabaqPages = all.filter((p) => p.stage === 'sabaq');
  const sabqiPages = all.filter(
    (p) => p.stage === 'sabqi' && (!p.dueAt || new Date(p.dueAt).getTime() <= nowMs)
  );
  const manzilPages = all.filter(
    (p) => p.stage === 'manzil' && p.dueAt && new Date(p.dueAt).getTime() <= nowMs
  );

  return {
    sabaqPages,
    sabqiPages,
    manzilPages,
    totalDue: sabaqPages.length + sabqiPages.length + manzilPages.length,
  };
}

export function build24HourForecast(
  state: LearningState,
  now: Date = new Date()
): ForecastHourBucket[] {
  const buckets: ForecastHourBucket[] = [];
  const startOfCurrentHour = new Date(now);
  startOfCurrentHour.setMinutes(0, 0, 0);

  const dueNowJP = selectDueJapaneseReviews(state, now).totalCount;
  const dueNowQuran = selectDueQuranPages(state, now).totalDue;
  let runningTotal = dueNowJP + dueNowQuran;

  // Group into 6 four-hour windows across the next 24 hours for clean mobile readability
  const hourSteps = [2, 4, 8, 12, 18, 24];
  let prevOffset = 0;

  for (const offset of hourSteps) {
    const windowStartMs = now.getTime() + prevOffset * 3600 * 1000;
    const windowEndMs = now.getTime() + offset * 3600 * 1000;

    let jpInWindow = 0;
    for (const assign of Object.values(state.jpAssignments)) {
      if (assign.srsStage >= 1 && assign.srsStage < 9 && assign.nextReviewAt) {
        const dueMs = new Date(assign.nextReviewAt).getTime();
        if (dueMs > windowStartMs && dueMs <= windowEndMs) {
          jpInWindow++;
        }
      }
    }

    let quranInWindow = 0;
    for (const qp of Object.values(state.quranProgress)) {
      if (qp.stage !== 'unstarted' && qp.dueAt) {
        const dueMs = new Date(qp.dueAt).getTime();
        if (dueMs > windowStartMs && dueMs <= windowEndMs) {
          quranInWindow++;
        }
      }
    }

    runningTotal += jpInWindow + quranInWindow;
    const futureTime = new Date(windowEndMs);
    const hours = futureTime.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;

    buckets.push({
      hourOffset: offset,
      label: `+${offset}h (${hour12} ${ampm})`,
      jpCount: jpInWindow,
      quranCount: quranInWindow,
      cumulativeTotal: runningTotal,
    });

    prevOffset = offset;
  }

  return buckets;
}

