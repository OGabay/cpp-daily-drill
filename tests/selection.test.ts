import { describe, expect, it } from 'vitest';
import { applyAnswer, pickNext, REQUEUE_MAX, REQUEUE_MIN } from '../src/lib/selection';
import type { ProgressMap, Question } from '../src/types';

const mk = (id: string): Question => ({
  id,
  category: 'Syntax & Methods',
  difficulty: 'Concept',
  prompt: id,
  options: ['a', 'b', 'c', 'd'],
  correctIndex: 0,
  explanation: 'x',
  deepDive: { conceptTitle: 't', details: 'd' },
});
const pool = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map(mk);
const rng0 = () => 0;

describe('selection', () => {
  it('re-queues a missed question 3–5 answers later', () => {
    for (const r of [0, 0.5, 0.999]) {
      const p = applyAnswer(undefined, false, 10, 0, () => r);
      expect(p.status).toBe('missed');
      expect(p.dueTurn! - 10).toBeGreaterThanOrEqual(REQUEUE_MIN);
      expect(p.dueTurn! - 10).toBeLessThanOrEqual(REQUEUE_MAX);
    }
  });

  it('prefers due missed > unseen > not-yet-due missed > mastered', () => {
    const progress: ProgressMap = {
      q1: { seenCount: 1, correctCount: 0, lastSeen: 1, status: 'missed', dueTurn: 5 },
      q2: { seenCount: 1, correctCount: 1, lastSeen: 2, status: 'mastered' },
    };
    expect(pickNext(pool, progress, 4, [], rng0)!.id).not.toBe('q1'); // not due yet -> unseen first
    expect(pickNext(pool, progress, 4, [], rng0)!.id).not.toBe('q2');
    expect(pickNext(pool, progress, 5, [], rng0)!.id).toBe('q1'); // due now

    const allSeen: ProgressMap = Object.fromEntries(
      pool.map((q, i) => [q.id, { seenCount: 1, correctCount: 1, lastSeen: 100 + i, status: 'mastered' as const }]),
    );
    allSeen.q4 = { seenCount: 1, correctCount: 0, lastSeen: 50, status: 'missed', dueTurn: 99 };
    expect(pickNext(pool, allSeen, 1, [], rng0)!.id).toBe('q4');
    delete (allSeen as Record<string, unknown>).q4;
    allSeen.q4 = { seenCount: 1, correctCount: 1, lastSeen: 1, status: 'mastered' };
    expect(pickNext(pool, allSeen, 1, [], rng0)!.id).toBe('q4'); // least recently seen mastered
  });

  it('avoids recently shown questions but never returns null for a non-empty pool', () => {
    expect(pickNext(pool, {}, 0, ['q1', 'q2', 'q3'], rng0)!.id).toBe('q4');
    expect(pickNext([mk('only')], {}, 0, ['only'])!.id).toBe('only');
    expect(pickNext(pool.slice(0, 2), {}, 0, ['q1'], rng0)!.id).toBe('q2');
    expect(pickNext([], {}, 0, [])).toBeNull();
  });
});
