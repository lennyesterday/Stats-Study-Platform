// Statistical engine: distributions (CDF, PDF, quantiles), descriptives, CIs, tests,
// ANOVA, chi-square and simple linear regression. Pure functions, no UI.

// ---------- special functions ----------

const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

export function logGamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - logGamma(1 - x);
  x -= 1;
  let a = 0.99999999999980993;
  const t = x + 7.5;
  for (let i = 0; i < 8; i++) a += LANCZOS[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function betacf(a: number, b: number, x: number): number {
  const FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 500; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b). */
export function incBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Regularized lower incomplete gamma P(a, x). */
export function incGammaLower(a: number, x: number): number {
  if (x <= 0) return 0;
  const gln = logGamma(a);
  if (x < a + 1) {
    let sum = 1 / a, del = sum, ap = a;
    for (let n = 0; n < 1000; n++) {
      ap += 1; del *= x / ap; sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-16) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - gln);
  }
  const FPMIN = 1e-300;
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-16) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
}

// ---------- distributions ----------

/** Standard normal CDF P(Z < z) — West (2005) double-precision algorithm. */
export function normalCdf(z: number, mu = 0, sigma = 1): number {
  const x = (z - mu) / sigma;
  const ax = Math.abs(x);
  let c: number;
  if (ax > 37) c = 0;
  else {
    const e = Math.exp((-ax * ax) / 2);
    if (ax < 7.07106781186547) {
      let n = 3.52624965998911e-2 * ax + 0.700383064443688;
      n = n * ax + 6.37396220353165; n = n * ax + 33.912866078383; n = n * ax + 112.079291497871;
      n = n * ax + 221.213596169931; n = n * ax + 220.206867912376;
      let d = 8.83883476483184e-2 * ax + 1.75566716318264;
      d = d * ax + 16.064177579207; d = d * ax + 86.7807322029461; d = d * ax + 296.564248779674;
      d = d * ax + 637.333633378831; d = d * ax + 793.826512519948; d = d * ax + 440.413735824752;
      c = (e * n) / d;
    } else {
      let b = ax + 0.65; b = ax + 4 / b; b = ax + 3 / b; b = ax + 2 / b; b = ax + 1 / b;
      c = e / b / 2.506628274631;
    }
  }
  return x > 0 ? 1 - c : c;
}

export function normalPdf(z: number, mu = 0, sigma = 1): number {
  const x = (z - mu) / sigma;
  return Math.exp(-0.5 * x * x) / (sigma * Math.sqrt(2 * Math.PI));
}

/** Inverse standard normal (Acklam + one Halley refinement). */
export function normalInv(p: number, mu = 0, sigma = 1): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let x: number;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pl) {
    const q = p - 0.5, r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const e = normalCdf(x) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
  x = x - u / (1 + (x * u) / 2);
  return mu + sigma * x;
}

/** P(T_df < t). df = Infinity gives the standard normal. */
export function tCdf(t: number, df: number): number {
  if (!isFinite(df)) return normalCdf(t);
  const x = df / (df + t * t);
  const tail = 0.5 * incBeta(x, df / 2, 0.5);
  return t > 0 ? 1 - tail : tail;
}

export function tPdf(t: number, df: number): number {
  if (!isFinite(df)) return normalPdf(t);
  return Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + (t * t) / df));
}

export function chi2Cdf(x: number, df: number): number {
  return x <= 0 ? 0 : incGammaLower(df / 2, x / 2);
}

export function chi2Pdf(x: number, df: number): number {
  if (x <= 0) return 0;
  const k = df / 2;
  return Math.exp((k - 1) * Math.log(x) - x / 2 - k * Math.log(2) - logGamma(k));
}

/** P(F_{m,n} < f), m = numerator df, n = denominator df. */
export function fCdf(f: number, m: number, n: number): number {
  if (f <= 0) return 0;
  return incBeta((m * f) / (m * f + n), m / 2, n / 2);
}

export function fPdf(f: number, m: number, n: number): number {
  if (f <= 0) return 0;
  return Math.exp(
    0.5 * (m * Math.log(m * f) + n * Math.log(n) - (m + n) * Math.log(m * f + n)) - Math.log(f) -
      (logGamma(m / 2) + logGamma(n / 2) - logGamma((m + n) / 2)),
  );
}

/** Numerically invert a monotone CDF on [lo, ∞). */
function invert(cdf: (x: number) => number, p: number, lo: number, hi: number): number {
  while (cdf(hi) < p) hi *= 2;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (cdf(mid) < p) lo = mid; else hi = mid;
    if (hi - lo < 1e-12 * Math.max(1, Math.abs(mid))) break;
  }
  return (lo + hi) / 2;
}

export function tInv(p: number, df: number): number {
  if (!isFinite(df)) return normalInv(p);
  if (p === 0.5) return 0;
  if (p < 0.5) return -tInv(1 - p, df);
  return invert((x) => tCdf(x, df), p, 0, 10);
}

export function chi2Inv(p: number, df: number): number {
  return invert((x) => chi2Cdf(x, df), p, 0, Math.max(10, df * 3));
}

export function fInv(p: number, m: number, n: number): number {
  return invert((x) => fCdf(x, m, n), p, 0, 10);
}

// ---------- descriptive statistics ----------

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs: number[]) => sum(xs) / xs.length;

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Sample variance (n − 1) by default; population (n) when population = true. */
export function variance(xs: number[], population = false): number {
  const m = mean(xs);
  return sum(xs.map((x) => (x - m) ** 2)) / (xs.length - (population ? 0 : 1));
}

export const sd = (xs: number[], population = false) => Math.sqrt(variance(xs, population));

/** Excel QUARTILE.INC / PERCENTILE.INC. */
export function percentile(xs: number[], q: number): number {
  const s = [...xs].sort((a, b) => a - b);
  const h = (s.length - 1) * q;
  const lo = Math.floor(h);
  return s[lo] + (h - lo) * ((s[lo + 1] ?? s[lo]) - s[lo]);
}

/** Excel SKEW (adjusted Fisher–Pearson). */
export function skewness(xs: number[]): number {
  const n = xs.length, m = mean(xs), s = sd(xs);
  return (n / ((n - 1) * (n - 2))) * sum(xs.map((x) => ((x - m) / s) ** 3));
}

export function mode<T>(xs: T[]): T[] {
  const counts = new Map<T, number>();
  xs.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1));
  const max = Math.max(...counts.values());
  return [...counts.entries()].filter(([, c]) => c === max).map(([v]) => v);
}

// ---------- confidence intervals ----------

export interface Interval { lower: number; upper: number; me: number; se: number; factor: number }

export function ciMeanZ(xbar: number, sigma: number, n: number, conf: number): Interval {
  const factor = normalInv(1 - (1 - conf) / 2);
  const se = sigma / Math.sqrt(n);
  return { lower: xbar - factor * se, upper: xbar + factor * se, me: factor * se, se, factor };
}

export function ciMeanT(xbar: number, s: number, n: number, conf: number): Interval {
  const factor = tInv(1 - (1 - conf) / 2, n - 1);
  const se = s / Math.sqrt(n);
  return { lower: xbar - factor * se, upper: xbar + factor * se, me: factor * se, se, factor };
}

export function ciProportion(p: number, n: number, conf: number): Interval {
  const factor = normalInv(1 - (1 - conf) / 2);
  const se = Math.sqrt((p * (1 - p)) / n);
  return { lower: p - factor * se, upper: p + factor * se, me: factor * se, se, factor };
}

/** Minimum n so that the margin of error for μ is at most E. */
export const sampleSizeMean = (z: number, sigma: number, E: number) => Math.ceil(((z * sigma) / E) ** 2);

// ---------- hypothesis tests ----------

export type Tail = 'two' | 'left' | 'right';

export interface TestResult { stat: number; pValue: number; critical: number; reject: boolean; se: number }

function pFrom(cdf: (x: number) => number, stat: number, tail: Tail): number {
  if (tail === 'left') return cdf(stat);
  if (tail === 'right') return 1 - cdf(stat);
  return 2 * Math.min(cdf(stat), 1 - cdf(stat));
}

function critFrom(inv: (p: number) => number, alpha: number, tail: Tail): number {
  if (tail === 'left') return inv(alpha);
  if (tail === 'right') return inv(1 - alpha);
  return inv(1 - alpha / 2);
}

function decide(stat: number, critical: number, tail: Tail): boolean {
  if (tail === 'left') return stat < critical;
  if (tail === 'right') return stat > critical;
  return Math.abs(stat) > critical;
}

export function zTestMean(xbar: number, mu0: number, sigma: number, n: number, alpha: number, tail: Tail): TestResult {
  const se = sigma / Math.sqrt(n);
  const stat = (xbar - mu0) / se;
  const critical = critFrom((p) => normalInv(p), alpha, tail);
  return { stat, se, critical, pValue: pFrom(normalCdf, stat, tail), reject: decide(stat, critical, tail) };
}

export function tTestMean(xbar: number, mu0: number, s: number, n: number, alpha: number, tail: Tail): TestResult {
  const df = n - 1;
  const se = s / Math.sqrt(n);
  const stat = (xbar - mu0) / se;
  const critical = critFrom((p) => tInv(p, df), alpha, tail);
  return { stat, se, critical, pValue: pFrom((x) => tCdf(x, df), stat, tail), reject: decide(stat, critical, tail) };
}

export function zTestProportion(p: number, pi0: number, n: number, alpha: number, tail: Tail): TestResult {
  const se = Math.sqrt((pi0 * (1 - pi0)) / n);
  const stat = (p - pi0) / se;
  const critical = critFrom((q) => normalInv(q), alpha, tail);
  return { stat, se, critical, pValue: pFrom(normalCdf, stat, tail), reject: decide(stat, critical, tail) };
}

/** Power of a one-sample z test for μ when the true mean is mu1. */
export function powerZ(mu0: number, mu1: number, sigma: number, n: number, alpha: number, tail: Tail): number {
  const se = sigma / Math.sqrt(n);
  const shift = (mu1 - mu0) / se;
  if (tail === 'right') return 1 - normalCdf(normalInv(1 - alpha) - shift);
  if (tail === 'left') return normalCdf(normalInv(alpha) - shift);
  const z = normalInv(1 - alpha / 2);
  return 1 - normalCdf(z - shift) + normalCdf(-z - shift);
}

// ---------- ANOVA ----------

export interface GroupSummary { n: number; mean: number; sd: number }

export interface AnovaResult {
  k: number; N: number; grandMean: number;
  ssb: number; ssw: number; sst: number;
  dfb: number; dfw: number; dft: number;
  msb: number; msw: number; F: number; pValue: number;
}

export function anovaFromSummaries(groups: GroupSummary[]): AnovaResult {
  const k = groups.length;
  const N = sum(groups.map((g) => g.n));
  const grandMean = sum(groups.map((g) => g.n * g.mean)) / N;
  const ssb = sum(groups.map((g) => g.n * (g.mean - grandMean) ** 2));
  const ssw = sum(groups.map((g) => (g.n - 1) * g.sd ** 2));
  const dfb = k - 1, dfw = N - k;
  const msb = ssb / dfb, msw = ssw / dfw, F = msb / msw;
  return { k, N, grandMean, ssb, ssw, sst: ssb + ssw, dfb, dfw, dft: N - 1, msb, msw, F, pValue: 1 - fCdf(F, dfb, dfw) };
}

export function anovaFromRaw(groups: number[][]): AnovaResult {
  return anovaFromSummaries(groups.map((g) => ({ n: g.length, mean: mean(g), sd: g.length > 1 ? sd(g) : 0 })));
}

// ---------- chi-square test of independence ----------

export interface ChiSquareResult {
  rowTotals: number[]; colTotals: number[]; n: number;
  expected: number[][]; contributions: number[][];
  chi2: number; df: number; pValue: number;
}

export function chiSquareIndependence(observed: number[][]): ChiSquareResult {
  const rowTotals = observed.map((r) => sum(r));
  const colTotals = observed[0].map((_, j) => sum(observed.map((r) => r[j])));
  const n = sum(rowTotals);
  const expected = observed.map((r, i) => r.map((_, j) => (rowTotals[i] * colTotals[j]) / n));
  const contributions = observed.map((r, i) => r.map((o, j) => (o - expected[i][j]) ** 2 / expected[i][j]));
  const chi2 = sum(contributions.flat());
  const df = (observed.length - 1) * (observed[0].length - 1);
  return { rowTotals, colTotals, n, expected, contributions, chi2, df, pValue: 1 - chi2Cdf(chi2, df) };
}

// ---------- simple linear regression ----------

export interface RegressionResult {
  n: number; b0: number; b1: number; r: number; r2: number;
  sst: number; ssr: number; sse: number; mse: number; se: number;
  seB1: number; tB1: number; F: number; pValue: number;
  xbar: number; ybar: number; sxx: number; sxy: number;
  fitted: number[]; residuals: number[];
}

export function linearRegression(x: number[], y: number[]): RegressionResult {
  const n = x.length;
  const xbar = mean(x), ybar = mean(y);
  const sxx = sum(x.map((v) => (v - xbar) ** 2));
  const sxy = sum(x.map((v, i) => (v - xbar) * (y[i] - ybar)));
  const syy = sum(y.map((v) => (v - ybar) ** 2));
  const b1 = sxy / sxx;
  const b0 = ybar - b1 * xbar;
  const fitted = x.map((v) => b0 + b1 * v);
  const residuals = y.map((v, i) => v - fitted[i]);
  const sse = sum(residuals.map((e) => e * e));
  const ssr = syy - sse;
  const mse = sse / (n - 2);
  const se = Math.sqrt(mse);
  const seB1 = se / Math.sqrt(sxx);
  const tB1 = b1 / seB1;
  const r2 = ssr / syy;
  return {
    n, b0, b1, r: Math.sign(b1) * Math.sqrt(r2), r2, sst: syy, ssr, sse, mse, se, seB1, tB1,
    F: ssr / mse, pValue: 2 * (1 - tCdf(Math.abs(tB1), n - 2)), xbar, ybar, sxx, sxy, fitted, residuals,
  };
}

// ---------- rounding helpers ----------

export const round = (x: number, d: number) => {
  const f = 10 ** d;
  return Math.round((x + Math.sign(x) * Number.EPSILON * Math.abs(x)) * f) / f;
};

export const fmt = (x: number, d: number) => round(x, d).toFixed(d);
