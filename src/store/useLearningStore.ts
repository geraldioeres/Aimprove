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
import { configureRuntimeSupabase, getSupabaseClient, loadSavedSupabaseConfig } from '../lib/supabase';

// Before accounts, progress lived under one key for the whole phone. It is
// moved to the matching account's key the first time that account opens.
const LEGACY_STORAGE_KEY = 'aimprove.learning.state.v2';
// The account that was open last, so the app still opens offline when the
// access token has expired and can't be refreshed.
const LAST_USER_KEY = 'aimprove.learning.lastUser.v1';
const userStorageKey = (userId: string) => `aimprove.learning.user.${userId}.v1`;

const UPLOAD_BATCH = 500;
const DOWNLOAD_PAGE = 1000; // PostgREST's default max rows per request
const RESTORE_WAIT_MS = 15000;

// Pre-computed O(1) lookup indices for all 8,855 WaniKani Level 1-60 subjects
export const JP_SUBJECT_BY_ID: Record<string, JPSubject> = {};
export const JP_SUBJECTS_BY_LEVEL: Record<number, JPSubject[]> = {};

for (const subj of INITIAL_JP_SUBJECTS) {
  JP_SUBJECT_BY_ID[subj.id] = subj;
  if (!JP_SUBJECTS_BY_LEVEL[subj.level]) {
    JP_SUBJECTS_BY_LEVEL[subj.level] = [];
  }
  JP_SUBJECTS_BY_LEVEL[subj.level].push(subj);
}

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
  // True once we know whether a signed-in Supabase session exists.
  authReady: boolean;
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
  // Items finished per local day ("YYYY-MM-DD" -> count). Kept in full,
  // unlike reviewLogs, so streaks stay accurate.
  studyDays: Record<string, number>;
  dailyGoal: number;
  // When dailyGoal / sabqiWindowDays last changed on this phone; the newer
  // change wins when syncing with the account.
  settingsUpdatedAt: string | null;

  // Actions
  hydrate: () => Promise<void>;
  setSabqiWindowDays: (days: number) => Promise<void>;
  setDailyGoal: (goal: number) => Promise<void>;
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
  mineSentenceCard: (
    card: Omit<UserJPMinedCard, 'id' | 'srsStage' | 'nextReviewAt' | 'createdAt'>
  ) => Promise<void>;
  startQuranSabaqPage: (pageNumber: number) => Promise<void>;
  submitQuranPageRecitation: (
    pageNumber: number,
    mistakes: number,
    flaggedAyahKeys: string[]
  ) => Promise<QuranPageProgress>;
  connectSupabaseRuntime: (
    url: string,
    anonKey: string
  ) => Promise<{ ok: boolean; message: string }>;
  signInWithSupabase: (
    email: string,
    password: string,
    isSignUp: boolean
  ) => Promise<{ ok: boolean; message: string; needsConfirmation?: boolean }>;
  signOutSupabase: () => Promise<void>;
  resetDemoProgress: () => Promise<void>;
}

let authListenerAttached = false;

export const useLearningStore = create<LearningState>((set, get) => ({
  isHydrated: false,
  authReady: false,
  syncError: null,
  lastSyncedAt: null,
  userEmail: null,
  userId: null,
  jpSubjects: INITIAL_JP_SUBJECTS,
  jpPassages: INITIAL_JP_READING_PASSAGES,
  ...emptyProgress(),

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.supabaseUrl && parsed.supabaseKey && !getSupabaseClient()) {
          configureRuntimeSupabase(parsed.supabaseUrl, parsed.supabaseKey);
        }
        set({
          jpAssignments: parsed.jpAssignments || buildInitialJPAssignments(),
          jpMinedCards: parsed.jpMinedCards || [],
          quranProgress: parsed.quranProgress || buildInitialQuranProgress(),
          reviewLogs: parsed.reviewLogs || [],
          studyDays: parsed.studyDays || studyDaysFromLogs(parsed.reviewLogs || []),
          dailyGoal: parsed.dailyGoal || 10,
          sabqiWindowDays: parsed.sabqiWindowDays || 7,
          currentJPLevel: parsed.currentJPLevel || 1,
          userEmail: parsed.userEmail || null,
          userId: parsed.userId || null,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }

      await loadSavedSupabaseConfig();
      const sb = getSupabaseClient();
      let user: AccountUser | null = null;
      let online = false;
      if (sb) {
        const { data } = await sb.auth.getSession();
        const user = data?.session?.user;
        set({
          userId: user?.id ?? null,
          userEmail: user?.email ?? null,
          lastSyncedAt: user ? new Date().toISOString() : get().lastSyncedAt,
        });
        if (!authListenerAttached) {
          authListenerAttached = true;
          sb.auth.onAuthStateChange((_event, session) => {
            set({ userId: session?.user?.id ?? null, userEmail: session?.user?.email ?? null });
          });
        }
      } else {
        set({ userId: null, userEmail: null });
      }
      set({ authReady: true });
    } catch (err: any) {
      set({ isHydrated: true, authReady: true, syncError: err?.message || 'Failed to load state' });
    }
  },

  setSabqiWindowDays: async (days: number) => {
    const clamped = Math.min(20, Math.max(3, days));
    set({ sabqiWindowDays: clamped, settingsUpdatedAt: new Date().toISOString() });
    await persistState(get());
    await syncProfileToSupabase(get());
  },

  setDailyGoal: async (goal: number) => {
    set({
      dailyGoal: Math.min(100, Math.max(1, Math.round(goal))),
      settingsUpdatedAt: new Date().toISOString(),
    });
    await persistState(get());
    await syncProfileToSupabase(get());
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
      const subj = JP_SUBJECT_BY_ID[id];
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

    set({
      jpAssignments: assignments,
      reviewLogs: logs.slice(0, 100),
      studyDays: addStudy(get().studyDays, now, subjectIds.length),
    });
    await persistState(get());
    await Promise.all([
      syncAssignmentBatchToSupabase(
        subjectIds.map((id) => assignments[id]),
        get().userId
      ),
      syncProfileToSupabase(get()),
    ]);
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
      const outcome = calculateNextWaniKaniStage(
        card.srsStage,
        incorrectCount,
        card.srsStage >= 5,
        now
      );
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

    // Fast O(1) WaniKani Dependency Unlocking via amalgamationIds!
    const newlyUnlockedIds: string[] = [];
    const reviewedSubject = JP_SUBJECT_BY_ID[subjectId];
    let currentLevel = get().currentJPLevel;

    if (updatedAssignment.passedGuru && reviewedSubject) {
      for (const depId of reviewedSubject.amalgamationIds) {
        if (assignments[depId]) continue;
        const candidate = JP_SUBJECT_BY_ID[depId];
        if (!candidate || candidate.level > currentLevel) continue;

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
    let leveledUpTo: number | null = null;
    const levelSubjects = JP_SUBJECTS_BY_LEVEL[currentLevel] || [];
    const levelKanji = levelSubjects.filter((s) => s.kind === 'kanji');
    if (levelKanji.length > 0) {
      const guruKanjiCount = levelKanji.filter(
        (k) => assignments[k.id]?.passedGuru
      ).length;
      if (guruKanjiCount / levelKanji.length >= 0.9 && currentLevel < 60) {
        currentLevel += 1;
        leveledUpTo = currentLevel;
        const nextLevelSubjects = JP_SUBJECTS_BY_LEVEL[currentLevel] || [];
        for (const nextSubj of nextLevelSubjects) {
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

    const logs = [
      {
        id: `${Date.now()}-${subjectId}`,
        domain: 'japanese' as const,
        itemId: subjectId,
        title: reviewedSubject
          ? `${reviewedSubject.characters} (${reviewedSubject.meanings[0]})`
          : subjectId,
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
      studyDays: addStudy(get().studyDays, now, 1),
    });

    await persistState(get());
    // Newly unlocked lessons are uploaded too, so another phone sees them.
    await Promise.all([
      syncAssignmentBatchToSupabase(
        [updatedAssignment, ...newlyUnlockedIds.map((id) => assignments[id])],
        get().userId
      ),
      syncProfileToSupabase(get()),
    ]);

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
    await syncQuranPagesToSupabase([map[pageNumber]], get().userId);
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

    set({
      quranProgress: map,
      reviewLogs: logs,
      studyDays: addStudy(get().studyDays, now, 1),
    });
    await persistState(get());
    await Promise.all([
      syncQuranPagesToSupabase([nextProgress], get().userId),
      syncProfileToSupabase(get()),
    ]);

    return nextProgress;
  },

  connectSupabaseRuntime: async (url: string, anonKey: string) => {
    // configureRuntimeSupabase saves the connection for the next launch.
    const client = configureRuntimeSupabase(url, anonKey);
    if (!client) {
      return {
        ok: false,
        message: 'Enter a valid https:// Supabase URL and Anon Key.',
      };
    }
    attachAuthListener(client);
    return {
      ok: true,
      message:
        'Supabase cloud client configured. You can now sign in to sync your progress.',
    };
  },

  signInWithSupabase: async (email: string, password: string, isSignUp: boolean) => {
    const sb = getSupabaseClient();
    if (!sb) {
      return { ok: false, message: "Sign-in isn't set up yet. Add the Supabase connection first." };
    }

    signingIn = true;
    try {
      const res = isSignUp
        ? await sb.auth.signUp({ email, password })
        : await sb.auth.signInWithPassword({ email, password });

      if (res.error) {
        return { ok: false, message: res.error.message };
      }

    const session = res.data.session;
    if (!session) {
      // Sign-up with email confirmation turned on: no session until confirmed.
      return {
        ok: true,
        needsConfirmation: true,
        message: `We sent a confirmation link to ${email}. Open it, then sign in.`,
      };
    }

    set({
      userId: session.user.id,
      userEmail: session.user.email || email,
      lastSyncedAt: new Date().toISOString(),
      syncError: null,
    });
    await persistState(get());
    return { ok: true, message: isSignUp ? 'Account created.' : 'Signed in.' };
  },

  signOutSupabase: async () => {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        await sb.auth.signOut();
      } catch {
        // The local session is cleared even if the server can't be reached.
      }
    }
    closeAccount();
  },

  resetDemoProgress: async () => {
    const userId = get().userId;
    // Progress comes back from the account on the next sign-in, so erasing
    // has to clear the cloud copy too.
    const sb = getSupabaseClient();
    if (sb && userId) {
      const results = await Promise.all([
        sb.from('user_jp_assignments').delete().eq('user_id', userId),
        sb.from('user_quran_page_progress').delete().eq('user_id', userId),
        sb.from('user_profiles').delete().eq('user_id', userId),
      ]);
      const failed = results.find((r) => r.error);
      if (failed?.error) {
        set({ syncError: `progress wasn't erased (${failed.error.message})` });
        return;
      }
    }
    const fresh = emptyProgress();
    set({
      jpAssignments: fresh.jpAssignments,
      jpMinedCards: [],
      quranProgress: fresh.quranProgress,
      reviewLogs: [],
      studyDays: {},
      currentJPLevel: 1,
      syncError: null,
    });
    await persistState(get());
    await Promise.all([
      syncAssignmentBatchToSupabase(Object.values(fresh.jpAssignments), userId),
      syncProfileToSupabase(get()),
    ]);
  },
}));

// ---------------------------------------------------------------------------
// Accounts and local storage

interface AccountUser {
  id: string;
  email: string | null;
}

type ProgressFields = Pick<
  LearningState,
  | 'jpAssignments'
  | 'jpMinedCards'
  | 'quranProgress'
  | 'reviewLogs'
  | 'studyDays'
  | 'dailyGoal'
  | 'sabqiWindowDays'
  | 'currentJPLevel'
  | 'settingsUpdatedAt'
>;

function emptyProgress(): ProgressFields {
  return {
    jpAssignments: buildInitialJPAssignments(),
    jpMinedCards: [],
    quranProgress: buildInitialQuranProgress(),
    reviewLogs: [],
    studyDays: {},
    dailyGoal: 10,
    sabqiWindowDays: 7,
    currentJPLevel: 1,
    settingsUpdatedAt: null,
  };
}

function progressFromSaved(saved: any): ProgressFields {
  return {
    jpAssignments: saved.jpAssignments || buildInitialJPAssignments(),
    jpMinedCards: saved.jpMinedCards || [],
    quranProgress: saved.quranProgress || buildInitialQuranProgress(),
    reviewLogs: saved.reviewLogs || [],
    studyDays: saved.studyDays || studyDaysFromLogs(saved.reviewLogs || []),
    dailyGoal: saved.dailyGoal || 10,
    sabqiWindowDays: saved.sabqiWindowDays || 7,
    currentJPLevel: saved.currentJPLevel || 1,
    settingsUpdatedAt: saved.settingsUpdatedAt || null,
  };
}

async function readJSON(key: string): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** This account's progress saved on this phone, or a fresh start. */
async function loadAccount(user: AccountUser): Promise<Partial<LearningState>> {
  let saved = await readJSON(userStorageKey(user.id));
  if (!saved) {
    // Adopt progress from before accounts were per user. Progress saved while
    // a different account was signed in stays put for that account.
    const legacy = await readJSON(LEGACY_STORAGE_KEY);
    if (legacy && (!legacy.userId || legacy.userId === user.id)) {
      saved = legacy;
      try {
        await AsyncStorage.setItem(userStorageKey(user.id), JSON.stringify(progressFromSaved(legacy)));
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // Try again next launch
      }
    }
  }
  return {
    ...(saved ? progressFromSaved(saved) : emptyProgress()),
    userId: user.id,
    userEmail: user.email,
  };
}

async function rememberLastUser(user: AccountUser) {
  try {
    await AsyncStorage.setItem(LAST_USER_KEY, JSON.stringify(user));
  } catch {
    // Non-fatal
  }
}

/** Clear the open account from memory. Its progress stays saved under its own key. */
function closeAccount() {
  pulledForUser = null;
  AsyncStorage.removeItem(LAST_USER_KEY).catch(() => {});
  useLearningStore.setState({
    ...emptyProgress(),
    userId: null,
    userEmail: null,
    lastSyncedAt: null,
    syncError: null,
    isRestoring: false,
  });
}

function attachAuthListener(sb: SupabaseClient) {
  if (authListenerAttached) return;
  authListenerAttached = true;
  sb.auth.onAuthStateChange((event, session) => {
    // Supabase asks that auth callbacks don't await its own calls; defer.
    setTimeout(() => {
      // hydrate and signInWithSupabase open the account themselves.
      if (signingIn || event === 'INITIAL_SESSION') return;
      const state = useLearningStore.getState();
      if (event === 'SIGNED_OUT') {
        if (state.userId) closeAccount();
        return;
      }
      const sessionUser = session?.user;
      if (!sessionUser) return; // e.g. offline token refresh; keep the account open
      const user: AccountUser = { id: sessionUser.id, email: sessionUser.email ?? null };
      if (state.userId !== user.id) {
        void (async () => {
          useLearningStore.setState(await loadAccount(user));
          await rememberLastUser(user);
          await pullAndMerge(user.id);
        })();
      } else if (pulledForUser !== user.id) {
        // Came back online after opening offline.
        void pullAndMerge(user.id);
      }
    }, 0);
  });
}

async function persistState(state: LearningState) {
  if (!state.userId) return; // Nothing is saved outside an account
  try {
    const payload: ProgressFields = {
      jpAssignments: state.jpAssignments,
      jpMinedCards: state.jpMinedCards,
      quranProgress: state.quranProgress,
      reviewLogs: state.reviewLogs,
      studyDays: state.studyDays,
      dailyGoal: state.dailyGoal,
      sabqiWindowDays: state.sabqiWindowDays,
      currentJPLevel: state.currentJPLevel,
      settingsUpdatedAt: state.settingsUpdatedAt,
    };
    await AsyncStorage.setItem(userStorageKey(state.userId), JSON.stringify(payload));
  } catch {
    // Non-fatal storage write
  }
}

// ---------------------------------------------------------------------------
// Cloud sync

interface ProfileRow {
  daily_goal: number;
  sabqi_window_days: number;
  current_jp_level: number;
  study_days: Record<string, number> | null;
  settings_updated_at: string | null;
}

function assignmentToRow(a: UserJPAssignment, userId: string) {
  return {
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
  };
}

function rowToAssignment(row: any): UserJPAssignment {
  return {
    subjectId: row.subject_id,
    srsStage: Number(row.srs_stage) as WaniKaniStage,
    unlockedAt: row.unlocked_at,
    startedAt: row.started_at ?? null,
    nextReviewAt: row.next_review_at ?? null,
    passedGuru: Boolean(row.passed_guru),
    burnedAt: row.burned_at ?? null,
    correctStreak: Number(row.correct_streak) || 0,
    incorrectCount: Number(row.incorrect_count) || 0,
  };
}

function quranPageToRow(p: QuranPageProgress, userId: string) {
  return {
    user_id: userId,
    page_number: p.pageNumber,
    stage: p.stage,
    sabqi_days_completed: p.sabqiDaysCompleted,
    sabqi_target_days: p.sabqiTargetDays,
    stability: p.stability,
    difficulty: p.difficulty,
    reps: p.reps,
    lapses: p.lapses,
    last_reviewed_at: p.lastReviewedAt,
    due_at: p.dueAt,
    last_mistake_count: p.lastMistakeCount,
    flagged_ayah_keys: p.flaggedAyahKeys,
    updated_at: new Date().toISOString(),
  };
}

function rowToQuranPage(row: any): QuranPageProgress {
  return {
    pageNumber: Number(row.page_number),
    stage: row.stage,
    sabqiDaysCompleted: Number(row.sabqi_days_completed) || 0,
    sabqiTargetDays: Number(row.sabqi_target_days) || 7,
    stability: Number(row.stability) || 0,
    difficulty: Number(row.difficulty) || 5,
    reps: Number(row.reps) || 0,
    lapses: Number(row.lapses) || 0,
    lastReviewedAt: row.last_reviewed_at ?? null,
    dueAt: row.due_at ?? null,
    lastMistakeCount: Number(row.last_mistake_count) || 0,
    flaggedAyahKeys: Array.isArray(row.flagged_ayah_keys) ? row.flagged_ayah_keys : [],
  };
}

const timeMs = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() || 0 : 0);

/**
 * How far along a record is, compared left to right. Every review moves the
 * next review time forward, so the record with the later time is the newer
 * one. A started item always beats an untouched one, so a new phone's empty
 * lesson queue never overwrites real progress.
 */
function assignmentRank(a: UserJPAssignment): number[] {
  return [
    a.startedAt ? 1 : 0,
    Math.max(timeMs(a.burnedAt), timeMs(a.nextReviewAt), timeMs(a.startedAt)),
    a.srsStage,
  ];
}

function quranRank(p: QuranPageProgress): number[] {
  return [
    p.stage === 'unstarted' ? 0 : 1,
    Math.max(timeMs(p.lastReviewedAt), timeMs(p.dueAt)),
    p.reps,
  ];
}

function compareRanks(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/** Keep the newer record per key; return what the cloud is missing or has older. */
function mergeNewest<T>(
  local: Record<string | number, T>,
  remote: Record<string | number, T>,
  rank: (item: T) => number[]
): { merged: Record<string | number, T>; toUpload: T[] } {
  const merged: Record<string | number, T> = { ...remote };
  const toUpload: T[] = [];
  for (const [key, mine] of Object.entries(local)) {
    const theirs = remote[key];
    if (!theirs || compareRanks(rank(mine), rank(theirs)) > 0) {
      merged[key] = mine;
      toUpload.push(mine);
    }
  }
  return { merged, toUpload };
}

function mergeStudyDays(a: Record<string, number>, b: Record<string, number> | null) {
  const out = { ...a };
  for (const [day, count] of Object.entries(b || {})) {
    out[day] = Math.max(out[day] || 0, Number(count) || 0);
  }
  return out;
}

async function fetchAllRows(
  sb: SupabaseClient,
  table: string,
  userId: string,
  orderBy: string
): Promise<any[]> {
  const rows: any[] = [];
  for (let from = 0; ; from += DOWNLOAD_PAGE) {
    const { data, error } = await sb
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order(orderBy)
      .range(from, from + DOWNLOAD_PAGE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < DOWNLOAD_PAGE) return rows;
  }
}

/**
 * Download the account's progress, merge it with this phone's (newer record
 * wins per item), save, and upload anything this phone had that the cloud
 * didn't, e.g. progress made offline.
 */
async function pullAndMerge(userId: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  pulledForUser = userId;
  try {
    const [jpRows, quranRows, profileRes] = await Promise.all([
      fetchAllRows(sb, 'user_jp_assignments', userId, 'subject_id'),
      fetchAllRows(sb, 'user_quran_page_progress', userId, 'page_number'),
      sb.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    if (profileRes.error) throw profileRes.error;

    // Merge against the latest state: the user may have studied meanwhile.
    const state = useLearningStore.getState();
    if (state.userId !== userId) return;

    const remoteJP: Record<string, UserJPAssignment> = {};
    for (const row of jpRows) remoteJP[row.subject_id] = rowToAssignment(row);
    const remoteQuran: Record<number, QuranPageProgress> = {};
    for (const row of quranRows) remoteQuran[Number(row.page_number)] = rowToQuranPage(row);

    const jp = mergeNewest(state.jpAssignments, remoteJP, assignmentRank);
    const quran = mergeNewest(state.quranProgress, remoteQuran, quranRank);

    const profile = profileRes.data as ProfileRow | null;
    const patch: Partial<LearningState> = {
      jpAssignments: jp.merged as Record<string, UserJPAssignment>,
      quranProgress: quran.merged as Record<number, QuranPageProgress>,
      lastSyncedAt: new Date().toISOString(),
      syncError: null,
    };
    if (profile) {
      patch.studyDays = mergeStudyDays(state.studyDays, profile.study_days);
      patch.currentJPLevel = Math.max(state.currentJPLevel, Number(profile.current_jp_level) || 1);
      if (timeMs(profile.settings_updated_at) > timeMs(state.settingsUpdatedAt)) {
        patch.dailyGoal = Number(profile.daily_goal) || state.dailyGoal;
        patch.sabqiWindowDays = Number(profile.sabqi_window_days) || state.sabqiWindowDays;
        patch.settingsUpdatedAt = profile.settings_updated_at;
      }
    }
    useLearningStore.setState(patch);
    await persistState(useLearningStore.getState());

    await Promise.all([
      syncAssignmentBatchToSupabase(jp.toUpload, userId),
      syncQuranPagesToSupabase(quran.toUpload, userId),
      syncProfileToSupabase(useLearningStore.getState()),
    ]);
  } catch (err: any) {
    pulledForUser = null; // try again on the next token refresh or launch
    if (useLearningStore.getState().userId === userId) {
      useLearningStore.setState({ syncError: err?.message || "Couldn't download your progress" });
    }
  }
}

async function syncAssignmentBatchToSupabase(
  assignments: UserJPAssignment[],
  userId: string | null
) {
  const sb = getSupabaseClient();
  if (!sb || !userId || assignments.length === 0) return;
  try {
    for (let i = 0; i < assignments.length; i += UPLOAD_BATCH) {
      const rows = assignments.slice(i, i + UPLOAD_BATCH).map((a) => assignmentToRow(a, userId));
      await sb.from('user_jp_assignments').upsert(rows);
    }
  } catch {
    // Handled gracefully; the next pullAndMerge re-uploads it
  }
}

async function syncQuranPagesToSupabase(pages: QuranPageProgress[], userId: string | null) {
  const sb = getSupabaseClient();
  if (!sb || !userId || pages.length === 0) return;
  try {
    for (let i = 0; i < pages.length; i += UPLOAD_BATCH) {
      const rows = pages.slice(i, i + UPLOAD_BATCH).map((p) => quranPageToRow(p, userId));
      await sb.from('user_quran_page_progress').upsert(rows);
    }
  } catch {
    // Handled gracefully; the next pullAndMerge re-uploads it
  }
}

/**
 * Save streak days and settings to the account. The server merges instead of
 * overwriting (see migration 003), and its merged copy comes back here so
 * days studied on another phone show up too.
 */
async function syncProfileToSupabase(state: LearningState) {
  const sb = getSupabaseClient();
  const userId = state.userId;
  if (!sb || !userId) return;
  try {
    const { data, error } = await sb.rpc('upsert_user_profile', {
      p_daily_goal: state.dailyGoal,
      p_sabqi_window_days: state.sabqiWindowDays,
      p_current_jp_level: state.currentJPLevel,
      p_study_days: state.studyDays,
      p_settings_updated_at: state.settingsUpdatedAt ?? new Date(0).toISOString(),
    });
    if (error || !data) return;
    const row = data as ProfileRow;
    const latest = useLearningStore.getState();
    if (latest.userId !== userId) return;
    const studyDays = mergeStudyDays(latest.studyDays, row.study_days);
    const changed = Object.keys(studyDays).some((d) => studyDays[d] !== latest.studyDays[d]);
    if (changed) {
      useLearningStore.setState({ studyDays });
      await persistState(useLearningStore.getState());
    }
  } catch {
    // Handled gracefully
  }
}

/**
 * O(1) indexed selector helpers for Unified Home Queue & 24-Hour Review Forecast
 */
export function selectDueJapaneseReviews(
  state: LearningState,
  now: Date = new Date()
): {
  subjects: JPSubject[];
  minedCards: UserJPMinedCard[];
  totalCount: number;
} {
  const nowMs = now.getTime();
  const subjects: JPSubject[] = [];

  for (const assign of Object.values(state.jpAssignments)) {
    if (
      assign.srsStage >= 1 &&
      assign.srsStage < 9 &&
      assign.nextReviewAt &&
      new Date(assign.nextReviewAt).getTime() <= nowMs
    ) {
      const subj = JP_SUBJECT_BY_ID[assign.subjectId];
      if (subj) subjects.push(subj);
    }
  }

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
  const lessons: JPSubject[] = [];
  for (const assign of Object.values(state.jpAssignments)) {
    if (assign.srsStage === 0) {
      const subj = JP_SUBJECT_BY_ID[assign.subjectId];
      if (subj) lessons.push(subj);
    }
  }
  return lessons;
}

export function selectDueQuranPages(
  state: LearningState,
  now: Date = new Date()
): {
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

  const dueNowJP = selectDueJapaneseReviews(state, now).totalCount;
  const dueNowQuran = selectDueQuranPages(state, now).totalDue;
  let runningTotal = dueNowJP + dueNowQuran;

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

// ---------------------------------------------------------------------------
// Study days, daily goal and streak

/** Local calendar day key, e.g. "2026-11-03". */
export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addStudy(days: Record<string, number>, when: Date, n: number) {
  const key = localDayKey(when);
  return { ...days, [key]: (days[key] || 0) + n };
}

function studyDaysFromLogs(logs: ReviewLogEntry[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const log of logs) {
    if (!log.reviewedAt) continue;
    const key = localDayKey(new Date(log.reviewedAt));
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

export interface StampDay {
  key: string;
  weekday: string; // M T W T F S S
  date: number;
  count: number;
  stamped: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface StreakSummary {
  current: number;
  best: number;
  todayCount: number;
  goal: number;
  goalMet: boolean;
  week: StampDay[]; // Monday to Sunday of this week
  weekNumber: number;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * A day is stamped once the daily goal is reached. The streak counts stamped
 * days in a row up to today; an unstamped today doesn't break it yet.
 */
export function selectStreak(
  state: Pick<LearningState, 'studyDays' | 'dailyGoal'>,
  now: Date = new Date()
): StreakSummary {
  const goal = state.dailyGoal || 10;
  const days = state.studyDays || {};
  const stampedOn = (d: Date) => (days[localDayKey(d)] || 0) >= goal;

  const todayKey = localDayKey(now);
  const todayCount = days[todayKey] || 0;

  let current = 0;
  const cursor = new Date(now);
  if (!stampedOn(cursor)) cursor.setDate(cursor.getDate() - 1);
  while (stampedOn(cursor)) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of Object.keys(days).sort()) {
    if ((days[key] || 0) < goal) continue;
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (prev && Math.round((date.getTime() - prev.getTime()) / 86400000) === 1) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = date;
  }
  best = Math.max(best, current);

  const monday = new Date(now);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const week: StampDay[] = WEEKDAYS.map((weekday, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = localDayKey(d);
    const count = days[key] || 0;
    return {
      key,
      weekday,
      date: d.getDate(),
      count,
      stamped: count >= goal,
      isToday: key === todayKey,
      isFuture: key > todayKey,
    };
  });

  return {
    current,
    best,
    todayCount,
    goal,
    goalMet: todayCount >= goal,
    week,
    weekNumber: isoWeekNumber(now),
  };
}
