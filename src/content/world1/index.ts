import { getWeek, theoryFor } from '../../course';
import type { World } from '../types';
import { boss } from './boss';
import { examples } from './examples';
import { exercises, interpretations } from './exercises';
import { flashcards } from './flashcards';

export const world1: World = {
  id: 1,
  slug: 'foundations',
  title: getWeek(1)!.title,
  subtitle: getWeek(1)!.blurb,
  week: 'Week 1',
  icon: '🧱',
  color: '#3b6fd8',
  topics: ['variables', 'descriptives', 'distributions', 'tables'],
  outcomes: [
    'Classify variables (quantitative discrete/continuous, qualitative nominal/ordinal)',
    'Define random variables (discrete vs continuous)',
    'Compute and interpret mean, median, variance, standard deviation, skewness',
    'Describe the Normal, t-Student, χ² and F distributions',
    'Distinguish population vs sample, parameters vs statistics',
    'Read the Z, t, χ² and F tables in both directions',
  ],
  theory: theoryFor(1),
  examples,
  flashcards,
  exercises,
  interpretations,
  boss,
};
