import { getWeek, theoryFor } from '../../course';
import type { World } from '../types';
import { boss } from './boss';
import { examples } from './examples';
import { exercises, interpretations } from './exercises';
import { flashcards } from './flashcards';

export const world2: World = {
  id: 2,
  slug: 'sampling-ci',
  title: getWeek(2)!.title,
  subtitle: getWeek(2)!.blurb,
  week: 'Week 2',
  icon: '🎯',
  color: '#0f9d76',
  topics: ['sampling', 'ci-mean', 'ci-prop'],
  outcomes: [
    'Explain random sampling, representativeness and sampling variability',
    'Describe the sampling distribution of x̄ and compute the standard error',
    'State and apply the Central Limit Theorem',
    'Construct CIs for μ (Z or t) and for π; identify reliability factor and margin of error',
    'Explain the effect of n, variability and confidence level; compute the required n',
    'Interpret a 95 % CI correctly and avoid common misinterpretations',
  ],
  theory: theoryFor(2),
  examples,
  flashcards,
  exercises,
  interpretations,
  boss,
};
