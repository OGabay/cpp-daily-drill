import { Fragment } from 'react';

/** Renders text with `backtick` spans as inline code. Newlines are preserved by the caller's CSS. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split('`');
  // An unmatched trailing backtick: render it literally rather than swallowing the rest.
  const balanced = parts.length % 2 === 1;
  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isCode = i % 2 === 1 && (balanced || i < parts.length - 1);
        if (isCode) {
          return (
            <code key={i} className="inline-code">
              {part}
            </code>
          );
        }
        return <Fragment key={i}>{!balanced && i === parts.length - 1 && i > 0 ? '`' + part : part}</Fragment>;
      })}
    </span>
  );
}
