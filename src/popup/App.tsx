import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Sparkles, Trophy } from 'lucide-react';
import { SEED_QUESTIONS } from '../data/questions';
import type { LlmSettings, Question, TopicFilter } from '../types';
import * as store from '../lib/storage';
import type { StorageSchema } from '../lib/storage';
import { applyAnswer, filterPool, pickNext, poolStats } from '../lib/selection';
import { normalizeStreak, recordAnswer, streakStatus } from '../lib/streak';
import { refreshBadge } from '../lib/badge';
import { isValidQuestion } from '../lib/validate';
import { Header } from './components/Header';
import { QuestionView } from './components/QuestionView';
import { Settings } from './components/Settings';

const RECENT_LIMIT = 8;

export function App() {
  const [data, setData] = useState<StorageSchema | null>(null);
  const [view, setView] = useState<'quiz' | 'settings'>('quiz');
  const dataRef = useRef<StorageSchema | null>(null);
  dataRef.current = data;

  /** Merges values into local state and persists them. */
  const save = useCallback(async (patch: Partial<StorageSchema>) => {
    setData((d) => (d ? { ...d, ...patch } : d));
    await store.set(patch);
  }, []);

  const allQuestions: Question[] = useMemo(
    () => [...SEED_QUESTIONS, ...(data?.customQuestions ?? []).filter(isValidQuestion)],
    [data?.customQuestions],
  );
  const byId = useMemo(() => new Map(allQuestions.map((q) => [q.id, q])), [allQuestions]);

  // ---------- initial load ----------
  useEffect(() => {
    (async () => {
      const loaded = await store.getAll();
      loaded.streak = normalizeStreak(loaded.streak);
      setData(loaded);
      void refreshBadge();
    })();
    // Live updates from the background worker (generation status, new questions, streak repaint).
    return store.onChange(['customQuestions', 'genStatus', 'streak'], (changed) =>
      setData((d) => (d ? { ...d, ...changed } : d)),
    );
  }, []);

  // ---------- make sure there is a current question for the active filter ----------
  useEffect(() => {
    if (!data) return;
    const { session, progress } = data;
    const pool = filterPool(allQuestions, session.topicFilter);
    const current = session.currentId ? byId.get(session.currentId) : undefined;
    const valid = current && pool.some((q) => q.id === current.id);
    if (valid) return;
    const next = pickNext(pool, progress, session.turn, session.recent);
    if (!next && session.currentId === null) return;
    void save({
      session: {
        ...session,
        currentId: next?.id ?? null,
        selectedIndex: null,
        recent: next ? [...session.recent, next.id].slice(-RECENT_LIMIT) : session.recent,
      },
    });
  }, [data, allQuestions, byId, save]);

  const question = data?.session.currentId ? byId.get(data.session.currentId) ?? null : null;
  const selectedIndex = data?.session.selectedIndex ?? null;

  // ---------- actions ----------
  const answer = useCallback(
    async (i: number) => {
      const d = dataRef.current;
      if (!d || !question || d.session.selectedIndex !== null) return;
      const correct = i === question.correctIndex;
      const turnAfter = d.session.turn + 1;
      await save({
        progress: { ...d.progress, [question.id]: applyAnswer(d.progress[question.id], correct, turnAfter) },
        streak: recordAnswer(d.streak, correct),
        session: { ...d.session, selectedIndex: i, turn: turnAfter },
      });
      void refreshBadge();
    },
    [question, save],
  );

  const next = useCallback(async () => {
    const d = dataRef.current;
    if (!d) return;
    const pool = filterPool(allQuestions, d.session.topicFilter);
    const q = pickNext(pool, d.progress, d.session.turn, d.session.recent);
    await save({
      session: {
        ...d.session,
        currentId: q?.id ?? null,
        selectedIndex: null,
        recent: q ? [...d.session.recent, q.id].slice(-RECENT_LIMIT) : d.session.recent,
      },
    });
    window.scrollTo({ top: 0 });
    document.body.scrollTop = 0;
  }, [allQuestions, save]);

  const changeFilter = useCallback(
    async (topicFilter: TopicFilter) => {
      const d = dataRef.current;
      if (!d) return;
      const pool = filterPool(allQuestions, topicFilter);
      const current = d.session.currentId ? byId.get(d.session.currentId) : undefined;
      // Keep an unanswered current question if it still fits the new filter; otherwise draw a new one.
      const keep = current && d.session.selectedIndex === null && pool.some((q) => q.id === current.id);
      const q = keep ? current : pickNext(pool, d.progress, d.session.turn, d.session.recent);
      await save({
        session: {
          ...d.session,
          topicFilter,
          currentId: q?.id ?? null,
          selectedIndex: keep ? d.session.selectedIndex : null,
          recent: q && !keep ? [...d.session.recent, q.id].slice(-RECENT_LIMIT) : d.session.recent,
        },
      });
    },
    [allQuestions, byId, save],
  );

  const generate = useCallback(async () => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      await save({ genStatus: { state: 'error', message: 'Generation only runs inside the installed extension.', at: Date.now() } });
      return;
    }
    setData((d) => (d ? { ...d, genStatus: { state: 'running', message: 'Generating 5 questions…', at: Date.now() } } : d));
    try {
      await chrome.runtime.sendMessage({ type: 'generate-questions' });
    } catch (err) {
      await save({ genStatus: { state: 'error', message: `Could not reach the background worker: ${(err as Error).message}`, at: Date.now() } });
    }
  }, [save]);

  const exportData = useCallback(() => {
    const d = dataRef.current;
    if (!d) return;
    const payload = {
      app: 'cpp-daily-drill',
      exportedAt: new Date().toISOString(),
      streak: d.streak,
      progress: d.progress,
      customQuestions: d.customQuestions,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `cpp-daily-drill-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const deleteCustom = useCallback(async () => {
    const d = dataRef.current;
    if (!d) return;
    const ids = new Set(d.customQuestions.map((q) => q.id));
    const progress = Object.fromEntries(Object.entries(d.progress).filter(([id]) => !ids.has(id)));
    await save({ customQuestions: [], progress });
  }, [save]);

  const resetProgress = useCallback(async () => {
    const d = dataRef.current;
    if (!d) return;
    await save({
      progress: store.DEFAULTS.progress,
      streak: store.DEFAULTS.streak,
      session: { ...store.DEFAULTS.session, topicFilter: d.session.topicFilter },
    });
    void refreshBadge();
  }, [save]);

  const updateSettings = useCallback((llmSettings: LlmSettings) => void save({ llmSettings }), [save]);

  // ---------- keyboard shortcuts ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (view !== 'quiz' || !question || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const answered = dataRef.current?.session.selectedIndex !== null;
      if (!answered) {
        const k = e.key.toLowerCase();
        const idx = ['1', '2', '3', '4'].indexOf(k) >= 0 ? Number(k) - 1 : ['a', 'b', 'c', 'd'].indexOf(k);
        if (idx >= 0) {
          e.preventDefault();
          void answer(idx);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        // A focused button already handles Enter/Space natively — don't double-advance.
        if (tag === 'BUTTON') return;
        e.preventDefault();
        void next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, question, answer, next]);

  // ---------- render ----------
  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        <Loader2 className="animate-spin" size={22} />
      </div>
    );
  }

  const streak = normalizeStreak(data.streak);
  const pool = filterPool(allQuestions, data.session.topicFilter);

  if (view === 'settings') {
    return (
      <Settings
        settings={data.llmSettings}
        onSettingsChange={updateSettings}
        genStatus={data.genStatus}
        onGenerate={generate}
        questions={allQuestions}
        progress={data.progress}
        streak={streak}
        customCount={data.customQuestions.length}
        onExport={exportData}
        onDeleteCustom={deleteCustom}
        onResetProgress={resetProgress}
        onClose={() => setView('quiz')}
      />
    );
  }

  return (
    <>
      <Header
        streak={streak.currentStreak}
        status={streakStatus(streak)}
        filter={data.session.topicFilter}
        onFilterChange={(f) => void changeFilter(f)}
        stats={poolStats(pool, data.progress)}
        onOpenSettings={() => setView('settings')}
      />
      {question ? (
        <QuestionView key={question.id} question={question} selectedIndex={selectedIndex} onAnswer={(i) => void answer(i)} onNext={() => void next()} />
      ) : (
        <EmptyState filter={data.session.topicFilter} onOpenSettings={() => setView('settings')} />
      )}
    </>
  );
}

function EmptyState({ filter, onOpenSettings }: { filter: TopicFilter; onOpenSettings: () => void }) {
  const ai = filter === 'AI Generated';
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="card animate-rise max-w-[320px] p-5 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-tint text-accent">
          {ai ? <Sparkles size={20} /> : <Trophy size={20} />}
        </div>
        <h2 className="text-[14px] font-bold text-ink">{ai ? 'No AI-generated questions yet' : 'Nothing here yet'}</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          {ai
            ? 'Add an API key in settings and generate a batch of fresh questions — they’ll show up here.'
            : 'This topic has no questions. Pick another topic from the dropdown.'}
        </p>
        {ai && (
          <button type="button" className="btn-primary mt-3" onClick={onOpenSettings}>
            <Sparkles size={15} /> Open generator
          </button>
        )}
      </div>
    </div>
  );
}
