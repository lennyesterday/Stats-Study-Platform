# Stats Quest — Statistical Analysis (2966)

A local, gamified learning platform for the Nova SBE master course **Statistical Analysis** (T2 2026/27).
It guides you with a fixed study plan from **28 Oct 2026** to the exam on **Wed 9 Dec 2026, 14:30 (Lisbon)**.

## Start

```bash
npm install      # first time only
npm run dev      # http://localhost:5173
```

Other commands: `npm test` (Vitest: stats engine, course tables, all content generators, mocks),
`npm run build` (type check + production build into `dist/`), `npm run preview`.

Progress lives in your browser's localStorage. Export a JSON backup regularly (**Settings → Backup**).

## What's inside

| Area | Where |
|---|---|
| Dashboard: countdown, daily quests, plan, streak, heatmap, readiness | `src/pages/Dashboard.tsx` |
| Weeks 1–6: Learn (lessons) + Practice from Stats Study Lab, plus examples, flashcards, exam exercises, boss | `src/course/`, `src/pages/WorldPage.tsx` |
| Course overview (all weeks, parts, concepts) | `src/pages/WorldMap.tsx` |
| Dataset, statistical tables drawer (press T) | `src/pages/Dataset.tsx`, `src/course/Html.tsx`, `public/tables/` |
| Study plan (calendar + list, catch-up, rest days) | `src/content/studyplan.ts`, `src/lib/plan.ts` |
| Flashcards (SM-2, mistakes deck) | `src/pages/Cards.tsx`, `src/lib/srs.ts` |
| Practice (open exercises, interpretation) | `src/pages/Practice.tsx` |
| Table trainer + 60-s sprint (course layout) | `src/pages/Tables.tsx`, `src/lib/tabletasks.ts` |
| Mock exams 1–10 + exam generator | `src/pages/Mocks.tsx`, `src/content/mocks/` |
| Visual lab (CLT, CI, test/power, ANOVA, χ², regression) | `src/pages/Lab.tsx`, `src/components/lab/` |
| Formula sheet (print A4), "Which method?" | `src/pages/Formulas.tsx`, `src/pages/Methods.tsx` |
| XP, levels, badges, quests, streak | `src/lib/game.ts` |
| Stats engine (distributions, tests, ANOVA, χ², regression) | `src/lib/stats.ts` (+ `stats.test.ts`) |

Every number in exercises, worked examples, bosses and mocks is computed by `src/lib/stats.ts`;
critical values are read from the **course tables** (`src/content/tables.ts`, extracted from `materials/tables/*.pdf`).

## Adding content

- **Theory (lessons)**: `src/course/engine.ts`, ported from the Stats Study Lab artifact (`stats-lab-assets`): weeks → parts → concepts (HTML), widgets and practice generators. Design tokens and lesson styles: `src/index.css`, `src/course/course.css`. The previous theory text is archived in `materials/old-theory/theory-backup.json`.
- **Weeks**: `src/content/world1` … `world6` — `examples.ts`, `flashcards.ts`, `exercises.ts` (generators with
  seeded random numbers), `boss.ts`, `index.ts`. Text supports `$math$`, `$$display$$`, `**bold**`, `- lists`.
- **Official mocks**: copy `src/content/mocks/mock-template.example.json` to `src/content/mocks/mockNN.json`
  (e.g. `mock10.json`) and fill in the questions. A JSON file replaces the generated mock with the same number automatically.
  Question types: `numeric`, `cloze` (several inputs), `single`, `truefalse`, `gaps`.
- **Course tables**: after replacing the PDFs in `materials/tables/`, run `python3 scripts/parse_tables.py`.
- **Dataset**: `src/content/dataset.ts` (from `materials/dataset/Data (2).xlsx`).

## Placeholders (replace when the official material is available)

- **Mocks 1–10 are generated** equivalents in Moodle format (marked "generated"); Mock 10 is generated in "official mock" style.
- **Exam rules** (official): open book with paper notes, printed tables and a calculator; 26 multiple-choice questions (20 × 0.70, 6 × 1.00; wrong −10 %); 90 min + 10 min grace; Safe Exam Browser on your own laptop. Mocks still use open answers.
- Socratic "Think about it" questions and course-page summaries exist only for Week 1 from the course page; Weeks 2–6 use own questions.
