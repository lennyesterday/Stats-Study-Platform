import { getWorld, WORLDS } from '../content/worlds';
import type { Flashcard } from '../content/types';

// Which flashcards belong to which lesson part (read → test yourself → next part).
// Ids without a "w<n>-" prefix belong to the same week; full ids pull a card from another week.
const PART_CARDS: Record<number, string[][]> = {
  1: [
    ['quant', 'discrete', 'nominal', 'mean-cat', 'codes'],
    ['median', 'mean-vs-median', 'var-formula', 'var-pop', 'nonneg', 'sd-units', 'iqr', 'skew-right', 'skew-left'],
    ['rv', 'rv-cont'],
    ['z-shape', 'standardize', 'table-conv'],
    ['param-stat', 'hyp-param'],
    ['t-shape', 't15', 't-inf'],
    ['chi-shape', 'f-shape', 'chi-sym', 'f-dims', 'decimals'],
  ],
  2: [
    ['srs', 'bias', 'variability', 'sampdist', 'se', 'sd-vs-se', 'halve-se', 'clt', 'clt-data', 'clt-normal-pop', 'clt-z', 'unbiased', 'point'],
    ['ci-structure', 'ci-t', 'col975', 'df59', 'ci-width-n', 'ci-width-conf', 'precision', 'n-formula', 'from-ci', 'interp', 'interp-wrong', 'interp-prob'],
    ['ci-prop', 'prop-cond'],
  ],
  3: [
    ['h0', 'tails', 'gpa15', 'sleep7', 'steps', 'type1', 'type2', 'alpha-beta', 'accept'],
    ['t-stat', 'test-z-or-t', 'crit-two', 'pval-def', 'pval-rule', 'pval-two', 'pval-bracket', 'same-decision', 'ci-test', 'ci-test-01', 'conclusion'],
    ['prop-ci-vs-test', 'power', 'n-power', 'practical', 'pval-wrong'],
  ],
  4: [
    ['when', 'why-not-t', 'h0', 'h1-wrong', 'f', 'f-one', 'assumptions', 'vs-chi', 'regression-link', 'reject-meaning', 'k2-t'],
    ['sst', 'ssb', 'ssw', 'decomp', 'ms', 'ms-add', 'more-noise', 'bigger-gap', 'tail', 'ftable', 'eta', 'posthoc', 'posthoc-when', 'causation', 'conclusion'],
  ],
  5: [
    ['when', 'h0', 'independent-def', 'independent-example', 'percent'],
    ['expected', 'expected-why', 'margins', 'stat', 'o-equals-e', 'contrib', 'double-n', 'bigger-table', 'tail', 'crit-table', 'condition', 'condition-fix', 'observed-zero',
      'method', 'cramer', 'large-n', 'causation', 'conclusion', 'vs-anova', 'chi-vs-prop'],
  ],
  6: [
    ['when', 'ols', 'b1', 'point', 'slope-int', 'intercept', 'residual', 'resid-sum', 'extrap', 'symmetry'],
    ['r', 'decomp', 'r2', 'r2-r', 'r2-wrong', 'se', 't', 'ci', 'ft', 'anova-table', 'sigf', 'line', 'resid-plot', 'curve', 'causation'],
    ['w4-vs-chi', 'w5-vs-anova', 'w3-test-z-or-t', 'w4-regression-link', 'w3-steps', 'w3-conclusion'],
  ],
};

const byId = new Map<string, Flashcard>(WORLDS.flatMap((w) => w.flashcards).map((c) => [c.id, c]));
const fullId = (week: number, id: string) => (/^w\d-/.test(id) ? id : `w${week}-${id}`);

/** ids of the cards for part `pi` (0-based) of `week` */
export const partCardIds = (week: number, pi: number) => (PART_CARDS[week]?.[pi] ?? []).map((id) => fullId(week, id));

const cache = new Map<string, Flashcard[]>();
/** the flashcards for one lesson part; stable array per part */
export function cardsForPart(week: number, pi: number): Flashcard[] {
  const key = `${week}-${pi}`;
  if (!cache.has(key)) cache.set(key, partCardIds(week, pi).map((id) => byId.get(id)).filter((c): c is Flashcard => !!c));
  return cache.get(key)!;
}

/** cards of the week that no part lists (shown with the whole week only) */
export const unassigned = (week: number) => {
  const used = new Set((PART_CARDS[week] ?? []).flatMap((_, pi) => partCardIds(week, pi)));
  return (getWorld(week)?.flashcards ?? []).filter((c) => !used.has(c.id));
};
