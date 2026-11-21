import { get, set } from './storage';
import { badgeFor, normalizeStreak } from './streak';

/**
 * Reads the streak, persists a reset if a full day was missed, and paints the toolbar badge.
 * Safe to call from both the service worker and the popup.
 */
export async function refreshBadge(now: Date = new Date()): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.action) return;
  const stored = await get('streak');
  const normalized = normalizeStreak(stored, now);
  if (normalized.currentStreak !== stored.currentStreak) await set({ streak: normalized });
  const { text, color, title } = badgeFor(normalized, now);
  await Promise.all([
    chrome.action.setBadgeText({ text }),
    chrome.action.setBadgeBackgroundColor({ color }),
    chrome.action.setBadgeTextColor?.({ color: '#FFFFFF' }),
    chrome.action.setTitle({ title }),
  ]);
}
