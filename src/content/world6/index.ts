import { getWeek, theoryFor } from '../../course';
import type { World } from '../types';
import { boss } from './boss';
import { examples } from './examples';
import { exercises, interpretations } from './exercises';
import { flashcards } from './flashcards';

export const world6: World = {
  id: 6,
  slug: 'regression',
  title: getWeek(6)!.title,
  subtitle: getWeek(6)!.blurb,
  week: 'Week 6',
  icon: '📈',
  color: '#db2777',
  topics: ['regression', 'reg-inference'],
  outcomes: [
    'Describe linear relationships with scatter plots and r',
    'Compute b₀ and b₁ by least squares (raw data or summaries)',
    'Interpret slope, intercept, predictions and residuals; avoid extrapolation',
    'Decompose SST = SSR + SSE; compute and interpret R² and sₑ',
    'Test H₀: β₁ = 0 with t (df n − 2), build CIs, link F = t²',
    'Read Excel/Jamovi regression output; check assumptions',
  ],
  theory: theoryFor(6),
  examples,
  flashcards,
  exercises,
  interpretations,
  boss,
};
