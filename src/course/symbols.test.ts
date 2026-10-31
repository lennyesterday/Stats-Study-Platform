import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { FORMULAS } from '../content/formulas';
import { WORLDS } from '../content/worlds';
import { makeRng } from '../lib/rng';
import { annotateTex, GLOSSARY, PROSE_TOKEN_RE, TOKEN_RE } from './symbols';

const trust = (c: { command: string }) => c.command === '\\htmlData';

/** every $…$ / $$…$$ in the static content, the formula sheet and generated exercises */
function allTex(): string[] {
  const texts = [JSON.stringify(WORLDS.map((w) => [w.examples, w.flashcards, w.interpretations]))];
  for (const w of WORLDS) for (const e of w.exercises) { const i = e.generate(makeRng(7)); texts.push(JSON.stringify([i.prompt, i.hints, i.solution])); }
  const out = FORMULAS.flatMap((g) => g.items.map((i) => i.tex));
  for (const t of texts) {
    const s = JSON.parse(`[${JSON.stringify(t)}]`)[0].replace(/\\\\/g, '\\');
    for (const m of s.matchAll(/\$\$([^$]+)\$\$|\$([^$]+)\$/g)) out.push(m[1] ?? m[2]);
  }
  return out;
}

describe('formula symbols', () => {
  it('annotated TeX still renders and carries symbol data', () => {
    const tex = allTex();
    expect(tex.length).toBeGreaterThan(100);
    let tagged = 0;
    for (const t of tex) {
      const html = katex.renderToString(annotateTex(t), { throwOnError: true, strict: false, trust });
      const keys = [...html.matchAll(/data-sym="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
      for (const k of keys) expect(GLOSSARY[k], `${k} in ${t}`).toBeTruthy();
      if (keys.length) tagged++;
    }
    expect(tagged / tex.length).toBeGreaterThan(0.5);
  });

  it('does not treat letters inside words or commands as symbols', () => {
    expect(annotateTex('\\sqrt{n}')).toBe('\\sqrt{{\\htmlData{sym=n}{n}}}');
    expect(annotateTex('\\text{mean}')).toBe('\\text{mean}');
    expect([...'count = x̄ ± s'.matchAll(TOKEN_RE)].map((m) => m[1])).toEqual(['count', 'x̄', 's']);
  });
});

describe('symbols in running text (flashcards)', () => {
  const hits = (s: string) => [...s.matchAll(PROSE_TOKEN_RE)].map((m) => m[1]);
  it('marks symbols but not ordinary words', () => {
    expect(hits('Parameter: μ, σ, π. Statistic: x̄, s, p.')).toEqual(['μ', 'σ', 'π', 'x̄', 's', 'p']);
    expect(hits("Cramér's V and Fisher's test, a sample, i.e. count the width")).toEqual([]);
    expect(hits('SE with π₀ in the test, df = n − 1, H₀ is true, R² and SSB')).toEqual(['SE', 'π₀', 'df', 'n', 'H₀', 'R²', 'SSB']);
    expect(hits('2×2 table, 95 % CI, column 0.975, Q1')).toEqual(['CI', 'Q1']);
  });
});
