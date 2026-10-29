/**
 * FSRS-5 Spaced Repetition Scheduler + Automated Sabaq -> Sabqi -> Manzil Lifecycle
 * for 604-Page Madani Mushaf Memorization.
 */

export type QuranLifecycleStage = 'unstarted' | 'sabaq' | 'sabqi' | 'manzil';

export type FSRSGrade = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface QuranPageProgress {
  pageNumber: number; // 1 to 604
  stage: QuranLifecycleStage;
  sabqiDaysCompleted: number;
  sabqiTargetDays: number;
  stability: number; // FSRS stability in days
  difficulty: number; // FSRS difficulty (1.0 - 10.0)
  reps: number;
  lapses: number;
  lastReviewedAt: string | null;
  dueAt: string | null;
  lastMistakeCount: number;
  flaggedAyahKeys: string[]; // e.g., ["78:12"] where user peeked or stumbled
}

/**
 * Maps the number of word/ayah peeks or recitation mistakes on a 15-line Mushaf page
 * to an FSRS grade automatically.
 */
export function mistakesToFSRSGrade(mistakes: number): FSRSGrade {
  if (mistakes === 0) return 4; // Easy / Flawless
  if (mistakes <= 2) return 3; // Good / Minor hesitation
  if (mistakes <= 4) return 2; // Hard / Needs reinforcement
  return 1; // Again / Return to Sabqi consolidation
}

/**
 * Advances a Mushaf page through the automated Sabaq -> Sabqi -> Manzil (FSRS) lifecycle.
 */
export function evaluateQuranPageSession(
  current: QuranPageProgress,
  mistakes: number,
  flaggedAyahKeys: string[],
  sabqiWindowDays: number = 7,
  now: Date = new Date()
): QuranPageProgress {
  const grade = mistakesToFSRSGrade(mistakes);
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  tomorrow.setHours(5, 0, 0, 0); // Due at Fajr / morning next day

  // 1. If unstarted or currently in Sabaq (new memorization)
  if (current.stage === 'unstarted' || current.stage === 'sabaq') {
    if (mistakes <= 1) {
      // Graduates from Sabaq -> Sabqi (daily recent revision for sabqiWindowDays)
      return {
        ...current,
        stage: 'sabqi',
        sabqiDaysCompleted: 1,
        sabqiTargetDays: sabqiWindowDays,
        stability: 1.5,
        difficulty: mistakes === 0 ? 4.5 : 5.5,
        reps: current.reps + 1,
        lastReviewedAt: now.toISOString(),
        dueAt: tomorrow.toISOString(),
        lastMistakeCount: mistakes,
        flaggedAyahKeys,
      };
    } else {
      // Stays in Sabaq until recited with <= 1 mistake
      return {
        ...current,
        stage: 'sabaq',
        reps: current.reps + 1,
        lastReviewedAt: now.toISOString(),
        dueAt: now.toISOString(),
        lastMistakeCount: mistakes,
        flaggedAyahKeys,
      };
    }
  }

  // 2. If in Sabqi (recent consolidation window, e.g. 7 days)
  if (current.stage === 'sabqi') {
    if (grade === 1) {
      // 5+ mistakes resets Sabqi streak back to day 1
      return {
        ...current,
        sabqiDaysCompleted: 1,
        lapses: current.lapses + 1,
        reps: current.reps + 1,
        difficulty: Math.min(10, current.difficulty + 0.8),
        lastReviewedAt: now.toISOString(),
        dueAt: tomorrow.toISOString(),
        lastMistakeCount: mistakes,
        flaggedAyahKeys,
      };
    }

    const nextDaysCompleted = current.sabqiDaysCompleted + 1;
    if (nextDaysCompleted >= current.sabqiTargetDays) {
      // Graduates from Sabqi -> Manzil (Long-term FSRS schedule!)
      const initialManzilIntervalDays = grade === 4 ? 5 : grade === 3 ? 3 : 2;
      const dueDate = new Date(now.getTime() + initialManzilIntervalDays * 24 * 3600 * 1000);
      dueDate.setHours(5, 0, 0, 0);

      return {
        ...current,
        stage: 'manzil',
        sabqiDaysCompleted: nextDaysCompleted,
        stability: initialManzilIntervalDays,
        difficulty: clampDifficulty(current.difficulty + (3 - grade) * 0.35),
        reps: current.reps + 1,
        lastReviewedAt: now.toISOString(),
        dueAt: dueDate.toISOString(),
        lastMistakeCount: mistakes,
        flaggedAyahKeys,
      };
    }

    return {
      ...current,
      sabqiDaysCompleted: nextDaysCompleted,
      stability: current.stability + 0.5,
      reps: current.reps + 1,
      lastReviewedAt: now.toISOString(),
      dueAt: tomorrow.toISOString(),
      lastMistakeCount: mistakes,
      flaggedAyahKeys,
    };
  }

  // 3. Manzil (FSRS-5 Long-Term Revision)
  const prevS = Math.max(1, current.stability);
  const prevD = current.difficulty || 5.0;
  const nextD = clampDifficulty(prevD - 0.55 * (grade - 3));

  if (grade === 1) {
    // Lapse in Manzil: demote back to Sabqi for 3 days of consolidation
    return {
      ...current,
      stage: 'sabqi',
      sabqiDaysCompleted: Math.max(0, current.sabqiTargetDays - 3),
      stability: Math.max(1.5, prevS * 0.25),
      difficulty: nextD,
      reps: current.reps + 1,
      lapses: current.lapses + 1,
      lastReviewedAt: now.toISOString(),
      dueAt: tomorrow.toISOString(),
      lastMistakeCount: mistakes,
      flaggedAyahKeys,
    };
  }

  // FSRS stability growth factor
  const hardPenalty = grade === 2 ? 0.85 : 1.0;
  const easyBonus = grade === 4 ? 1.3 : 1.0;
  const growth =
    1 +
    Math.exp(1.1) *
      (11 - nextD) *
      Math.pow(prevS, -0.18) *
      hardPenalty *
      easyBonus *
      0.32;

  const nextS = Math.min(180, Math.max(prevS + 1, Math.round(prevS * growth * 10) / 10));
  const intervalDays = Math.max(1, Math.round(nextS));
  const nextDue = new Date(now.getTime() + intervalDays * 24 * 3600 * 1000);
  nextDue.setHours(5, 0, 0, 0);

  return {
    ...current,
    stage: 'manzil',
    stability: nextS,
    difficulty: nextD,
    reps: current.reps + 1,
    lastReviewedAt: now.toISOString(),
    dueAt: nextDue.toISOString(),
    lastMistakeCount: mistakes,
    flaggedAyahKeys,
  };
}

function clampDifficulty(d: number): number {
  return Math.round(Math.min(10, Math.max(1, d)) * 100) / 100;
}

