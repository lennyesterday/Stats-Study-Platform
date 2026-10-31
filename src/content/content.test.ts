import { describe, expect, it } from 'vitest';
import { makeRng } from '../lib/rng';
import type { ExerciseInstance } from './types';
import { WORLDS } from './worlds';
import { allPractice, WEEKS } from '../course';

const BAD = /NaN|undefined|Infinity|\[object Object\]/;

function checkInstance(inst: ExerciseInstance, where: string) {
  const text = [inst.prompt, ...inst.hints, ...inst.solution, JSON.stringify(inst.output ?? '')].join('\n');
  expect(text, where).not.toMatch(BAD);
  for (const inp of inst.inputs) {
    if (inp.kind === 'choice') expect(inp.answer >= 0 && inp.answer < inp.options.length, `${where} ${inp.id}`).toBe(true);
    else expect(Number.isFinite(inp.answer), `${where} ${inp.id} = ${inp.answer}`).toBe(true);
  }
}

describe('content', () => {
  it('has 6 weeks with enough material', () => {
    expect(WORLDS).toHaveLength(6);
    for (const w of WORLDS) {
      expect(w.theory.length, `week ${w.id} lesson parts`).toBeGreaterThanOrEqual(2);
      expect(w.examples.length, `world ${w.id} examples`).toBeGreaterThanOrEqual(4);
      expect(w.flashcards.length, `world ${w.id} cards`).toBeGreaterThanOrEqual(25);
      expect(w.exercises.length, `world ${w.id} exercises`).toBeGreaterThanOrEqual(8);
    }
  });

  it('has unique ids per content kind (each kind is stored in its own map)', () => {
    for (const kind of ['theory', 'examples', 'flashcards', 'exercises', 'interpretations'] as const) {
      const ids = WORLDS.flatMap((w) => w[kind].map((x) => x.id));
      expect(new Set(ids).size, kind).toBe(ids.length);
    }
  });

  it('course lessons (Stats Study Lab) cover weeks 1–6 and render cleanly', () => {
    expect(WEEKS.map((w) => w.num)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const w of WEEKS) {
      expect(WORLDS.find((x) => x.id === w.num)!.theory).toHaveLength(w.parts.length);
      for (const p of w.parts) {
        expect(p.concepts.length, `${w.id} ${p.title}`).toBeGreaterThan(0);
        expect(JSON.stringify([p.intro, p.summary, p.concepts]), `${w.id} ${p.title}`).not.toMatch(BAD);
      }
    }
  });

  it('course practice generators produce valid questions', () => {
    for (const w of WEEKS) {
      for (const t of allPractice(w)) {
        for (let i = 0; i < 25; i++) {
          const q = t.gen();
          const where = `${w.id} ${t.key} #${i}`;
          expect([q.q, q.steps].join('\n'), where).not.toMatch(BAD);
          if (q.choices) expect(q.choices, where).toContain(q.ans);
          else expect(Number.isFinite(q.ans), `${where} = ${q.ans}`).toBe(true);
        }
      }
    }
  });

  it('static text has no broken interpolations', () => {
    for (const w of WORLDS) {
      expect(JSON.stringify([w.theory, w.examples, w.flashcards, w.interpretations]), `world ${w.id}`).not.toMatch(BAD);
    }
  });

  it('every exercise and boss generates valid instances for many seeds', () => {
    for (const w of WORLDS) {
      for (const ex of w.exercises) for (let s = 1; s <= 60; s++) checkInstance(ex.generate(makeRng(s * 7919)), `${ex.id} seed ${s}`);
      for (let s = 1; s <= 40; s++) {
        const b = w.boss.generate(makeRng(s * 104729));
        expect(b.intro + JSON.stringify(b.output ?? ''), `boss ${w.id}`).not.toMatch(BAD);
        b.parts.forEach((p) => checkInstance(p, `boss ${w.id} part ${p.label} seed ${s}`));
      }
    }
  });
});

describe('mocks', async () => {
  const { getMock, MOCK_IDS } = await import('./mocks');
  const { gradeQuestion } = await import('../lib/grading');
  it('builds 10 mocks with 16 valid questions each', () => {
    for (const id of MOCK_IDS) {
      const m = getMock(id);
      expect(m.questions.length).toBe(16);
      expect(JSON.stringify(m)).not.toMatch(BAD);
      expect(new Set(m.questions.map((q) => q.id)).size).toBe(16);
    }
  });
  it('grades perfect answers with full marks', () => {
    for (const q of getMock(3).questions) {
      const a: Record<string, string> = {};
      if (q.type === 'cloze') q.inputs.forEach((i) => (a[i.id] = i.kind === 'choice' ? String(i.answer) : i.answer.toFixed(i.decimals)));
      else if (q.type === 'numeric') a.v = q.answer.toFixed(q.decimals);
      else if (q.type === 'gaps') q.gaps.forEach((g, k) => (a[`g${k}`] = String(g.answer)));
      else a.v = String(q.answer);
      const g = gradeQuestion(q, a, true);
      expect(g.earned, q.id).toBe(g.max);
    }
  });
});
