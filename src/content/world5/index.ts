import { getWeek, theoryFor } from '../../course';
import type { World } from '../types';
import { boss } from './boss';
import { examples } from './examples';
import { exercises, interpretations } from './exercises';
import { flashcards } from './flashcards';

export const world5: World = {
  id: 5,
  slug: 'chisq',
  title: getWeek(5)!.title,
  subtitle: getWeek(5)!.blurb,
  week: 'Week 5',
  icon: '🧮',
  color: '#0891b2',
  topics: ['chisq'],
  outcomes: [
    'Build contingency tables and conditional distributions',
    'State H₀ (independence) and H₁ (association)',
    'Compute expected counts, χ² and df = (r − 1)(c − 1)',
    'Use the chi-square table (left-tail, column 1 − α) and bracket p-values',
    'Check the expected-count ≥ 5 condition and handle violations',
    'Interpret cell contributions without causal claims',
  ],
  theory: theoryFor(5),
  examples,
  flashcards,
  exercises,
  interpretations,
  boss,
};
