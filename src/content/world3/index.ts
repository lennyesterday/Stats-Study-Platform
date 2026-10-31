import { getWeek, theoryFor } from '../../course';
import type { World } from '../types';
import { boss } from './boss';
import { examples } from './examples';
import { exercises, interpretations } from './exercises';
import { flashcards } from './flashcards';

export const world3: World = {
  id: 3,
  slug: 'testing',
  title: getWeek(3)!.title,
  subtitle: getWeek(3)!.blurb,
  week: 'Week 3',
  icon: '⚖️',
  color: '#c2410c',
  topics: ['testing', 'test-prop', 'errors'],
  outcomes: [
    'Formulate H₀ and H₁; choose left-, right- or two-tailed tests',
    'Run the full procedure: α → statistic → critical value / p-value → decision → conclusion',
    'Interpret p-values and avoid common misconceptions',
    'Explain Type I/II errors, power and the role of n',
    'Distinguish statistical vs practical significance; "fail to reject" ≠ "accept"',
    'Link confidence intervals and two-tailed tests',
  ],
  theory: theoryFor(3),
  examples,
  flashcards,
  exercises,
  interpretations,
  boss,
};
