import { describe, expect, it } from 'vitest';
import { validateGenerated } from '../src/lib/validate';

const good = {
  subtopic: 'STL Containers',
  difficulty: 'Gotcha',
  prompt: 'What does `v.size()` return?',
  code: '',
  options: ['A) `0`', '`1`', '`2`', '`3`'],
  correctIndex: 2,
  explanation: 'Because.',
  deepDive: { conceptTitle: 'Size', details: 'Details.', interviewTip: '' },
};

describe('validateGenerated', () => {
  it('accepts valid questions, shuffles options and keeps the right answer', () => {
    const r = validateGenerated({ questions: [good] }, [], 'ai-x', () => 0.3);
    expect(r.rejected).toEqual([]);
    const q = r.questions[0];
    expect(q.category).toBe('AI Generated');
    expect(q.subtopic).toBe('STL Containers');
    expect(q.options[q.correctIndex]).toBe('`2`');
    expect(q.options).toContain('`0`'); // "A) " label stripped
    expect(q.code).toBeUndefined();
    expect(q.deepDive.interviewTip).toBeUndefined();
  });

  it('rejects malformed entries and duplicates', () => {
    const r = validateGenerated(
      {
        questions: [
          { ...good, options: ['a', 'b', 'c'] },
          { ...good, correctIndex: 4 },
          { ...good, subtopic: 'Python' },
          { ...good, options: ['a', 'a', 'b', 'c'] },
          good,
          good,
        ],
      },
      [],
      'ai-x',
    );
    expect(r.questions).toHaveLength(1);
    expect(r.rejected.map((x) => x.index)).toEqual([0, 1, 2, 3, 5]);
    const dup = validateGenerated({ questions: [good] }, [good.prompt + '\n'], 'ai-y');
    expect(dup.questions).toHaveLength(0);
    expect(validateGenerated({ nope: 1 }, [], 'z').rejected[0].index).toBe(-1);
  });
});
