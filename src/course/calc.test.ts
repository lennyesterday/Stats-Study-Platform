import { describe as group, expect, it } from 'vitest';
import { renderToString } from 'katex';
import { CalcError, describe, evaluate, fmt, openBrackets, parse, parseEquation, parseList, solve, toFraction, toTex, latexToCalc } from './calc';

group('calculator', () => {
  it('follows the usual order of operations', () => {
    expect(evaluate('2 + 3 × 4')).toBe(14);
    expect(evaluate('(2 + 3) × 4')).toBe(20);
    expect(evaluate('2^3^2')).toBe(512);
    expect(evaluate('−2^2')).toBe(-4);
    expect(evaluate('10 ÷ 4')).toBe(2.5);
    expect(evaluate('5!')).toBe(120);
    expect(evaluate('50%')).toBe(0.5);
  });

  it('handles the typical exam formulas', () => {
    expect(evaluate('(68.5 − 65) / (12 / √36)')).toBeCloseTo(1.75, 10);
    expect(evaluate('0.4 − 1.96√(0.4(1 − 0.4)/100)')).toBeCloseTo(0.30398, 4);
    expect(evaluate('2π')).toBeCloseTo(2 * Math.PI, 12);
    expect(evaluate('ln(e) + log(1000)')).toBe(4);
    expect(evaluate('3,5 × 2')).toBe(7);
    expect(evaluate('Ans × 2', 21)).toBe(42);
    expect(evaluate('sqrt 16 + 1')).toBe(5);
  });

  it('supports all bracket types, |x| and combinations', () => {
    expect(evaluate('[2 + 3] × {4 − 1}')).toBe(15);
    expect(evaluate('2[3 + (4 − 1)]')).toBe(12);
    expect(evaluate('|−3.5| + abs(−1)')).toBe(4.5);
    expect(evaluate('∛27 + 10^(2)')).toBe(103);
    expect(evaluate('5C2')).toBe(10);
    expect(evaluate('5P2')).toBe(20);
    expect(evaluate('3C2 × 2')).toBe(6);
    expect(evaluate('((1 + 2) × (3 + 4')).toBe(21);
    expect(openBrackets('((1 + 2) × [3')).toBe(2);
    expect(openBrackets('(1)')).toBe(0);
  });

  it('reports errors instead of guessing', () => {
    expect(() => evaluate('1 / 0')).toThrow(CalcError);
    expect(() => evaluate('2 +')).toThrow(CalcError);
    expect(() => evaluate('2)')).toThrow(CalcError);
    expect(() => evaluate('foo(2)')).toThrow(CalcError);
    expect(() => evaluate('√(−4)')).toThrow(CalcError);
    expect(evaluate('(1 + 2')).toBe(3); // a missing final ) is forgiven
  });

  it('formats and summarises data', () => {
    expect(fmt(0.1 + 0.2)).toBe('0.3');
    expect(fmt(1.23456, 2)).toBe('1.23');
    expect(parseList('4, 8 6\n5;3')).toEqual([4, 8, 6, 5, 3]);
    expect(parseList('1,5 2,5 3,5')).toEqual([1.5, 2.5, 3.5]);
    const d = describe([4, 8, 6, 5, 3, 7, 9]);
    expect(d.mean).toBe(6);
    expect(d.median).toBe(6);
    expect(d.varS).toBeCloseTo(4.6667, 4);
    expect(d.varP).toBe(4);
  });
});

group('fractions, pretty printing and solving', () => {
  it('turns results into fractions where exact', () => {
    expect(toFraction(1.75)).toBe('7/4');
    expect(toFraction(-1 / 3)).toBe('−1/3');
    expect(toFraction(2)).toBeNull();
    expect(toFraction(Math.PI)).toBeNull();
  });

  it('typesets expressions with stacked fractions', () => {
    expect(toTex(parse('(68.5 − 65) / (12 / √36)'))).toBe('\\frac{68.5 - 65}{\\frac{12}{\\sqrt{36}}}');
    expect(toTex(parse('x̄ − μ₀'))).toBe('\\bar{x} - \\mu_{0}');
    expect(toTex(parse('SE'))).toBe('\\mathrm{SE}');
    expect(() => renderToString(toTex(parse('√(p(1 − p)/n) + 5C2 + |−3|')), { throwOnError: true })).not.toThrow();
  });

  it('solves an equation for any variable', () => {
    const r = solve('SE = SD / √n', { SE: 0.3, SD: 2.4 }, 'n');
    expect(r.value).toBeCloseTo(64, 9);
    expect(r.method).toBe('algebra');
    expect(toTex(r.rearranged!)).toBe('\\left(\\frac{\\mathrm{SD}}{\\mathrm{SE}}\\right)^{2}');
    expect(solve('SE = SD / √n', { n: 64, SD: 2.4 }, 'SE').value).toBeCloseTo(0.3, 12);
    expect(solve('SE = SD / √n', { n: 64, SE: 0.3 }, 'SD').value).toBeCloseTo(2.4, 12);
    expect(solve('t = (x̄ − μ₀) / (s / √n)', { t: 2, 'μ₀': 10, s: 4, n: 16 }, 'x̄').value).toBeCloseTo(12, 12);
    expect(solve('E = z √(p(1 − p) / n)', { E: 0.03, z: 1.96, p: 0.5 }, 'n').value).toBeCloseTo(1067.11, 1);
    // the unknown twice → numeric search
    const q = solve('y = x² − x', { y: 6 }, 'x');
    expect(q.method).toBe('numeric');
    expect(q.value).toBeCloseTo(3, 9);
    expect(q.others[0]).toBeCloseTo(-2, 9);
    expect(() => solve('SE = SD / √n', { SE: 0.3 }, 'n')).toThrow(/SD/);
    expect(() => solve('a + b', {}, 'a')).toThrow(CalcError);
    expect(parseEquation('MSB = SSB / (k − 1)').vars).toEqual(['MSB', 'SSB', 'k']);
  });
});

group('visual editor input (LaTeX)', () => {
  const v = (latex: string, ans = 0) => evaluate(latexToCalc(latex), ans);
  it('reads fractions, roots, powers and functions', () => {
    expect(v('\\frac{3}{4}+1')).toBe(1.75);
    expect(v('\\frac{68.5-65}{\\frac{12}{\\sqrt{36}}}')).toBeCloseTo(1.75, 12);
    expect(v('2\\frac{1}{2}')).toBe(1); // 2 × ½, as typed
    expect(v('\\sqrt{16}\\times2')).toBe(8);
    expect(v('\\sqrt[3]{27}+10^{2}')).toBe(103);
    expect(v('3^2\\div4')).toBe(2.25);
    expect(v('2\\pi')).toBeCloseTo(2 * Math.PI, 12);
    expect(v('\\ln\\left(e\\right)+\\log\\left(1000\\right)')).toBe(4);
    expect(v('\\left|-3\\right|\\cdot2')).toBe(6);
    expect(v('\\mathrm{Ans}\\times2', 21)).toBe(42);
    expect(v('50\\%')).toBe(0.5);
    expect(v('5C2+5!')).toBe(130);
    expect(v('3{,}5\\cdot2')).toBe(7);
    expect(v('e^{0}')).toBe(1);
    expect(v('\\binom{5}{2}')).toBe(10);
  });
  it('asks for empty boxes', () => {
    expect(() => latexToCalc('\\frac{3}{\\placeholder{}}')).toThrow(/empty box/);
  });
});
