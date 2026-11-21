import { describe, expect, it } from 'vitest';
import { SEED_QUESTIONS } from '../src/data/questions';
import { CORE_CATEGORIES } from '../src/types';
import { isValidQuestion } from '../src/lib/validate';

describe('seed question bank', () => {
  it('has at least 60 questions with unique ids', () => {
    expect(SEED_QUESTIONS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(SEED_QUESTIONS.map((q) => q.id)).size).toBe(SEED_QUESTIONS.length);
  });

  it('has 15+ questions in every core category and none marked AI Generated', () => {
    for (const cat of CORE_CATEGORIES) {
      expect(SEED_QUESTIONS.filter((q) => q.category === cat).length, cat).toBeGreaterThanOrEqual(15);
    }
    expect(SEED_QUESTIONS.some((q) => q.category === 'AI Generated')).toBe(false);
  });

  it('puts heavy emphasis on pure syntax: Syntax & Methods is the largest category and ≥40% are Quick Syntax', () => {
    const counts = CORE_CATEGORIES.map((c) => SEED_QUESTIONS.filter((q) => q.category === c).length);
    expect(counts[0]).toBe(Math.max(...counts));
    const quick = SEED_QUESTIONS.filter((q) => q.difficulty === 'Quick Syntax').length;
    expect(quick / SEED_QUESTIONS.length).toBeGreaterThanOrEqual(0.4);
  });

  it.each(SEED_QUESTIONS.map((q) => [q.id, q] as const))('%s is well-formed', (_id, q) => {
    expect(isValidQuestion(q)).toBe(true);
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size).toBe(4);
    expect(q.correctIndex).toBeGreaterThanOrEqual(0);
    expect(q.correctIndex).toBeLessThanOrEqual(3);
    // backticks must be balanced so inline code renders correctly
    for (const text of [q.prompt, ...q.options, q.explanation, q.deepDive.details, q.deepDive.interviewTip ?? '']) {
      expect((text.match(/`/g) ?? []).length % 2, `unbalanced backticks in ${q.id}: ${text}`).toBe(0);
    }
    if (q.code) {
      expect(q.code.startsWith(' ')).toBe(false);
      expect(q.code).not.toMatch(/\t/);
    }
  });

  it('spreads correct answers across positions (no letter is >40% of answers)', () => {
    const counts = [0, 0, 0, 0];
    for (const q of SEED_QUESTIONS) counts[q.correctIndex]++;
    for (const c of counts) expect(c / SEED_QUESTIONS.length).toBeLessThanOrEqual(0.4);
  });
});

describe('answer position spread', () => {
  it('prints the distribution', () => {
    const counts = [0, 0, 0, 0];
    for (const q of SEED_QUESTIONS) counts[q.correctIndex]++;
    console.log('correctIndex distribution A-D:', counts.join(' / '));
    expect(counts.every((c) => c > 0)).toBe(true);
  });
});
