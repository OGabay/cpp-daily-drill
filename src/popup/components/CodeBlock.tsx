import { useMemo } from 'react';
import hljs from 'highlight.js/lib/core';
import cpp from 'highlight.js/lib/languages/cpp';

hljs.registerLanguage('cpp', cpp);

export function CodeBlock({ code }: { code: string }) {
  // highlight.js escapes the source, so the returned HTML is safe to inject.
  const html = useMemo(() => hljs.highlight(code, { language: 'cpp', ignoreIllegals: true }).value, [code]);
  return (
    <div className="code-block" tabIndex={0} aria-label="C++ code snippet">
      <pre>
        <code className="hljs language-cpp" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
