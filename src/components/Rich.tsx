import katex from 'katex';
import { Fragment, memo, type ReactNode } from 'react';
import { annotateTex, PROSE_TOKEN_RE } from '../course/symbols';

// symbols are wrapped in \htmlData{sym=…} so hovering shows their meaning (course/formulaUi.tsx)
const trust = (c: { command: string }) => c.command === '\\htmlData';

export function Tex({ children, display = false }: { children: string; display?: boolean }) {
  const html = katex.renderToString(annotateTex(children), { displayMode: display, throwOnError: false, strict: false, trust });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

const INLINE = /(\$\$[^$]+\$\$|\$[^$]+\$|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;

/** plain text with the symbols (x̄, σ, π₀, SE, df …) marked for the hover glossary */
function symbols(text: string, key: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(PROSE_TOKEN_RE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<span key={`${key}-s${m.index}`} className="sym" data-sym={m[1]}>{m[1]}</span>);
    last = m.index + m[1].length;
  }
  if (!out.length) return text;
  out.push(text.slice(last));
  return out;
}

function inline(text: string, key = '', syms = false): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const k = `${key}-${i}`;
    if (!part) return null;
    if (part.startsWith('$$')) return <Tex key={k} display>{part.slice(2, -2)}</Tex>;
    if (part.startsWith('$')) return <Tex key={k}>{part.slice(1, -1)}</Tex>;
    if (part.startsWith('**')) return <strong key={k} className="font-semibold">{inline(part.slice(2, -2), k, syms)}</strong>;
    if (part.startsWith('*') && part.length > 2) return <em key={k}>{syms ? symbols(part.slice(1, -1), k) : part.slice(1, -1)}</em>;
    return <Fragment key={k}>{syms ? symbols(part, k) : part}</Fragment>;
  });
}

/** Renders the content mini-language: paragraphs, "- " lists, $math$, $$display$$, **bold**, *italic*.
 *  `symbols` also marks symbols in the running text, so hovering them explains them. */
export const Rich = memo(function Rich({ text, className = '', symbols: syms = false }: { text: string; className?: string; symbols?: boolean }) {
  const blocks = text.split(/\n\s*\n/);
  return (
    <div className={`rich leading-relaxed ${className}`}>
      {blocks.map((b, bi) => {
        const lines = b.split('\n');
        const out: ReactNode[] = [];
        let list: string[] = [];
        let para: string[] = [];
        const flushList = () => {
          if (list.length) out.push(<ul key={`l${out.length}`}>{list.map((l, i) => <li key={i}>{inline(l, `${bi}-${i}`, syms)}</li>)}</ul>);
          list = [];
        };
        const flushPara = () => {
          if (para.length) out.push(<p key={`p${out.length}`}>{para.map((l, i) => <Fragment key={i}>{i > 0 && <br />}{inline(l, `${bi}-p${i}`, syms)}</Fragment>)}</p>);
          para = [];
        };
        lines.forEach((l) => {
          if (/^\s*- /.test(l)) { flushPara(); list.push(l.replace(/^\s*- /, '')); }
          else { flushList(); para.push(l); }
        });
        flushList(); flushPara();
        return <Fragment key={bi}>{out}</Fragment>;
      })}
    </div>
  );
});
