/**
 * WaniKani 9-Stage Spaced Repetition Scheduler & Progressive Level Unlock Engine
 */

export type WaniKaniStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface WaniKaniStageMeta {
  stage: WaniKaniStage;
  name: string;
  bucket: 'Lesson' | 'Apprentice' | 'Guru' | 'Master' | 'Enlightened' | 'Burned';
  intervalHours: number | null;
}

export const WANIKANI_STAGES: Record<WaniKaniStage, WaniKaniStageMeta> = {
  0: { stage: 0, name: 'Lesson', bucket: 'Lesson', intervalHours: 0 },
  1: { stage: 1, name: 'Apprentice I', bucket: 'Apprentice', intervalHours: 4 },
  2: { stage: 2, name: 'Apprentice II', bucket: 'Apprentice', intervalHours: 8 },
  3: { stage: 3, name: 'Apprentice III', bucket: 'Apprentice', intervalHours: 23 },
  4: { stage: 4, name: 'Apprentice IV', bucket: 'Apprentice', intervalHours: 47 },
  5: { stage: 5, name: 'Guru I', bucket: 'Guru', intervalHours: 24 * 7 - 1 },
  6: { stage: 6, name: 'Guru II', bucket: 'Guru', intervalHours: 24 * 14 - 1 },
  7: { stage: 7, name: 'Master', bucket: 'Master', intervalHours: 24 * 30 - 1 },
  8: { stage: 8, name: 'Enlightened', bucket: 'Enlightened', intervalHours: 24 * 120 - 1 },
  9: { stage: 9, name: 'Burned', bucket: 'Burned', intervalHours: null },
};

export interface WaniKaniReviewOutcome {
  previousStage: WaniKaniStage;
  newStage: WaniKaniStage;
  nextReviewAt: string | null; // ISO timestamp, null when Burned
  reachedGuruFirstTime: boolean;
}

/**
 * Calculates the next SRS stage and due timestamp (rounded down to the top of the hour,
 * matching WaniKani's hourly review batches).
 */
export function calculateNextWaniKaniStage(
  currentStage: WaniKaniStage,
  incorrectAnswersCount: number,
  previouslyGuru: boolean,
  now: Date = new Date()
): WaniKaniReviewOutcome {
  let newStage: WaniKaniStage;

  if (currentStage === 0) {
    // Completed initial lesson quiz -> enters Apprentice I
    newStage = 1;
  } else if (incorrectAnswersCount === 0) {
    newStage = Math.min(9, currentStage + 1) as WaniKaniStage;
  } else {
    const penaltyFactor = currentStage >= 5 ? 2 : 1;
    const drop = Math.ceil(incorrectAnswersCount / 2) * penaltyFactor;
    newStage = Math.max(1, currentStage - drop) as WaniKaniStage;
  }

  const stageMeta = WANIKANI_STAGES[newStage];
  let nextReviewAt: string | null = null;

  if (stageMeta.intervalHours !== null) {
    const dueDate = new Date(now.getTime() + stageMeta.intervalHours * 3600 * 1000);
    // Round to start of the hour like WaniKani
    dueDate.setMinutes(0, 0, 0);
    nextReviewAt = dueDate.toISOString();
  }

  return {
    previousStage: currentStage,
    newStage,
    nextReviewAt,
    reachedGuruFirstTime: !previouslyGuru && newStage >= 5,
  };
}

