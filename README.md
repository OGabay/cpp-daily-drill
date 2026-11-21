# C++ Daily Drill

A Manifest V3 Chrome extension for daily, AI-free C++ interview practice: one multiple-choice question at a time, a deep-dive explanation after each answer, spaced repetition, and a daily streak on the toolbar badge.

## Install (unpacked)

```bash
npm install
npm run build        # icons → typecheck → popup build → background build, output in dist/
```

Then open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `dist/` folder.

## Scripts

| Command | What it does |
|---|---|
| `npm run build` | Generates icons, typechecks, builds `dist/` |
| `npm test` | Vitest: question-bank integrity, streak, selection, LLM-output validation |
| `npm run icons` | Regenerates `public/icons/*.png` (pure Node, no dependencies) |
| `npm run dev` | Runs the popup in a normal tab (uses `localStorage` instead of `chrome.storage`) |

## How it works

- **Question bank** (`src/data/`): 101 hand-checked C++17/20 questions. 60 core questions (15 per category) plus 41 pure syntax / function-call drills. The drills come from the 16 interview coding patterns (sliding window, two heaps, K-way merge, BFS/DFS, topological sort, subsets, XOR, and so on) and from common STL cheat-sheet idioms. Options are shuffled per question with a fixed seed, so answer positions are evenly spread and stay stable between sessions.
- **Selection** (`src/lib/selection.ts`): questions you missed come back after 3–5 other answers. After that, unseen questions come before mastered ones, and mastered questions are drawn from the least recently seen.
- **Streak and badge** (`src/lib/streak.ts`, `src/background.ts`): one answer per local calendar day keeps the streak alive. The badge is green when you're done for today, amber when the streak is still pending, and taupe at 0. It refreshes on install, on browser startup, every hour, and just after local midnight.
- **Optional LLM generator** (`src/lib/llm.ts`): generates 5 questions with Anthropic (official SDK, structured JSON output) or OpenAI (strict `json_schema`). Each result is validated, shuffled, de-duplicated, and saved under **AI Generated**. Generation runs in the service worker, so closing the popup doesn't cancel it. Your API key is stored only in `chrome.storage.local`.

## Keyboard

`1`–`4` or `A`–`D` to answer · `Enter` / `Space` for the next question.
