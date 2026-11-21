/** @type {import('tailwindcss').Config} */
export default {
  content: ['./popup.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6F0',
        grid: '#EDE4D7',
        card: '#FFFDF9',
        line: '#D6C7B2',
        ink: '#2C221E',
        muted: '#6E5D52',
        accent: { DEFAULT: '#9C4A1A', hover: '#7C3912' },
        tint: '#F4ECE1',
        ok: { DEFAULT: '#2E7D4F', bg: '#EBF7EE' },
        bad: { DEFAULT: '#B83232', bg: '#FDECEC' },
        amber: { DEFAULT: '#D97706', bg: '#FEF3E2' },
        taupe: '#8C7A6B',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      boxShadow: {
        warm: '0 1px 2px rgba(92, 58, 30, 0.06), 0 2px 8px rgba(92, 58, 30, 0.07)',
        'warm-lg': '0 2px 4px rgba(92, 58, 30, 0.08), 0 8px 20px rgba(92, 58, 30, 0.10)',
      },
    },
  },
  plugins: [],
};
