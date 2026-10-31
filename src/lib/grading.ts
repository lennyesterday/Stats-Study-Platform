// Grading of mock-exam questions (Moodle-style partial credit per input/gap).
import type { MockQuestion } from '../content/types';
import { checkNumber } from './check';

export type Answers = Record<string, string>; // per question: input id → raw value

export interface QuestionGrade { earned: number; max: number; parts: boolean[]; correct: string[] }

export function gradeQuestion(q: MockQuestion, a: Answers = {}, strict = false): QuestionGrade {
  const max = q.points ?? 1;
  let parts: boolean[] = [];
  let correct: string[] = [];
  switch (q.type) {
    case 'cloze':
      parts = q.inputs.map((i) => (i.kind === 'choice' ? a[i.id] === String(i.answer) : checkNumber(a[i.id] ?? '', i.answer, i.decimals, i.tol, strict).ok));
      correct = q.inputs.map((i) => `${i.label}: ${i.kind === 'choice' ? i.options[i.answer] : i.answer.toFixed(i.decimals)}`);
      break;
    case 'numeric':
      parts = [checkNumber(a.v ?? '', q.answer, q.decimals, q.tol, strict).ok];
      correct = [q.answer.toFixed(q.decimals)];
      break;
    case 'single':
      parts = [a.v === String(q.answer)];
      correct = [q.options[q.answer]];
      break;
    case 'truefalse':
      parts = [a.v === String(q.answer)];
      correct = [q.answer ? 'True' : 'False'];
      break;
    case 'gaps':
      parts = q.gaps.map((g, k) => a[`g${k}`] === String(g.answer));
      correct = q.gaps.map((g) => g.options[g.answer]);
      break;
  }
  const earned = (parts.filter(Boolean).length / parts.length) * max;
  return { earned, max, parts, correct };
}

export const isAnswered = (q: MockQuestion, a: Answers = {}) => {
  const keys = q.type === 'cloze' ? q.inputs.map((i) => i.id) : q.type === 'gaps' ? q.gaps.map((_, k) => `g${k}`) : ['v'];
  return keys.some((k) => (a[k] ?? '').trim() !== '');
};

/** grade on the 0–20 scale, 2 decimals */
export const toGrade = (earned: number, max: number) => (max ? Math.round((earned / max) * 2000) / 100 : 0);
