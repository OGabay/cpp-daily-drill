import { ArrowRight, BookOpen, Check, Lightbulb, X } from 'lucide-react';
import type { Difficulty, Question } from '../../types';
import { CodeBlock } from './CodeBlock';
import { RichText } from './RichText';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  'Quick Syntax': 'border-[#C9B79F] bg-[#F6EFE4] text-[#6B4A2E]',
  Concept: 'border-[#B9C6D6] bg-[#EEF2F7] text-[#3D5A80]',
  Gotcha: 'border-[#E3B7A0] bg-[#FBEDE5] text-[#9C4A1A]',
};

interface Props {
  question: Question;
  selectedIndex: number | null;
  onAnswer: (i: number) => void;
  onNext: () => void;
}

export function QuestionView({ question: q, selectedIndex, onAnswer, onNext }: Props) {
  const answered = selectedIndex !== null;
  const correct = answered && selectedIndex === q.correctIndex;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3 px-4 pb-3 pt-3">
        {/* Question card */}
        <section className="card animate-rise p-3.5" aria-labelledby="q-prompt">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-accent/25 bg-accent/[0.07] px-2 py-0.5 text-[11px] font-semibold text-accent">
              {q.category === 'AI Generated' && q.subtopic ? `AI · ${q.subtopic}` : q.category}
            </span>
            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${DIFFICULTY_STYLE[q.difficulty]}`}>
              {q.difficulty}
            </span>
          </div>
          <h2 id="q-prompt" className="whitespace-pre-line text-[14px] font-semibold leading-snug text-ink">
            <RichText text={q.prompt} />
          </h2>
          {q.code && (
            <div className="mt-2.5">
              <CodeBlock code={q.code} />
            </div>
          )}
        </section>

        {/* Options */}
        <div className="space-y-2" role="group" aria-label="Answer options">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correctIndex;
            const isChosen = i === selectedIndex;
            let tone = 'border-line bg-card hover:border-accent/60 hover:bg-[#FFF9F1] hover:shadow-warm-lg';
            let chip = 'border-line bg-tint text-muted group-hover:border-accent/50 group-hover:text-accent';
            if (answered) {
              if (isCorrect) {
                tone = 'border-ok bg-ok-bg';
                chip = 'border-ok bg-ok text-white';
              } else if (isChosen) {
                tone = 'border-bad bg-bad-bg';
                chip = 'border-bad bg-bad text-white';
              } else {
                tone = 'border-line/70 bg-card opacity-60';
                chip = 'border-line bg-tint text-muted';
              }
            }
            return (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => onAnswer(i)}
                aria-keyshortcuts={`${i + 1} ${LETTERS[i]}`}
                aria-label={`Option ${LETTERS[i]}`}
                className={`group flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left shadow-warm transition-all disabled:cursor-default ${tone}`}
              >
                <span
                  className={`mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border text-[11.5px] font-bold transition-colors ${chip}`}
                  aria-hidden
                >
                  {answered && isCorrect ? <Check size={13} strokeWidth={3} /> : answered && isChosen ? <X size={13} strokeWidth={3} /> : LETTERS[i]}
                </span>
                <RichText text={opt} className="min-w-0 flex-1 text-[13px] leading-snug text-ink" />
              </button>
            );
          })}
        </div>

        {!answered && (
          <p className="pt-0.5 text-center text-[11px] text-muted">
            Press <kbd className="font-mono">1</kbd>–<kbd className="font-mono">4</kbd> or <kbd className="font-mono">A</kbd>–
            <kbd className="font-mono">D</kbd> to answer
          </p>
        )}

        {/* Explanation & deep dive */}
        {answered && (
          <div className="animate-rise space-y-3" aria-live="polite">
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[13.5px] font-bold ${
                correct ? 'border-ok/40 bg-ok-bg text-ok' : 'border-bad/40 bg-bad-bg text-bad'
              }`}
            >
              {correct ? <Check size={17} strokeWidth={3} /> : <X size={17} strokeWidth={3} />}
              {correct ? 'Correct!' : 'Not quite — here’s why:'}
            </div>

            <section className="card p-3.5">
              <h3 className="label mb-1.5">Explanation</h3>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink">
                <RichText text={q.explanation} />
              </p>
            </section>

            <section className="rounded-xl border border-[#E0CFB8] bg-tint p-3.5 shadow-warm">
              <h3 className="mb-1.5 flex items-center gap-1.5 text-[13px] font-bold text-accent">
                <BookOpen size={15} /> <RichText text={q.deepDive.conceptTitle} />
              </h3>
              <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-ink">
                <RichText text={q.deepDive.details} />
              </p>
              {q.deepDive.interviewTip && (
                <div className="mt-2.5 flex gap-2 rounded-lg border border-[#E8D9C4] bg-card/70 px-2.5 py-2 text-[12.5px] leading-relaxed text-ink">
                  <Lightbulb size={15} className="mt-0.5 shrink-0 text-[#C27C0E]" />
                  <p>
                    <span className="font-semibold text-[#8A5A0B]">Interview tip: </span>
                    <RichText text={q.deepDive.interviewTip} />
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {answered && (
        <div className="sticky bottom-0 z-10 border-t border-line/70 bg-cream/95 px-4 py-2.5 backdrop-blur-sm">
          <button type="button" onClick={onNext} className="btn-primary w-full" autoFocus>
            Next question <ArrowRight size={16} />
            <span className="ml-1 rounded border border-white/30 px-1 text-[10.5px] font-medium opacity-80">Enter</span>
          </button>
        </div>
      )}
    </div>
  );
}
