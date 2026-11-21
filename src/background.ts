/// <reference types="chrome" />
import { refreshBadge } from './lib/badge';
import { nextLocalMidnight } from './lib/date';
import { GenerationError, generateQuestions } from './lib/llm';
import { get, set } from './lib/storage';
import { SEED_QUESTIONS } from './data/questions';

const HOURLY_ALARM = 'streak-hourly-check';
const MIDNIGHT_ALARM = 'streak-midnight-check';

function scheduleAlarms(): void {
  chrome.alarms.create(HOURLY_ALARM, { periodInMinutes: 60, delayInMinutes: 1 });
  // A one-shot alarm just after local midnight makes the badge flip from green to amber
  // (or amber to grey) on time instead of up to an hour late.
  chrome.alarms.create(MIDNIGHT_ALARM, { when: nextLocalMidnight() + 5_000 });
}

chrome.runtime.onInstalled.addListener(() => {
  scheduleAlarms();
  void refreshBadge();
});

chrome.runtime.onStartup.addListener(() => {
  scheduleAlarms();
  void refreshBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === MIDNIGHT_ALARM) chrome.alarms.create(MIDNIGHT_ALARM, { when: nextLocalMidnight() + 5_000 });
  if (alarm.name === HOURLY_ALARM || alarm.name === MIDNIGHT_ALARM) void refreshBadge();
});

// The popup writes the streak directly; repaint the badge whenever it changes.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && 'streak' in changes) void refreshBadge();
});

// ---------------- LLM question generation ----------------
// Runs here (not in the popup) so the request survives the popup closing when it loses focus.

const STALE_RUN_MS = 5 * 60_000;

async function runGeneration(): Promise<void> {
  const status = await get('genStatus');
  if (status.state === 'running' && Date.now() - status.at < STALE_RUN_MS) return;
  await set({ genStatus: { state: 'running', message: 'Generating 5 questions…', at: Date.now() } });

  // Long model calls: touch an extension API periodically so Chrome keeps the worker alive.
  const keepAlive = setInterval(() => void chrome.runtime.getPlatformInfo(), 20_000);
  try {
    const [settings, custom] = await Promise.all([get('llmSettings'), get('customQuestions')]);
    const result = await generateQuestions(settings, [...SEED_QUESTIONS, ...custom]);
    if (result.questions.length === 0) {
      const why = result.rejected[0]?.reason ?? 'no questions returned';
      throw new GenerationError(`No valid questions were returned (${why}).`);
    }
    const latest = await get('customQuestions'); // re-read in case of concurrent edits
    await set({ customQuestions: [...latest, ...result.questions] });
    const skipped = result.rejected.length ? ` (${result.rejected.length} rejected by validation)` : '';
    await set({
      genStatus: {
        state: 'done',
        message: `Added ${result.questions.length} new AI question${result.questions.length === 1 ? '' : 's'}${skipped}.`,
        at: Date.now(),
      },
    });
  } catch (err) {
    const message = err instanceof GenerationError ? err.message : `Unexpected error: ${(err as Error)?.message ?? String(err)}`;
    await set({ genStatus: { state: 'error', message, at: Date.now() } });
  } finally {
    clearInterval(keepAlive);
  }
}

chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
  const type = (msg as { type?: string } | null)?.type;
  if (type === 'generate-questions') {
    void runGeneration();
    sendResponse({ started: true });
  } else if (type === 'refresh-badge') {
    void refreshBadge().then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

// Also repaint whenever the worker spins up for any other reason.
void refreshBadge();
