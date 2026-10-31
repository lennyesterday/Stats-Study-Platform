import { describe, expect, it } from 'vitest';
import { CHI2_TABLE, F_TABLE, T_TABLE, Z_TABLE } from '../content/tables';
import { DATASET_COLUMNS, DATASET_ROWS } from '../content/dataset';
import {
  anovaFromRaw, anovaFromSummaries, chi2Inv, chiSquareIndependence, ciMeanT, ciProportion, fInv,
  linearRegression, mean, median, normalCdf, normalInv, powerZ, round, sd, tCdf, tInv, tTestMean, variance, zTestMean,
} from './stats';
import { chi2PBounds, fPBounds, fTable, tPBounds, tTable, zFromTable, zTable } from './tables';

describe('distribution quantiles vs. textbook table values', () => {
  it('z_0.975 = 1.960', () => expect(round(normalInv(0.975), 3)).toBe(1.96));
  it('t_0.975,15 = 2.131', () => expect(round(tInv(0.975, 15), 3)).toBe(2.131));
  it('chi2_0.95,4 = 9.488', () => expect(round(chi2Inv(0.95, 4), 3)).toBe(9.488));
  it('F_0.95,2,27 ≈ 3.354', () => expect(round(fInv(0.95, 2, 27), 3)).toBe(3.354));
  it('course week-1 tasks', () => {
    expect(zFromTable(0.95)).toBe(1.645); // P(Z < z) = 0.95
    expect(zFromTable(0.1)).toBe(-1.28); // P(Z > z) = 0.90
    expect(tTable(5, 0.9).value).toBe(1.476); // df = 5, P(T < t) = 0.90
    expect(tTable(15, 0.025).value).toBe(-2.131); // quiz trap: P(T > t) = 0.975
    expect(round(1 - zTable(1), 4)).toBe(0.1587);
    expect(round(1 - tCdf(1.064, 20), 2)).toBe(0.15);
  });
});

describe('CDFs reproduce every cell of the course tables', () => {
  it('Z table', () => {
    Z_TABLE.rows.forEach((r, i) => Z_TABLE.cols.forEach((c, j) => {
      expect(Math.abs(normalCdf(r + c) - Z_TABLE.values[i][j])).toBeLessThan(0.00006);
    }));
  });
  it('t table', () => {
    T_TABLE.dfs.forEach((df, i) => T_TABLE.probs.forEach((p, j) => {
      const v = tInv(p, df ?? Infinity);
      expect(Math.abs(v - T_TABLE.values[i][j]) / Math.max(1, v)).toBeLessThan(0.0007);
    }));
  });
  it('chi-square table', () => {
    CHI2_TABLE.dfs.forEach((df, i) => CHI2_TABLE.probs.forEach((p, j) => {
      expect(Math.abs(chi2Inv(p, df) - CHI2_TABLE.values[i][j])).toBeLessThan(0.0006 + 0.0002 * CHI2_TABLE.values[i][j]);
    }));
  });
  it('F table', () => {
    F_TABLE.ns.forEach((n, ni) => F_TABLE.probs.forEach((p, pi) => F_TABLE.ms.forEach((m, mi) => {
      if (m === null || n === null) return;
      const v = F_TABLE.values[ni][pi][mi];
      expect(Math.abs(fInv(p, m, n) - v) / v).toBeLessThan(0.006);
    })));
  });
});

describe('table helpers', () => {
  it('reads z table with symmetry', () => {
    expect(zTable(1.04)).toBe(0.8508);
    expect(zTable(-1.04)).toBe(0.1492);
  });
  it('F lookup uses m = numerator, n = denominator', () => {
    expect(fTable(5, 6, 0.95).value).toBe(4.39);
    expect(fTable(2, 27, 0.95).fromTable).toBe(false);
  });
  it('p-value brackets', () => {
    expect(tPBounds(2.35, 10, 'two').text).toBe('0.02 < p < 0.05');
    expect(chi2PBounds(10.5, 4).text).toBe('0.025 < p < 0.05');
    expect(fPBounds(4.0, 2, 12).text).toBe('0.025 < p < 0.05');
  });
});

describe('descriptives on the course dataset (Quiz 2)', () => {
  const col = (name: string) => DATASET_ROWS.map((r) => r[DATASET_COLUMNS.indexOf(name as never)] as number);
  it('mean / median of Age', () => {
    expect(round(mean(col('Age')), 1)).toBe(20.1);
    expect(median(col('Age'))).toBe(20);
    expect(median(col('FinalGrade'))).toBe(68.5);
  });
  it('quiz uses population formulas (VAR.P / STDEV.P)', () => {
    expect(round(variance(col('StudyHoursPerWeek'), true), 1)).toBe(10.9);
    expect(round(sd(col('SleepHoursPerNight'), true), 2)).toBe(0.85);
  });
});

describe('inference', () => {
  it('t test for the course GPA example', () => {
    const r = tTestMean(15.8, 15, 2.5, 40, 0.05, 'two');
    expect(round(r.stat, 2)).toBe(2.02);
  });
  it('z test', () => expect(round(zTestMean(52, 50, 6, 36, 0.05, 'right').stat, 2)).toBe(2));
  it('CI for mean (t) and proportion', () => {
    const ci = ciMeanT(15, 2, 16, 0.95);
    expect(round(ci.me, 3)).toBe(round(2.131 * 0.5, 3));
    expect(round(ciProportion(0.5, 100, 0.95).me, 3)).toBe(0.098);
  });
  it('power is alpha when mu1 = mu0', () => expect(round(powerZ(10, 10, 2, 25, 0.05, 'two'), 4)).toBe(0.05));
});

describe('ANOVA, chi-square, regression', () => {
  it('ANOVA raw = summaries and SST = SSB + SSW', () => {
    const g = [[12, 14, 13, 15], [16, 17, 15, 18], [11, 10, 12, 13]];
    const a = anovaFromRaw(g);
    const all = g.flat();
    expect(a.sst).toBeCloseTo(variance(all) * (all.length - 1), 9);
    const b = anovaFromSummaries(g.map((x) => ({ n: x.length, mean: mean(x), sd: sd(x) })));
    expect(a.F).toBeCloseTo(b.F, 9);
    expect(a.dfb).toBe(2); expect(a.dfw).toBe(9);
  });
  it('chi-square 2x2', () => {
    const r = chiSquareIndependence([[20, 30], [30, 20]]);
    expect(r.expected[0][0]).toBe(25);
    expect(r.chi2).toBeCloseTo(4, 9);
    expect(r.df).toBe(1);
  });
  it('regression: t^2 = F, SST = SSR + SSE', () => {
    const x = [2, 4, 5, 7, 8, 10], y = [11, 13, 14, 16, 15, 19];
    const r = linearRegression(x, y);
    expect(r.tB1 ** 2).toBeCloseTo(r.F, 6);
    expect(r.ssr + r.sse).toBeCloseTo(r.sst, 9);
    expect(r.r2).toBeGreaterThan(0.8);
  });
});
