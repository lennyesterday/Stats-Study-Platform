// Calculator engine: tokenizer → syntax tree → value, TeX (pretty fractions) and an equation solver. No eval.
// Grammar: + − × ÷, ^ (right-assoc), unary ±, postfix ! and %, nCr / nPr (5C2, 5P2), implicit multiplication
// (2π, 3(4), 2√9, z σ), brackets ( ) [ ] { } (missing closing brackets are added at the end), |x| for abs,
// functions sqrt/√, cbrt/∛, ln, log, exp, abs, sin, cos, tan, constants π, e, Ans, and variables (SE, σ, x̄, μ₀ …).

export class CalcError extends Error {}

export type Node =
  | { t: 'num'; v: number; raw: string }
  | { t: 'var'; name: string }
  | { t: 'const'; name: 'pi' | 'e' | 'ans' }
  | { t: 'neg'; a: Node }
  | { t: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Node; b: Node; implicit?: boolean }
  | { t: 'fn'; name: string; a: Node }
  | { t: 'post'; op: '!' | '%'; a: Node }
  | { t: 'choose'; perm: boolean; a: Node; b: Node }
  | { t: 'paren'; a: Node };

const FUNCS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt, cbrt: Math.cbrt, ln: Math.log, log: Math.log10, exp: Math.exp, abs: Math.abs,
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
};

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new CalcError('n! needs a whole number ≥ 0');
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function choose(n: number, k: number, perm: boolean): number {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0) throw new CalcError('nCr / nPr need whole numbers ≥ 0');
  if (k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r *= perm ? n - i : (n - i) / (i + 1);
  return perm ? r : Math.round(r);
}

/** unify the symbols used on the keypad and typed by hand */
export const normalise = (s: string) => s
  .replace(/[×·*]/g, '*').replace(/[÷:/]/g, '/').replace(/[−–]/g, '-')
  .replace(/²/g, '^2').replace(/³/g, '^3').replace(/π(?![₀-₉_])/g, ' pi ').replace(/∛/g, ' cbrt ').replace(/√/g, ' sqrt ')
  .replace(/[[{]/g, '(').replace(/[\]}]/g, ')').replace(/\|([^|]*)\|/g, 'abs($1)')
  .replace(/(\d),(\d)/g, '$1.$2');

// ---------- tokenizer ----------

type Tok = { k: 'num'; v: number; raw: string } | { k: 'id'; s: string } | { k: 'op'; s: string };
const NUM_RE = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i;
// identifiers: letters (any script, with accents like x̄) plus subscripts; ASCII digits end a name, so 5C2 = 5 C 2
const ID_RE = /^[\p{L}_][\p{L}\p{M}_₀-₉]*/u;

function tokenize(src: string): Tok[] {
  const s = normalise(src), out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const num = NUM_RE.exec(s.slice(i));
    if (num) { out.push({ k: 'num', v: parseFloat(num[0]), raw: num[0] }); i += num[0].length; continue; }
    const id = ID_RE.exec(s.slice(i));
    if (id) { out.push({ k: 'id', s: id[0] }); i += id[0].length; continue; }
    if ('+-*/^()!%'.includes(c)) { out.push({ k: 'op', s: c }); i++; continue; }
    throw new CalcError(`Unexpected “${c}”`);
  }
  return out;
}

// ---------- parser ----------

export function parse(src: string): Node {
  const toks = tokenize(src);
  if (!toks.length) throw new CalcError('Empty');
  let i = 0;
  const isOp = (s: string, k = 0) => { const t = toks[i + k]; return !!t && t.k === 'op' && t.s === s; };
  const eat = (s: string) => { if (isOp(s)) { i++; return true; } return false; };
  const startsOperand = (t?: Tok) => !!t && (t.k === 'num' || t.k === 'id' || (t.k === 'op' && t.s === '('));
  const isChoose = () => { const t = toks[i]; return t?.k === 'id' && (t.s === 'C' || t.s === 'P') && (toks[i + 1]?.k === 'num' || isOp('(', 1)); };

  const expr = (): Node => {
    let v = term();
    for (;;) {
      if (eat('+')) v = { t: 'bin', op: '+', a: v, b: term() };
      else if (eat('-')) v = { t: 'bin', op: '-', a: v, b: term() };
      else return v;
    }
  };
  const term = (): Node => {
    let v = unary();
    for (;;) {
      if (eat('*')) v = { t: 'bin', op: '*', a: v, b: unary() };
      else if (eat('/')) v = { t: 'bin', op: '/', a: v, b: unary() };
      else if (isChoose()) { const perm = (toks[i++] as { s: string }).s === 'P'; v = { t: 'choose', perm, a: v, b: unary() }; }
      else if (startsOperand(toks[i])) v = { t: 'bin', op: '*', a: v, b: unary(), implicit: true };
      else return v;
    }
  };
  // −2^2 = −4, like on paper
  const unary = (): Node => eat('-') ? { t: 'neg', a: unary() } : eat('+') ? unary() : power();
  const power = (): Node => { const b = postfix(); return eat('^') ? { t: 'bin', op: '^', a: b, b: unary() } : b; };
  const postfix = (): Node => {
    let v = atom();
    for (;;) {
      if (eat('!')) v = { t: 'post', op: '!', a: v };
      else if (eat('%')) v = { t: 'post', op: '%', a: v };
      else return v;
    }
  };
  const atom = (): Node => {
    if (eat('(')) {
      const v = expr();
      if (!eat(')') && i < toks.length) throw new CalcError('Missing )');
      return { t: 'paren', a: v };
    }
    const t = toks[i];
    if (!t) throw new CalcError('Incomplete expression');
    if (t.k === 'num') { i++; return { t: 'num', v: t.v, raw: t.raw }; }
    if (t.k === 'id') {
      i++;
      const low = t.s.toLowerCase();
      if (low === 'pi') return { t: 'const', name: 'pi' };
      if (t.s === 'e') return { t: 'const', name: 'e' };
      if (low === 'ans') return { t: 'const', name: 'ans' };
      if (FUNCS[low] && startsOperand(toks[i])) return { t: 'fn', name: low, a: isOp('(') ? atom() : postfix() };
      return { t: 'var', name: t.s };
    }
    throw new CalcError(t.s === ')' ? 'Too many )' : `Unexpected “${t.s}”`);
  };

  const v = expr();
  if (i < toks.length) { const t = toks[i]; throw new CalcError(t.k === 'op' && t.s === ')' ? 'Too many )' : `Unexpected “${t.k === 'num' ? t.raw : t.s}”`); }
  return v;
}

// ---------- evaluation ----------

export function evalNode(n: Node, env: Record<string, number> = {}, ans = 0): number {
  const ev = (x: Node) => evalNode(x, env, ans);
  switch (n.t) {
    case 'num': return n.v;
    case 'const': return n.name === 'pi' ? Math.PI : n.name === 'e' ? Math.E : ans;
    case 'var': {
      const v = env[n.name];
      if (v === undefined) throw new CalcError(`Unknown: ${n.name}`);
      return v;
    }
    case 'paren': return ev(n.a);
    case 'neg': return -ev(n.a);
    case 'post': return n.op === '!' ? factorial(ev(n.a)) : ev(n.a) / 100;
    case 'choose': return choose(ev(n.a), ev(n.b), n.perm);
    case 'fn': {
      const x = ev(n.a), r = FUNCS[n.name](x);
      if (Number.isNaN(r)) throw new CalcError(`${n.name} is not defined for ${fmt(x)}`);
      return r;
    }
    case 'bin': {
      const a = ev(n.a), b = ev(n.b);
      switch (n.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': if (b === 0) throw new CalcError('Division by 0'); return a / b;
        case '^': { const r = Math.pow(a, b); if (Number.isNaN(r)) throw new CalcError(`${fmt(a)}^${fmt(b)} is not defined`); return r; }
      }
    }
  }
}

export function evaluate(input: string, ans = 0, env: Record<string, number> = {}): number {
  const v = evalNode(parse(input), env, ans);
  if (!Number.isFinite(v)) throw new CalcError('Result is too large or undefined');
  return v;
}

// ---------- pretty printing (TeX for KaTeX) ----------

const GREEK: Record<string, string> = {
  α: '\\alpha', β: '\\beta', γ: '\\gamma', δ: '\\delta', ε: '\\varepsilon', θ: '\\theta', λ: '\\lambda', μ: '\\mu', ν: '\\nu',
  π: '\\pi', ρ: '\\rho', σ: '\\sigma', τ: '\\tau', φ: '\\varphi', χ: '\\chi', ω: '\\omega', Σ: '\\Sigma', Δ: '\\Delta',
};
const SUB: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', 'ᵢ': 'i', 'ⱼ': 'j', 'ₖ': 'k', 'ₙ': 'n' };

/** variable name → TeX: x̄ → \bar{x}, μ₀ → \mu_{0}, SE → \mathrm{SE}, s_x → s_{x} */
export function texName(name: string): string {
  let base = name, sub = '';
  const us = name.indexOf('_');
  if (us > 0) { base = name.slice(0, us); sub = name.slice(us + 1); }
  base = [...base].filter((c) => { if (SUB[c]) { sub += SUB[c]; return false; } return true; }).join('');
  let tex = '';
  for (const ch of base.normalize('NFD').match(/\P{M}\p{M}*/gu) ?? []) {
    const letter = ch[0], marks = ch.slice(1);
    let t = GREEK[letter] ?? letter;
    if (marks.includes('̄')) t = `\\bar{${t}}`;
    if (marks.includes('̂')) t = `\\hat{${t}}`;
    tex += t;
  }
  if ([...base].length > 1 && /^[A-Za-z]+$/.test(base)) tex = `\\mathrm{${base}}`;
  return sub ? `${tex}_{${sub}}` : tex;
}

const PREC: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 3, '^': 4 };
const prec = (n: Node): number => n.t === 'bin' ? PREC[n.op] : n.t === 'neg' ? 2 : n.t === 'choose' ? 2 : n.t === 'post' ? 5 : 6;
const strip = (n: Node): Node => n.t === 'paren' ? strip(n.a) : n;

/** TeX for a syntax tree; `values` replaces variables by numbers (for the "substituted" line of the solver) */
export function toTex(n: Node, values?: Record<string, number>, dp: number | null = null): string {
  const tx = (x: Node) => toTex(x, values, dp);
  const wrap = (x: Node, min: number) => prec(x) < min ? `\\left(${tx(strip(x))}\\right)` : tx(x);
  switch (n.t) {
    case 'num': return n.raw;
    case 'var': return values && values[n.name] !== undefined ? fmtTex(values[n.name], dp) : texName(n.name);
    case 'const': return n.name === 'pi' ? '\\pi' : n.name === 'e' ? 'e' : '\\mathrm{Ans}';
    case 'paren': return `\\left(${tx(n.a)}\\right)`;
    case 'neg': return `-${wrap(n.a, 2)}`;
    case 'post': return `${wrap(n.a, 5)}${n.op === '!' ? '!' : '\\%'}`;
    case 'choose': return n.perm ? `{}^{${tx(strip(n.a))}}P_{${tx(strip(n.b))}}` : `\\binom{${tx(strip(n.a))}}{${tx(strip(n.b))}}`;
    case 'fn': {
      const a = tx(strip(n.a));
      if (n.name === 'sqrt') return `\\sqrt{${a}}`;
      if (n.name === 'cbrt') return `\\sqrt[3]{${a}}`;
      if (n.name === 'abs') return `\\left|${a}\\right|`;
      if (n.name === 'exp') return `e^{${a}}`;
      return `\\${n.name}\\left(${a}\\right)`;
    }
    case 'bin': {
      if (n.op === '/') return `\\frac{${tx(strip(n.a))}}{${tx(strip(n.b))}}`;
      if (n.op === '^') return `${wrap(n.a, 5)}^{${tx(strip(n.b))}}`;
      if (n.op === '*') {
        const a = wrap(n.a, 2), b = wrap(n.b, 2.5);
        // keep "2σ" and "zσ" compact, but numbers next to numbers need a visible ×
        const numNext = values ? true : /\d$/.test(a) && /^[\d.]/.test(b);
        return n.implicit && !numNext ? `${a}\\,${b}` : `${a} \\cdot ${b}`;
      }
      return `${wrap(n.a, 1)} ${n.op === '+' ? '+' : '-'} ${wrap(n.b, n.op === '-' ? 2 : 1)}`;
    }
  }
}
const fmtTex = (v: number, dp: number | null) => { const s = fmt(v, dp); return v < 0 ? `(${s})` : s.replace(/e([+-]?\d+)$/, '\\cdot 10^{$1}'); };

// ---------- equation solver ----------

export function vars(n: Node, out: string[] = []): string[] {
  if (n.t === 'var') { if (!out.includes(n.name)) out.push(n.name); }
  else if ('a' in n) { vars(n.a, out); if ('b' in n) vars(n.b, out); }
  return out;
}
const count = (n: Node, name: string): number => n.t === 'var' ? +(n.name === name) : 'a' in n ? count(n.a, name) + ('b' in n ? count(n.b, name) : 0) : 0;

export function parseEquation(src: string) {
  const sides = src.split('=');
  if (sides.length !== 2 || !sides[0].trim() || !sides[1].trim()) throw new CalcError('Write one equation with one “=”, e.g. SE = σ / √n');
  const lhs = parse(sides[0]), rhs = parse(sides[1]);
  return { lhs, rhs, vars: vars(rhs, vars(lhs)) };
}

const num = (v: number): Node => ({ t: 'num', v, raw: String(v) });
const bin = (op: '+' | '-' | '*' | '/' | '^', a: Node, b: Node): Node => ({ t: 'bin', op, a, b });

/** Rearranges side = other until the unknown stands alone (only when it occurs once). null = cannot isolate. */
function isolate(side: Node, other: Node, x: string): { expr: Node; note?: string } | null {
  let note: string | undefined;
  for (let guard = 0; guard < 100; guard++) {
    if (side.t === 'var') return side.name === x ? { expr: other, note } : null;
    if (side.t === 'paren') { side = side.a; continue; }
    if (side.t === 'neg') { other = { t: 'neg', a: other }; side = side.a; continue; }
    if (side.t === 'post' && side.op === '%') { other = bin('*', other, num(100)); side = side.a; continue; }
    if (side.t === 'fn') {
      const a = side.a;
      switch (side.name) {
        case 'sqrt': other = bin('^', other, num(2)); break;
        case 'cbrt': other = bin('^', other, num(3)); break;
        case 'ln': other = { t: 'fn', name: 'exp', a: other }; break;
        case 'exp': other = { t: 'fn', name: 'ln', a: other }; break;
        case 'log': other = bin('^', num(10), other); break;
        default: return null;
      }
      side = a; continue;
    }
    if (side.t === 'bin') {
      const inA = count(side.a, x) > 0, { a, b } = side;
      switch (side.op) {
        case '+': other = inA ? bin('-', other, b) : bin('-', other, a); break;
        case '-': other = inA ? bin('+', other, b) : bin('-', a, other); break;
        case '*': other = inA ? bin('/', other, b) : bin('/', other, a); break;
        case '/': other = inA ? bin('*', other, b) : bin('/', a, other); break;
        case '^':
          if (inA) {
            if (b.t === 'num' && b.v === 2) { other = { t: 'fn', name: 'sqrt', a: other }; note = 'Taking the square root: the negative root is a solution too, but here the positive one is used.'; }
            else other = bin('^', other, bin('/', num(1), b));
          } else other = bin('/', { t: 'fn', name: 'ln', a: other }, { t: 'fn', name: 'ln', a });
          break;
      }
      side = inA ? a : b; continue;
    }
    return null;
  }
  return null;
}

export interface Solution { value: number; others: number[]; method: 'algebra' | 'numeric'; rearranged?: Node; note?: string }

/** Solves the equation for `unknown`, given values for all other variables. */
export function solve(src: string, values: Record<string, number>, unknown: string, ans = 0): Solution {
  const { lhs, rhs, vars: vs } = parseEquation(src);
  if (!vs.includes(unknown)) throw new CalcError(`${unknown} is not in the equation`);
  const missing = vs.filter((v) => v !== unknown && values[v] === undefined);
  if (missing.length) throw new CalcError(`Enter a value for ${missing.join(', ')}`);
  const env = (x: number) => ({ ...values, [unknown]: x });
  const f = (x: number) => { try { return evalNode(lhs, env(x), ans) - evalNode(rhs, env(x), ans); } catch { return NaN; } };
  const scale = Math.max(1, ...Object.values(values).map(Math.abs));
  const ok = (x: number) => Number.isFinite(x) && Math.abs(f(x)) <= 1e-7 * scale;

  // 1) algebra: the unknown appears once → rearrange
  const nL = count(lhs, unknown), nR = count(rhs, unknown);
  if (nL + nR === 1) {
    const iso = nL ? isolate(lhs, rhs, unknown) : isolate(rhs, lhs, unknown);
    if (iso) {
      try {
        const value = evalNode(iso.expr, values, ans);
        if (ok(value)) return { value, others: [], method: 'algebra', rearranged: iso.expr, note: iso.note };
      } catch { /* fall back to numbers */ }
    }
  }
  // 2) numbers: look for sign changes on a wide grid, then bisect
  const grid = [0];
  for (let k = -6; k <= 7; k++) for (let m = 1; m <= 9; m++) { grid.push(m * 10 ** k, -m * 10 ** k); }
  grid.sort((a, b) => a - b);
  const roots: number[] = [];
  const add = (r: number) => { if (ok(r) && !roots.some((q) => Math.abs(q - r) <= 1e-9 * Math.max(1, Math.abs(r)))) roots.push(r); };
  for (let k = 0; k + 1 < grid.length; k++) {
    let a = grid[k], b = grid[k + 1], fa = f(a), fb = f(b);
    if (fa === 0) { add(a); continue; }
    if (!Number.isFinite(fa) || !Number.isFinite(fb) || fa * fb > 0) continue;
    for (let it = 0; it < 200 && b - a > 1e-15 * Math.max(1, Math.abs(a)); it++) {
      const m = (a + b) / 2, fm = f(m);
      if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    add((a + b) / 2);
  }
  if (!roots.length) throw new CalcError('No solution found with these values');
  roots.sort((p, q) => (q > 0 ? 1 : 0) - (p > 0 ? 1 : 0) || Math.abs(p) - Math.abs(q));
  return { value: roots[0], others: roots.slice(1), method: 'numeric' };
}

// ---------- input from the visual editor (MathLive LaTeX → calculator syntax) ----------

const LATEX_WORDS: Record<string, string> = {
  times: '*', cdot: '*', ast: '*', div: '/', pi: 'pi', exponentialE: 'e', ln: ' ln ', log: ' log ', exp: ' exp ',
  sin: ' sin ', cos: ' cos ', tan: ' tan ', '%': '%', lbrack: '(', rbrack: ')', lparen: '(', rparen: ')', ',': ' ', ';': ' ',
  ':': ' ', '!': '', quad: ' ', qquad: ' ', ' ': ' ', mid: '|', vert: '|', lvert: '|', rvert: '|', '{': '(', '}': ')', cdotp: '*',
  sigma: 'σ', mu: 'μ', alpha: 'α', beta: 'β', chi: 'χ', rho: 'ρ', lambda: 'λ',
};

/** LaTeX from the visual editor → text the parser understands: \frac{3}{4} → (3)/(4), \sqrt{x} → sqrt(x) … */
export function latexToCalc(latex: string): string {
  const toks = latex.match(/\\[a-zA-Z]+|\\.|[\s\S]/g) ?? [];
  let i = 0;
  const skipSpace = () => { while (toks[i] === ' ') i++; };
  // one argument: {group} or a single token
  const arg = (): string => {
    skipSpace();
    if (toks[i] === '{') { i++; return seq('}'); }
    if (i >= toks.length) throw new CalcError('Incomplete expression');
    return one();
  };
  const seq = (end?: string): string => {
    let out = '';
    while (i < toks.length) {
      if (end && toks[i] === end) { i++; return out; }
      out += one();
    }
    if (end) throw new CalcError('Missing }');
    return out;
  };
  const delim = (side: 'left' | 'right') => {
    skipSpace();
    const d = toks[i++];
    if (d === '.') return '';
    if (d === '|' || d === '\\vert' || d === '\\lvert' || d === '\\rvert' || d === '\\mid') return side === 'left' ? 'abs(' : ')';
    return side === 'left' ? '(' : ')';
  };
  const one = (): string => {
    const t = toks[i++];
    if (t === '{') { const g = seq('}'); return g === ',' || g === '.' ? g : g ? `(${g})` : ''; }
    if (t === '^') return `^(${arg()})`;
    if (t === '_') { const sub = arg(); return /^\d+$/.test(sub) ? [...sub].map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join('') : `_${sub}`; }
    if (!t.startsWith('\\')) return t;
    const cmd = t.slice(1);
    switch (cmd) {
      case 'frac': case 'dfrac': case 'tfrac': { const a = arg(), b = arg(); return `((${a})/(${b}))`; }
      case 'binom': { const a = arg(), b = arg(); return `((${a})C(${b}))`; }
      case 'sqrt': {
        skipSpace();
        let n = '';
        if (toks[i] === '[') { i++; while (i < toks.length && toks[i] !== ']') n += one(); i++; }
        const a = arg();
        return n.trim() === '3' ? ` cbrt(${a})` : n.trim() ? `((${a})^(1/(${n})))` : ` sqrt(${a})`;
      }
      case 'left': return delim('left');
      case 'right': return delim('right');
      case 'mathrm': case 'operatorname': case 'text': case 'mathit': case 'textrm': return ` ${arg().replace(/[()]/g, '')} `;
      case 'placeholder': skipSpace(); if (toks[i] === '{') arg(); throw new CalcError('Fill in the empty box');
      case 'bar': return `${arg()}̄`;
      case 'hat': return `${arg()}̂`;
    }
    if (cmd in LATEX_WORDS) return LATEX_WORDS[cmd];
    throw new CalcError(`Unsupported: ${t}`);
  };
  return seq().replace(/\s+/g, ' ').trim();
}

// ---------- helpers ----------

/** brackets still open at the end of the input (they are closed automatically) */
export function openBrackets(input: string): number {
  let depth = 0;
  for (const c of normalise(input)) { if (c === '(') depth++; else if (c === ')') depth = Math.max(0, depth - 1); }
  return depth;
}

/** exact-looking fraction for a decimal (7/4 for 1.75), or null when there is none with a small denominator */
export function toFraction(v: number): string | null {
  if (!Number.isFinite(v) || Number.isInteger(v)) return null;
  let h0 = 0, h1 = 1, k0 = 1, k1 = 0, x = Math.abs(v);
  for (let i = 0; i < 30; i++) {
    const a = Math.floor(x);
    [h0, h1] = [h1, a * h1 + h0];
    [k0, k1] = [k1, a * k1 + k0];
    if (k1 > 10000) return null;
    if (Math.abs(Math.abs(v) - h1 / k1) <= 1e-10 * Math.max(1, Math.abs(v))) return `${v < 0 ? '−' : ''}${h1}/${k1}`;
    x = 1 / (x - a);
    if (!Number.isFinite(x)) break;
  }
  return null;
}

/** readable number: up to 10 significant digits, or fixed decimals when asked */
export function fmt(v: number, dp: number | null = null): string {
  if (dp != null) return v.toFixed(dp);
  if (v !== 0 && (Math.abs(v) >= 1e12 || Math.abs(v) < 1e-6)) return v.toExponential(6).replace(/\.?0+e/, 'e');
  return String(+v.toPrecision(10));
}

/** numbers from pasted text: spaces, new lines, semicolons, tabs or commas (when no decimal commas) */
export function parseList(text: string): number[] {
  const t = text.trim();
  if (!t) return [];
  const commaDecimals = /\d,\d/.test(t) && /[;\n\t ]/.test(t) && !/\d\.\d/.test(t);
  const parts = (commaDecimals ? t.replace(/(\d),(\d)/g, '$1.$2') : t).split(/[\s;,]+/);
  return parts.map((p) => parseFloat(p.replace('−', '-'))).filter(Number.isFinite);
}

export function describe(xs: number[]) {
  const n = xs.length, sum = xs.reduce((a, b) => a + b, 0), mean = sum / n;
  const ss = xs.reduce((a, x) => a + (x - mean) ** 2, 0), sorted = [...xs].sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  return {
    n, sum, sumSq: xs.reduce((a, x) => a + x * x, 0), mean, median, min: sorted[0], max: sorted[n - 1],
    varS: n > 1 ? ss / (n - 1) : NaN, sdS: n > 1 ? Math.sqrt(ss / (n - 1)) : NaN, varP: ss / n, sdP: Math.sqrt(ss / n), ss,
  };
}

/** course formulas to start the solver from */
export const SOLVE_TEMPLATES: { name: string; eq: string; hint?: string }[] = [
  { name: 'Standard error of the mean', eq: 'SE = σ / √n' },
  { name: 'Standard error (sample SD)', eq: 'SE = s / √n' },
  { name: 'z-score', eq: 'z = (x − μ) / σ' },
  { name: 'z statistic for a mean', eq: 'z = (x̄ − μ₀) / (σ / √n)' },
  { name: 't statistic for a mean', eq: 't = (x̄ − μ₀) / (s / √n)' },
  { name: 'Margin of error (mean)', eq: 'E = z σ / √n', hint: 'Solve for n to find the sample size for a given margin E.' },
  { name: 'Confidence interval bound', eq: 'U = x̄ + t s / √n' },
  { name: 'Standard error of a proportion', eq: 'SE = √(p(1 − p) / n)' },
  { name: 'Margin of error (proportion)', eq: 'E = z √(p(1 − p) / n)' },
  { name: 'z statistic for a proportion', eq: 'z = (p − π₀) / √(π₀(1 − π₀) / n)' },
  { name: 'Coefficient of variation', eq: 'CV = s / x̄' },
  { name: 'ANOVA: F statistic', eq: 'F = MSB / MSW' },
  { name: 'ANOVA: mean square between', eq: 'MSB = SSB / (k − 1)' },
  { name: 'ANOVA: mean square within', eq: 'MSW = SSW / (n − k)' },
  { name: 'ANOVA: total sum of squares', eq: 'SST = SSB + SSW' },
  { name: 'χ² degrees of freedom', eq: 'df = (r − 1)(c − 1)' },
  { name: 'Regression line', eq: 'ŷ = b₀ + b₁ x' },
  { name: 'Coefficient of determination', eq: 'R = SSR / SST', hint: 'R stands for R² here.' },
  { name: 'Slope t statistic', eq: 't = b₁ / SE' },
];
