import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Download,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ALL_CATEGORIES, CORE_CATEGORIES, type GenStatus, type GenTopic, type LlmSettings, type Provider, type ProgressMap, type Question, type StreakState } from '../../types';
import { MODEL_PRESETS, QUESTIONS_PER_BATCH } from '../../lib/llmConfig';
import { poolStats } from '../../lib/selection';

interface Props {
  settings: LlmSettings;
  onSettingsChange: (s: LlmSettings) => void;
  genStatus: GenStatus;
  onGenerate: () => void;
  questions: Question[];
  progress: ProgressMap;
  streak: StreakState;
  customCount: number;
  onExport: () => void;
  onDeleteCustom: () => Promise<void>;
  onResetProgress: () => Promise<void>;
  onClose: () => void;
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-3.5">
      <h2 className="mb-3 flex items-center gap-1.5 text-[13.5px] font-bold text-ink">
        <span className="text-accent">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A destructive button that asks for an inline second click instead of a dialog. */
function ConfirmButton({ label, confirmLabel, icon, onConfirm, disabled }: { label: string; confirmLabel: string; icon: React.ReactNode; onConfirm: () => Promise<void>; disabled?: boolean }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  if (armed) {
    return (
      <div className="flex gap-1.5">
        <button
          type="button"
          className="btn-ghost border-bad/50 bg-bad-bg text-bad hover:border-bad hover:bg-bad-bg"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onConfirm();
            setBusy(false);
            setArmed(false);
          }}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : icon} {confirmLabel}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setArmed(false)}>
          Cancel
        </button>
      </div>
    );
  }
  return (
    <button type="button" className="btn-ghost" onClick={() => setArmed(true)} disabled={disabled}>
      {icon} {label}
    </button>
  );
}

export function Settings(props: Props) {
  const { settings, onSettingsChange, genStatus, onGenerate, questions, progress, streak, customCount, onClose } = props;
  const [showKey, setShowKey] = useState(false);
  const running = genStatus.state === 'running';

  const setProvider = (provider: Provider) => {
    if (provider === settings.provider) return;
    // Switch to the new provider's default model unless the user typed a custom one for it.
    const otherSuggestions = MODEL_PRESETS[settings.provider].suggestions;
    const model = !settings.model || otherSuggestions.includes(settings.model) ? MODEL_PRESETS[provider].default : settings.model;
    onSettingsChange({ ...settings, provider, model });
  };

  const accuracy = streak.totalAnswered ? Math.round((streak.totalCorrect / streak.totalAnswered) * 100) : 0;

  return (
    <div className="animate-slide-in flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line/70 bg-cream/90 px-3 py-2.5 backdrop-blur-sm">
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-tint hover:text-accent" aria-label="Back to quiz">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[14.5px] font-bold text-ink">Settings &amp; Stats</h1>
      </header>

      <div className="space-y-3 px-4 py-3">
        {/* ---------------- Generator ---------------- */}
        <Section icon={<Sparkles size={16} />} title="LLM Question Generator (optional)">
          <div className="space-y-2.5">
            <div>
              <span className="label">Provider</span>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-tint p-1">
                {(['Anthropic', 'OpenAI'] as Provider[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`rounded-md py-1 text-[12.5px] font-semibold transition-colors ${
                      settings.provider === p ? 'bg-card text-accent shadow-warm' : 'text-muted hover:text-ink'
                    }`}
                    aria-pressed={settings.provider === p}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="api-key">
                API key
              </label>
              <div className="relative">
                <KeyRound size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  className="field pl-8 pr-9 font-mono text-[12px]"
                  placeholder={settings.provider === 'Anthropic' ? 'sk-ant-…' : 'sk-…'}
                  value={settings.apiKey}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => onSettingsChange({ ...settings, apiKey: e.target.value.trim() })}
                />
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-accent"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted">
                Stored only in this browser (<code className="inline-code">chrome.storage.local</code>) and sent only to{' '}
                {settings.provider === 'Anthropic' ? 'api.anthropic.com' : 'api.openai.com'}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label" htmlFor="model">
                  Model
                </label>
                <input
                  id="model"
                  list="model-suggestions"
                  className="field font-mono text-[12px]"
                  value={settings.model}
                  spellCheck={false}
                  onChange={(e) => onSettingsChange({ ...settings, model: e.target.value.trim() })}
                />
                <datalist id="model-suggestions">
                  {MODEL_PRESETS[settings.provider].suggestions.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="label" htmlFor="gen-topic">
                  Topic
                </label>
                <select
                  id="gen-topic"
                  className="field cursor-pointer"
                  value={settings.genTopic}
                  onChange={(e) => onSettingsChange({ ...settings, genTopic: e.target.value as GenTopic })}
                >
                  <option value="Mixed">Mixed</option>
                  {CORE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="button" className="btn-primary w-full" disabled={running || !settings.apiKey} onClick={onGenerate}>
              {running ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {running ? 'Generating…' : `Generate ${QUESTIONS_PER_BATCH} New Questions`}
            </button>

            {genStatus.state !== 'idle' && genStatus.message && (
              <div
                role="status"
                className={`flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] leading-snug ${
                  genStatus.state === 'error'
                    ? 'border-bad/40 bg-bad-bg text-bad'
                    : genStatus.state === 'done'
                      ? 'border-ok/40 bg-ok-bg text-ok'
                      : 'border-line bg-tint text-muted'
                }`}
              >
                {genStatus.state === 'error' ? (
                  <AlertTriangle size={14} className="mt-px shrink-0" />
                ) : genStatus.state === 'done' ? (
                  <CheckCircle2 size={14} className="mt-px shrink-0" />
                ) : (
                  <Loader2 size={14} className="mt-px shrink-0 animate-spin" />
                )}
                <span>
                  {genStatus.message}
                  {running && ' This runs in the background — you can close the popup.'}
                </span>
              </div>
            )}
            <p className="text-[11px] leading-snug text-muted">
              New questions are validated, saved under <b>AI Generated</b>, and join the quiz pool right away. Treat them as
              drafts — the curated bank is hand-checked; generated ones are not.
            </p>
          </div>
        </Section>

        {/* ---------------- Stats ---------------- */}
        <Section icon={<BarChart3 size={16} />} title="Your stats">
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-line bg-tint/60 py-2">
              <div className="flex items-center justify-center gap-1 text-[18px] font-bold text-ink">
                <Flame size={16} className="text-accent" />
                {streak.currentStreak}
              </div>
              <div className="text-[10.5px] uppercase tracking-wide text-muted">day streak</div>
            </div>
            <div className="rounded-lg border border-line bg-tint/60 py-2">
              <div className="text-[18px] font-bold text-ink">{streak.totalAnswered}</div>
              <div className="text-[10.5px] uppercase tracking-wide text-muted">answered</div>
            </div>
            <div className="rounded-lg border border-line bg-tint/60 py-2">
              <div className="text-[18px] font-bold text-ink">{accuracy}%</div>
              <div className="text-[10.5px] uppercase tracking-wide text-muted">accuracy</div>
            </div>
          </div>
          <div className="space-y-2">
            {ALL_CATEGORIES.map((cat) => {
              const s = poolStats(
                questions.filter((q) => q.category === cat),
                progress,
              );
              if (s.total === 0 && cat === 'AI Generated') return null;
              const pct = (n: number) => (s.total ? (n / s.total) * 100 : 0);
              return (
                <div key={cat}>
                  <div className="mb-0.5 flex justify-between text-[12px]">
                    <span className="font-medium text-ink">{cat}</span>
                    <span className="tabular-nums text-muted">
                      {s.mastered}/{s.total} mastered{s.missed ? ` · ${s.missed} to review` : ''}
                    </span>
                  </div>
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-grid" aria-hidden>
                    <div className="bg-ok" style={{ width: `${pct(s.mastered)}%` }} />
                    <div className="bg-bad/70" style={{ width: `${pct(s.missed)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ---------------- Data ---------------- */}
        <Section icon={<Download size={16} />} title="Your data">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={props.onExport}>
              <Download size={14} /> Export JSON
            </button>
            <ConfirmButton
              label={`Delete AI questions (${customCount})`}
              confirmLabel="Delete them"
              icon={<Trash2 size={14} />}
              onConfirm={props.onDeleteCustom}
              disabled={customCount === 0}
            />
            <ConfirmButton label="Reset progress & streak" confirmLabel="Reset everything" icon={<RotateCcw size={14} />} onConfirm={props.onResetProgress} />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-muted">
            Export includes progress, streak and AI-generated questions — never your API key.
          </p>
        </Section>
      </div>
    </div>
  );
}
