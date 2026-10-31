import { getWeek, theoryFor } from '../../course';
import type { World } from '../types';
import { boss } from './boss';
import { examples } from './examples';
import { exercises, interpretations } from './exercises';
import { flashcards } from './flashcards';

export const world4: World = {
  id: 4,
  slug: 'anova',
  title: getWeek(4)!.title,
  subtitle: getWeek(4)!.blurb,
  week: 'Week 4',
  icon: '📊',
  color: '#7c3aed',
  topics: ['anova'],
  outcomes: [
    'Explain why ANOVA instead of multiple t-tests (family-wise error)',
    'State H₀/H₁ and the assumptions of one-way ANOVA',
    'Decompose SST = SSB + SSW and compute MS and F',
    'Read the F-Snedecor table (m = k − 1, n = n − k) and decide',
    'Complete and interpret Excel/Jamovi ANOVA tables',
    'Know what post-hoc tests and η² add',
  ],
  theory: theoryFor(4),
  examples,
  flashcards,
  exercises,
  interpretations,
  boss,
};
