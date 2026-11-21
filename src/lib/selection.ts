import type { ProgressMap, Question, QuestionProgress, TopicFilter } from '../types';

export type Rng = () => number;

/** Missed questions come back after this many *other* answered questions (inclusive range). */
export const REQUEUE_MIN = 3;
export const REQUEUE_MAX = 5;

export function filterPool(all: Question[], filter: TopicFilter): Question[] {
  return filter === 'All Topics' ? all : all.filter((q) => q.category === filter);
}

function randomItem<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length) % items.length];
}

/**
 * Smart selection, in priority order:
 *  1. a missed question whose re-queue turn has arrived (earliest due first)
 *  2. an unseen question (random)
 *  3. a missed question that isn't due yet (soonest first) — only when nothing is unseen
 *  4. a mastered question, sampled from the least recently seen third
 * Recently shown questions are skipped whenever the pool is big enough.
 */
export function pickNext(
  pool: Question[],
  progress: ProgressMap,
  turn: number,
  recent: string[],
  rng: Rng = Math.random,
): Question | null {
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];

  // Avoid the last few questions, but always leave at least one candidate.
  const window = Math.min(3, pool.length - 1);
  const avoid = new Set(recent.slice(-window));
  const candidates = pool.filter((q) => !avoid.has(q.id));

  const stateOf = (q: Question): QuestionProgress | undefined => progress[q.id];

  const missed = candidates.filter((q) => stateOf(q)?.status === 'missed');
  const due = missed
    .filter((q) => (stateOf(q)!.dueTurn ?? 0) <= turn)
    .sort((a, b) => (stateOf(a)!.dueTurn ?? 0) - (stateOf(b)!.dueTurn ?? 0));
  if (due.length) return due[0];

  const unseen = candidates.filter((q) => !stateOf(q) || stateOf(q)!.status === 'unseen');
  if (unseen.length) return randomItem(unseen, rng);

  if (missed.length) {
    return [...missed].sort((a, b) => (stateOf(a)!.dueTurn ?? 0) - (stateOf(b)!.dueTurn ?? 0))[0];
  }

  const mastered = [...candidates].sort((a, b) => (stateOf(a)?.lastSeen ?? 0) - (stateOf(b)?.lastSeen ?? 0));
  const oldest = mastered.slice(0, Math.max(1, Math.ceil(mastered.length / 3)));
  return randomItem(oldest, rng);
}

/**
 * Updates a question's progress after an answer. `turnAfter` is the global answer
 * count *including* this answer.
 */
export function applyAnswer(
  prev: QuestionProgress | undefined,
  correct: boolean,
  turnAfter: number,
  now: number = Date.now(),
  rng: Rng = Math.random,
): QuestionProgress {
  const seenCount = (prev?.seenCount ?? 0) + 1;
  const correctCount = (prev?.correctCount ?? 0) + (correct ? 1 : 0);
  if (correct) {
    return { seenCount, correctCount, lastSeen: now, status: 'mastered' };
  }
  const gap = REQUEUE_MIN + Math.floor(rng() * (REQUEUE_MAX - REQUEUE_MIN + 1));
  return { seenCount, correctCount, lastSeen: now, status: 'missed', dueTurn: turnAfter + gap };
}

export interface PoolStats {
  total: number;
  unseen: number;
  missed: number;
  mastered: number;
}

export function poolStats(pool: Question[], progress: ProgressMap): PoolStats {
  const s: PoolStats = { total: pool.length, unseen: 0, missed: 0, mastered: 0 };
  for (const q of pool) {
    const st = progress[q.id]?.status ?? 'unseen';
    s[st]++;
  }
  return s;
}
