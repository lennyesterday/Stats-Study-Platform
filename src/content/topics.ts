import type { Topic, TopicId } from './types';

export const TOPICS: Topic[] = [
  { id: 'variables', label: 'Data & variables', world: 1 },
  { id: 'descriptives', label: 'Descriptive statistics', world: 1 },
  { id: 'distributions', label: 'Distributions', world: 1 },
  { id: 'tables', label: 'Statistical tables', world: 1 },
  { id: 'sampling', label: 'Sampling & CLT', world: 2 },
  { id: 'ci-mean', label: 'CI for the mean', world: 2 },
  { id: 'ci-prop', label: 'CI for a proportion', world: 2 },
  { id: 'testing', label: 'Testing μ', world: 3 },
  { id: 'test-prop', label: 'Testing π', world: 3 },
  { id: 'errors', label: 'Errors, power, p-values', world: 3 },
  { id: 'anova', label: 'One-way ANOVA', world: 4 },
  { id: 'chisq', label: 'Contingency analysis (χ²)', world: 5 },
  { id: 'regression', label: 'Regression: fit & R²', world: 6 },
  { id: 'reg-inference', label: 'Regression: slope test', world: 6 },
];

export const topicLabel = (id: TopicId) => TOPICS.find((t) => t.id === id)?.label ?? id;
export const topicWorld = (id: TopicId) => TOPICS.find((t) => t.id === id)?.world ?? 1;
