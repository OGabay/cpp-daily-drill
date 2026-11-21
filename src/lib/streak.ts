import type { StreakState } from '../types';
import { localDateKey, previousDateKey } from './date';

export const DEFAULT_STREAK: StreakState = {
  currentStreak: 0,
  lastCompletedDate: null,
  totalAnswered: 0,
  totalCorrect: 0,
};

export type StreakStatus = 'done' | 'pending' | 'none';

/**
 * Returns the streak as it stands *now*: if the last completed day is neither today
 * nor yesterday, a full calendar day was missed and the streak is broken (0).
 */
export function normalizeStreak(s: StreakState, now: Date = new Date()): StreakState {
  const today = localDateKey(now);
  const yesterday = previousDateKey(now);
  if (s.currentStreak > 0 && s.lastCompletedDate !== today && s.lastCompletedDate !== yesterday) {
    return { ...s, currentStreak: 0 };
  }
  return s;
}

/** Records one answered question. Only the first answer of a calendar day moves the streak. */
export function recordAnswer(s: StreakState, correct: boolean, now: Date = new Date()): StreakState {
  const today = localDateKey(now);
  const base = normalizeStreak(s, now);
  let currentStreak = base.currentStreak;
  if (base.lastCompletedDate !== today) {
    currentStreak = base.lastCompletedDate === previousDateKey(now) ? base.currentStreak + 1 : 1;
  }
  return {
    currentStreak,
    lastCompletedDate: today,
    totalAnswered: base.totalAnswered + 1,
    totalCorrect: base.totalCorrect + (correct ? 1 : 0),
  };
}

export function streakStatus(s: StreakState, now: Date = new Date()): StreakStatus {
  const n = normalizeStreak(s, now);
  if (n.lastCompletedDate === localDateKey(now)) return 'done';
  if (n.currentStreak > 0) return 'pending';
  return 'none';
}

export const BADGE_COLORS: Record<StreakStatus, string> = {
  done: '#2E7D4F',
  pending: '#D97706',
  none: '#8C7A6B',
};

export function badgeFor(s: StreakState, now: Date = new Date()): { text: string; color: string; title: string } {
  const n = normalizeStreak(s, now);
  const status = streakStatus(n, now);
  const text = String(n.currentStreak);
  const title =
    status === 'done'
      ? `C++ Daily Drill — ${n.currentStreak}-day streak, done today ✓`
      : status === 'pending'
        ? `C++ Daily Drill — answer 1 question to keep your ${n.currentStreak}-day streak`
        : 'C++ Daily Drill — answer a question to start a streak';
  return { text, color: BADGE_COLORS[status], title };
}
