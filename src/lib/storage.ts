import type { GenStatus, LlmSettings, ProgressMap, Question, SessionState, StreakState } from '../types';
import { DEFAULT_STREAK } from './streak';

/** Every key this extension stores in chrome.storage.local, with its value type. */
export interface StorageSchema {
  progress: ProgressMap;
  streak: StreakState;
  customQuestions: Question[];
  session: SessionState;
  llmSettings: LlmSettings;
  genStatus: GenStatus;
}
export type StorageKey = keyof StorageSchema;

export const DEFAULTS: StorageSchema = {
  progress: {},
  streak: DEFAULT_STREAK,
  customQuestions: [],
  session: { currentId: null, selectedIndex: null, turn: 0, topicFilter: 'All Topics', recent: [] },
  llmSettings: { provider: 'Anthropic', apiKey: '', model: 'claude-opus-5-5', genTopic: 'Mixed' },
  genStatus: { state: 'idle', message: '', at: 0 },
};

const hasChromeStorage = () => typeof chrome !== 'undefined' && !!chrome.storage?.local;

// localStorage fallback so the popup also runs under `vite dev` in a normal tab.
const LS_PREFIX = 'cppdd:';

export async function getAll(): Promise<StorageSchema> {
  const keys = Object.keys(DEFAULTS) as StorageKey[];
  if (hasChromeStorage()) {
    const got = await chrome.storage.local.get(keys);
    return { ...DEFAULTS, ...(got as Partial<StorageSchema>) };
  }
  const out = { ...DEFAULTS } as Record<StorageKey, unknown>;
  for (const k of keys) {
    const raw = localStorage.getItem(LS_PREFIX + k);
    if (raw) out[k] = JSON.parse(raw);
  }
  return out as unknown as StorageSchema;
}

export async function get<K extends StorageKey>(key: K): Promise<StorageSchema[K]> {
  if (hasChromeStorage()) {
    const got = await chrome.storage.local.get(key);
    return (got[key] as StorageSchema[K] | undefined) ?? DEFAULTS[key];
  }
  const raw = localStorage.getItem(LS_PREFIX + key);
  return raw ? (JSON.parse(raw) as StorageSchema[K]) : DEFAULTS[key];
}

export async function set(values: Partial<StorageSchema>): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set(values);
    return;
  }
  for (const [k, v] of Object.entries(values)) localStorage.setItem(LS_PREFIX + k, JSON.stringify(v));
}

export async function remove(keys: StorageKey[]): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.remove(keys);
    return;
  }
  for (const k of keys) localStorage.removeItem(LS_PREFIX + k);
}

/** Subscribes to changes of the given keys. Returns an unsubscribe function. */
export function onChange(keys: StorageKey[], cb: (changed: Partial<StorageSchema>) => void): () => void {
  if (!hasChromeStorage()) return () => {};
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'local') return;
    const changed: Partial<StorageSchema> = {};
    let any = false;
    for (const k of keys) {
      if (k in changes) {
        (changed as Record<string, unknown>)[k] = changes[k].newValue ?? DEFAULTS[k];
        any = true;
      }
    }
    if (any) cb(changed);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
