import type { LlmSettings } from '../types';

export const QUESTIONS_PER_BATCH = 5;

export const MODEL_PRESETS: Record<LlmSettings['provider'], { default: string; suggestions: string[] }> = {
  Anthropic: {
    default: 'claude-opus-5-5',
    suggestions: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-2'],
  },
  OpenAI: {
    default: 'gpt-5-mini',
    suggestions: ['gpt-5-mini', 'gpt-5', 'gpt-4.1-mini', 'gpt-4o-mini'],
  },
};
