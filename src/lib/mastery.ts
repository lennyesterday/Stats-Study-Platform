// Mastery per topic (0–100) and the exam-readiness estimate (grade /20).
import { TOPICS } from '../content/topics';
import type { TopicId } from '../content/types';
import { ALL_CARDS, ALL_THEORY } from '../content/worlds';
import { strength } from './srs';
import type { GameState } from './state';

export interface MasteryParts { theory: number; cards: number; exercises: number; mock: number | null; total: number }

export function topicMastery(s: GameState, topic: TopicId): MasteryParts {
  const sections = ALL_THEORY.filter((t) => t.topic === topic);
  const theory = sections.length ? sections.filter((t) => s.theoryRead[t.id]).length / sections.length : 0;
  const cards = ALL_CARDS.filter((c) => c.topic === topic);
  const cardScore = cards.length ? cards.reduce((a, c) => a + strength(s.cards[c.id]), 0) / cards.length : 0;
  const [ec, et] = s.topicEx[topic] ?? [0, 0];
  const exercises = et ? (ec / et) * Math.min(1, et / 6) : 0;
  const [mc, mt] = s.topicMock[topic] ?? [0, 0];
  const mock = mt ? mc / mt : null;
  const total = mock === null
    ? (0.15 * theory + 0.3 * cardScore + 0.35 * exercises) / 0.8
    : 0.15 * theory + 0.3 * cardScore + 0.35 * exercises + 0.2 * mock;
  return { theory, cards: cardScore, exercises, mock, total: Math.round(total * 100) };
}

export const allMastery = (s: GameState) => TOPICS.map((t) => ({ ...t, ...topicMastery(s, t.id) }));

export function readiness(s: GameState) {
  const m = allMastery(s);
  const avg = m.reduce((a, t) => a + t.total, 0) / m.length; // 0–100
  const full = s.mocks.filter((x) => !x.last6Only).slice(-3);
  const mockAvg = full.length ? full.reduce((a, x) => a + x.grade, 0) / full.length : null;
  const fromMastery = (avg / 100) * 20;
  const grade = mockAvg === null ? fromMastery * 0.95 : 0.4 * fromMastery + 0.6 * mockAvg;
  return { grade: Math.round(grade * 10) / 10, masteryAvg: Math.round(avg), mockAvg, basedOnMocks: full.length };
}

export const weakestTopics = (s: GameState, n = 2) => [...allMastery(s)].sort((a, b) => a.total - b.total).slice(0, n);
