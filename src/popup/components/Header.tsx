import { CheckCircle2, ChevronDown, Settings, AlertCircle, Sparkles } from 'lucide-react';
import { TOPIC_FILTERS, type TopicFilter } from '../../types';
import type { StreakStatus } from '../../lib/streak';
import type { PoolStats } from '../../lib/selection';

interface Props {
  streak: number;
  status: StreakStatus;
  filter: TopicFilter;
  onFilterChange: (f: TopicFilter) => void;
  stats: PoolStats;
  onOpenSettings: () => void;
}

function StreakPill({ streak, status }: { streak: number; status: StreakStatus }) {
  const tone =
    status === 'done'
      ? 'border-ok/30 bg-ok-bg text-ok'
      : status === 'pending'
        ? 'border-amber/30 bg-amber-bg text-[#A35A05]'
        : 'border-line bg-card text-muted';
  return (
    <div
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${tone}`}
      title={
        status === 'done'
          ? 'You answered today. Streak secured.'
          : status === 'pending'
            ? 'Answer one question today to keep your streak.'
            : 'Answer one question to start a streak.'
      }
    >
      <span aria-hidden>🔥</span>
      <span className="tabular-nums text-ink">{streak}d</span>
      <span className="h-3 w-px bg-current opacity-25" aria-hidden />
      {status === 'done' ? (
        <span className="flex items-center gap-1">
          <CheckCircle2 size={13} strokeWidth={2.5} /> Done today
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <AlertCircle size={13} strokeWidth={2.5} /> {status === 'pending' ? 'Answer 1 to keep streak' : 'Answer 1 to start'}
        </span>
      )}
    </div>
  );
}

export function Header({ streak, status, filter, onFilterChange, stats, onOpenSettings }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-cream/90 px-4 pb-2.5 pt-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <img src="icons/icon48.png" alt="" className="h-7 w-7 rounded-md" />
          <h1 className="whitespace-nowrap text-[14.5px] font-bold tracking-tight text-ink">C++ Daily Drill</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <StreakPill streak={streak} status={status} />
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-tint hover:text-accent"
            aria-label="Settings, generator and stats"
            title="Settings & stats"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as TopicFilter)}
            className="field cursor-pointer appearance-none py-1 pr-8 font-medium"
            aria-label="Topic filter"
          >
            {TOPIC_FILTERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11.5px] text-muted" aria-label="Pool progress">
          {filter === 'AI Generated' && <Sparkles size={13} className="text-accent" />}
          <span title="Never answered">
            <b className="font-semibold text-ink">{stats.unseen}</b> new
          </span>
          <span title="Answered wrong — will come back soon">
            <b className="font-semibold text-bad">{stats.missed}</b> review
          </span>
          <span title="Answered correctly">
            <b className="font-semibold text-ok">{stats.mastered}</b> done
          </span>
        </div>
      </div>
    </header>
  );
}
