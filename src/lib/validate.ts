import { CORE_CATEGORIES, DIFFICULTIES, type CoreCategory, type Difficulty, type Question } from '../types';

/** Shape the LLM is asked to return (one entry per question). Optional fields are "" when absent. */
export interface RawGeneratedQuestion {
  subtopic: string;
  difficulty: string;
  prompt: string;
  code: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  deepDive: { conceptTitle: string; details: string; interviewTip: string };
}

/**
 * Strict JSON schema shared by both providers (OpenAI strict mode and Anthropic structured outputs):
 * every property required, no additional properties. Array length and index range are enforced
 * in `validateGenerated` because not every provider supports minItems/maxItems/minimum.
 */
export const GENERATED_QUESTIONS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['questions'],
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['subtopic', 'difficulty', 'prompt', 'code', 'options', 'correctIndex', 'explanation', 'deepDive'],
        properties: {
          subtopic: { type: 'string', enum: CORE_CATEGORIES },
          difficulty: { type: 'string', enum: DIFFICULTIES },
          prompt: { type: 'string', description: 'The question. Inline code in `backticks`.' },
          code: { type: 'string', description: 'Optional C++ snippet (plain text, newlines allowed). Empty string if none.' },
          options: {
            type: 'array',
            description: 'Exactly 4 answer options. Inline code in `backticks`. Never prefix with A)/1. etc.',
            items: { type: 'string' },
          },
          correctIndex: { type: 'integer', description: '0-based index of the single correct option (0..3).' },
          explanation: {
            type: 'string',
            description: 'Why the correct option is right and why each trap is wrong. Do not refer to options by letter or position.',
          },
          deepDive: {
            type: 'object',
            additionalProperties: false,
            required: ['conceptTitle', 'details', 'interviewTip'],
            properties: {
              conceptTitle: { type: 'string' },
              details: { type: 'string', description: 'The underlying C++ rule, complexity, or standard guarantee.' },
              interviewTip: { type: 'string', description: 'Practical interview tip. Empty string if none.' },
            },
          },
        },
      },
    },
  },
} as const;

const isStr = (v: unknown): v is string => typeof v === 'string';
const nonEmpty = (v: unknown): v is string => isStr(v) && v.trim().length > 0;
const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export interface ValidationResult {
  questions: Question[];
  rejected: { index: number; reason: string }[];
}

function checkOne(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return 'not an object';
  const q = raw as Partial<RawGeneratedQuestion>;
  if (!CORE_CATEGORIES.includes(q.subtopic as CoreCategory)) return `invalid subtopic "${String(q.subtopic)}"`;
  if (!DIFFICULTIES.includes(q.difficulty as Difficulty)) return `invalid difficulty "${String(q.difficulty)}"`;
  if (!nonEmpty(q.prompt)) return 'empty prompt';
  if (q.code !== undefined && !isStr(q.code)) return 'code must be a string';
  if (!Array.isArray(q.options) || q.options.length !== 4) return 'options must have exactly 4 entries';
  if (!q.options.every(nonEmpty)) return 'options must be non-empty strings';
  if (new Set(q.options.map(normalize)).size !== 4) return 'options must be distinct';
  if (!Number.isInteger(q.correctIndex) || (q.correctIndex as number) < 0 || (q.correctIndex as number) > 3)
    return 'correctIndex must be an integer 0–3';
  if (!nonEmpty(q.explanation)) return 'empty explanation';
  const dd = q.deepDive;
  if (!dd || !nonEmpty(dd.conceptTitle) || !nonEmpty(dd.details)) return 'deepDive needs conceptTitle and details';
  if (dd.interviewTip !== undefined && !isStr(dd.interviewTip)) return 'interviewTip must be a string';
  return null;
}

/** Fisher–Yates shuffle of the options, remapping correctIndex (LLMs over-pick certain positions). */
function shuffleOptions(options: string[], correctIndex: number, rng: () => number) {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    options: order.map((i) => options[i].trim()) as Question['options'],
    correctIndex: order.indexOf(correctIndex) as Question['correctIndex'],
  };
}

/** Strips a leading "A) ", "B. ", "1) " label in case the model added one anyway. */
function stripLabel(opt: string): string {
  return opt.replace(/^\s*(?:[A-Da-d]|[1-4])[).:]\s+/, '');
}

export function validateGenerated(
  payload: unknown,
  existingPrompts: string[],
  idPrefix: string,
  rng: () => number = Math.random,
): ValidationResult {
  const result: ValidationResult = { questions: [], rejected: [] };
  const list = (payload as { questions?: unknown })?.questions;
  if (!Array.isArray(list)) {
    result.rejected.push({ index: -1, reason: 'response is missing a "questions" array' });
    return result;
  }
  const seen = new Set(existingPrompts.map(normalize));
  list.forEach((raw, index) => {
    const reason = checkOne(raw);
    if (reason) {
      result.rejected.push({ index, reason });
      return;
    }
    const q = raw as RawGeneratedQuestion;
    const key = normalize(q.prompt + '\n' + (q.code ?? ''));
    if (seen.has(key)) {
      result.rejected.push({ index, reason: 'duplicate of an existing question' });
      return;
    }
    seen.add(key);
    const { options, correctIndex } = shuffleOptions(q.options.map(stripLabel), q.correctIndex, rng);
    const code = q.code?.trim() ? q.code.replace(/\s+$/, '') : undefined;
    const tip = q.deepDive.interviewTip?.trim();
    result.questions.push({
      id: `${idPrefix}-${index}`,
      category: 'AI Generated',
      subtopic: q.subtopic as CoreCategory,
      difficulty: q.difficulty as Difficulty,
      prompt: q.prompt.trim(),
      ...(code ? { code } : {}),
      options,
      correctIndex,
      explanation: q.explanation.trim(),
      deepDive: {
        conceptTitle: q.deepDive.conceptTitle.trim(),
        details: q.deepDive.details.trim(),
        ...(tip ? { interviewTip: tip } : {}),
      },
    });
  });
  return result;
}

/** Validates a question already in our own format (used for imported/stored custom questions). */
export function isValidQuestion(q: unknown): q is Question {
  if (!q || typeof q !== 'object') return false;
  const x = q as Question;
  return (
    nonEmpty(x.id) &&
    nonEmpty(x.prompt) &&
    Array.isArray(x.options) &&
    x.options.length === 4 &&
    x.options.every(nonEmpty) &&
    [0, 1, 2, 3].includes(x.correctIndex) &&
    nonEmpty(x.explanation) &&
    !!x.deepDive &&
    nonEmpty(x.deepDive.conceptTitle) &&
    nonEmpty(x.deepDive.details)
  );
}
