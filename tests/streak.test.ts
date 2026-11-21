import { describe, expect, it } from 'vitest';
import { DEFAULT_STREAK, badgeFor, normalizeStreak, recordAnswer, streakStatus } from '../src/lib/streak';
import { localDateKey, previousDateKey } from '../src/lib/date';

const day = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h);

describe('streak', () => {
  it('starts at 1 on the first answer and does not double count the same day', () => {
    let s = recordAnswer(DEFAULT_STREAK, true, day(2026, 3, 1));
    expect(s).toMatchObject({ currentStreak: 1, lastCompletedDate: '2026-03-01', totalAnswered: 1, totalCorrect: 1 });
    s = recordAnswer(s, false, day(2026, 3, 1, 22));
    expect(s).toMatchObject({ currentStreak: 1, totalAnswered: 2, totalCorrect: 1 });
  });

  it('increments on consecutive days and resets after a missed day', () => {
    let s = recordAnswer(DEFAULT_STREAK, true, day(2026, 3, 1));
    s = recordAnswer(s, true, day(2026, 3, 2));
    expect(s.currentStreak).toBe(2);
    s = recordAnswer(s, true, day(2026, 3, 4));
    expect(s.currentStreak).toBe(1);
  });

  it('crosses month/year boundaries and DST using local dates', () => {
    expect(previousDateKey(day(2026, 1, 1))).toBe('2025-12-31');
    expect(previousDateKey(day(2026, 3, 1))).toBe('2026-02-28');
    let s = recordAnswer(DEFAULT_STREAK, true, day(2025, 12, 31, 23));
    s = recordAnswer(s, true, day(2026, 1, 1, 0));
    expect(s.currentStreak).toBe(2);
    expect(localDateKey(day(2026, 1, 1, 0))).toBe('2026-01-01');
  });

  it('reports status and badge colors', () => {
    const s = recordAnswer(DEFAULT_STREAK, true, day(2026, 3, 1));
    expect(streakStatus(s, day(2026, 3, 1, 23))).toBe('done');
    expect(badgeFor(s, day(2026, 3, 1)).color).toBe('#2E7D4F');
    expect(streakStatus(s, day(2026, 3, 2))).toBe('pending');
    expect(badgeFor(s, day(2026, 3, 2))).toMatchObject({ text: '1', color: '#D97706' });
    expect(normalizeStreak(s, day(2026, 3, 3)).currentStreak).toBe(0);
    expect(badgeFor(s, day(2026, 3, 3))).toMatchObject({ text: '0', color: '#8C7A6B' });
    expect(badgeFor(DEFAULT_STREAK)).toMatchObject({ text: '0', color: '#8C7A6B' });
  });
});
