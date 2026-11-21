import Anthropic from '@anthropic-ai/sdk';
import type { GenTopic, LlmSettings, Question } from '../types';
import { GENERATED_QUESTIONS_SCHEMA, validateGenerated, type ValidationResult } from './validate';
import { MODEL_PRESETS, QUESTIONS_PER_BATCH } from './llmConfig';

export { MODEL_PRESETS, QUESTIONS_PER_BATCH };

// Models that accept the server-side refusal fallback (`fallbacks: "default"`).
const FALLBACK_CAPABLE = new Set(['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-2', 'claude-fable-5-1', 'claude-sonnet-5-5']);

const SYSTEM_PROMPT = `You are a senior C++ engineer who writes technical interview drill questions.
Rules:
- Target modern C++ (C++17/C++20) as used in coding interviews: practical syntax, STL behavior and complexity, algorithms/iterators, memory and object lifetime.
- Every question must have exactly ONE unambiguously correct option under the ISO C++ standard. Traps must be plausible, real mistakes candidates make.
- Code snippets must be short (<= 14 lines), compile as written unless the question is explicitly about a compile error, and assume the needed #includes and "using std" is NOT in effect (write std:: explicitly).
- Use \`backticks\` for inline code in prompts, options, explanations and deep dives.
- Never label options (no "A)", "1."), and never refer to options by letter or position in explanations — the options will be shuffled.
- Explanations: 2–4 sentences covering why the answer is right and why the traps fail.
- deepDive.details: the general rule, guarantee, or complexity behind the question (3–6 sentences). interviewTip: one practical sentence, or "" if none.
- If a snippet is not needed, set "code" to "".`;

function topicLine(topic: GenTopic): string {
  if (topic === 'Mixed')
    return 'Spread the questions across these subtopics: Syntax & Methods, STL Containers, Algorithms & Iterators, Memory & Modern C++.';
  return `All questions must be in the subtopic "${topic}" (set "subtopic" accordingly).`;
}

function buildUserPrompt(topic: GenTopic, avoidTitles: string[]): string {
  const avoid = avoidTitles.length
    ? `\nThe user already has questions on these concepts — pick different angles or concepts:\n${avoidTitles
        .slice(0, 80)
        .map((t) => `- ${t}`)
        .join('\n')}`
    : '';
  return `Generate ${QUESTIONS_PER_BATCH} new multiple-choice C++ interview drill questions.
${topicLine(topic)}
Mix difficulties: "Quick Syntax" (muscle-memory syntax/method signatures), "Concept" (rules, complexity, guarantees), "Gotcha" (subtle traps, UB, surprising output).${avoid}
Return JSON matching the provided schema: {"questions": [...]}.`;
}

export class GenerationError extends Error {}

async function callAnthropic(settings: LlmSettings, user: string): Promise<string> {
  const client = new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
  const model = settings.model.trim() || MODEL_PRESETS.Anthropic.default;
  const useFallbacks = FALLBACK_CAPABLE.has(model);
  try {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: user }],
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: GENERATED_QUESTIONS_SCHEMA as unknown as Record<string, unknown> },
      },
      ...(useFallbacks ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    });
    if (response.stop_reason === 'refusal') {
      throw new GenerationError(
        `The model declined the request${response.stop_details?.explanation ? `: ${response.stop_details.explanation}` : '.'}`,
      );
    }
    if (response.stop_reason === 'max_tokens') throw new GenerationError('The response was cut off (max_tokens). Try again.');
    const text = response.content
      .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
      .map((b) => b.text)
      .join('');
    if (!text) throw new GenerationError('The model returned no text.');
    return text;
  } catch (err) {
    if (err instanceof GenerationError) throw err;
    if (err instanceof Anthropic.AuthenticationError) throw new GenerationError('Anthropic rejected the API key (401).');
    if (err instanceof Anthropic.PermissionDeniedError) throw new GenerationError('This API key cannot use that model (403).');
    if (err instanceof Anthropic.NotFoundError) throw new GenerationError(`Unknown Anthropic model "${model}" (404).`);
    if (err instanceof Anthropic.RateLimitError) throw new GenerationError('Rate limited by Anthropic (429). Wait a minute and retry.');
    if (err instanceof Anthropic.BadRequestError) throw new GenerationError(`Anthropic rejected the request: ${err.message}`);
    if (err instanceof Anthropic.APIConnectionError) throw new GenerationError('Could not reach api.anthropic.com. Check your connection.');
    if (err instanceof Anthropic.APIError) throw new GenerationError(`Anthropic API error ${err.status ?? ''}: ${err.message}`);
    throw err;
  }
}

async function callOpenAI(settings: LlmSettings, user: string): Promise<string> {
  const model = settings.model.trim() || MODEL_PRESETS.OpenAI.default;
  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: user },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'cpp_drill_questions', strict: true, schema: GENERATED_QUESTIONS_SCHEMA },
        },
      }),
    });
  } catch {
    throw new GenerationError('Could not reach api.openai.com. Check your connection.');
  }
  const body = (await res.json().catch(() => null)) as
    | { error?: { message?: string }; choices?: { message?: { content?: string | null; refusal?: string | null }; finish_reason?: string }[] }
    | null;
  if (!res.ok) {
    const msg = body?.error?.message ?? res.statusText;
    if (res.status === 401) throw new GenerationError('OpenAI rejected the API key (401).');
    if (res.status === 429) throw new GenerationError(`Rate limited / quota exceeded at OpenAI (429): ${msg}`);
    throw new GenerationError(`OpenAI API error ${res.status}: ${msg}`);
  }
  const choice = body?.choices?.[0];
  if (choice?.message?.refusal) throw new GenerationError(`The model declined the request: ${choice.message.refusal}`);
  if (choice?.finish_reason === 'length') throw new GenerationError('The response was cut off (length). Try again.');
  const text = choice?.message?.content;
  if (!text) throw new GenerationError('OpenAI returned an empty response.');
  return text;
}

/** Calls the configured provider, then parses + validates the JSON into ready-to-store questions. */
export async function generateQuestions(settings: LlmSettings, existing: Question[]): Promise<ValidationResult> {
  if (!settings.apiKey.trim()) throw new GenerationError('Add an API key first.');
  const relevant =
    settings.genTopic === 'Mixed'
      ? existing
      : existing.filter((q) => q.category === settings.genTopic || q.subtopic === settings.genTopic);
  const user = buildUserPrompt(settings.genTopic, [...new Set(relevant.map((q) => q.deepDive.conceptTitle))]);

  const text = settings.provider === 'Anthropic' ? await callAnthropic(settings, user) : await callOpenAI(settings, user);

  let parsed: unknown;
  try {
    // Tolerate an accidental ```json fence.
    parsed = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, ''));
  } catch {
    throw new GenerationError('The model returned invalid JSON.');
  }
  return validateGenerated(
    parsed,
    existing.map((q) => q.prompt + '\n' + (q.code ?? '')),
    `ai-${Date.now().toString(36)}`,
  );
}
