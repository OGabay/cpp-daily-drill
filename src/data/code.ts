/** Template tag that strips the common leading indentation from a code snippet (lets snippets be indented in source). */
export const code = (strings: TemplateStringsArray): string => {
  const raw = String.raw({ raw: strings.raw });
  const lines = raw.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
};
