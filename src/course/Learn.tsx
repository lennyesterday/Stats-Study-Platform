import { useMemo, useState } from 'react';
import { allPractice, conceptAnchor, partId, type Concept, type Week } from '.';
import { useStore } from '../store';
import { Html } from './Html';
import { cardsForPart } from './partCards';
import { FlashcardReviewer } from '../components/FlashcardReviewer';

const row = (label: string, html?: string) => html ? `<div class="crow"><div class="clabel">${label}</div><div class="cbody">${html}</div></div>` : '';

const conceptHtml = (c: Concept, pi: number, ci: number) => `<article class="concept" id="${conceptAnchor(pi, ci)}">
  <div class="chead"><span class="cn">${pi + 1}.${ci + 1}</span><h3>${c.name}</h3><span class="ctag">${c.tag}</span></div>
  ${row('Idea', c.idea)}${row('Formula', c.formula)}${row('Steps', c.steps)}${row('Example', c.example)}${row('Watch out', c.watch ? `<div class="watch">${c.watch}</div>` : '')}
  ${c.widgets ? row('Try it', c.widgets.map((k) => `<div class="widget" data-w="${k}"></div>`).join('')) : ''}
</article>`;

export const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Week › Learn: roadmap of parts, then each part with its concepts, summary and "next up". */
export function Learn({ w, onPractice }: { w: Week; onPractice: () => void }) {
  const read = useStore((s) => s.theoryRead);
  const mark = useStore((s) => s.markTheory);
  const n = w.parts.length;
  // only one part's deck at a time: the reviewer listens to Space and 1–4 on the whole page
  const [cardsOpen, setCardsOpen] = useState<number | null>(null);
  const parts = useMemo(() => w.parts.map((p, pi) => p.concepts.map((c, ci) => conceptHtml(c, pi, ci)).join('')), [w]);
  return (
    <div data-week={w.num}>
      <div className="roadmap">
        {w.parts.map((p, pi) => (
          <div className="rm-part" key={pi}>
            <span className="rk">Part {pi + 1}{read[partId(w.num, pi)] ? ' · ✓' : ''}</span><b>{p.title}</b>
            <ol>{p.concepts.map((c, ci) => <li key={ci}><button type="button" onClick={() => jumpTo(conceptAnchor(pi, ci))}><span>{pi + 1}.{ci + 1}</span>{c.name}</button></li>)}</ol>
            {p.bridge && pi < n - 1 && <span className="rm-bridge">→ {p.bridge}</span>}
          </div>
        ))}
      </div>
      {w.parts.map((p, pi) => {
        const id = partId(w.num, pi), done = !!read[id];
        return (
          <section className="part" id={`part-${pi + 1}`} key={pi}>
            <header className="parthead">
              <span className="pn">{pi + 1}</span><span className="eyebrow">Part {pi + 1} of {n}</span><h2>{p.title}</h2>
              <p className="lede" style={{ marginTop: 6 }} dangerouslySetInnerHTML={{ __html: p.intro }} />
              <span className="meta" style={{ marginTop: 8 }}>Builds on: <b>{p.buildsOn}</b></span>
            </header>
            <Html className="concepts" html={parts[pi]} />
            <div className="box summary">
              <h4>Summary of part {pi + 1}</h4>
              <ul>{p.summary.map((s, i) => <li key={i} dangerouslySetInnerHTML={{ __html: s }} />)}</ul>
              <div style={{ marginTop: 14 }}>
                <button className={done ? 'btn ghost' : 'btn'} type="button" disabled={done} onClick={() => mark(id)}>{done ? '✓ Part read' : 'Mark part as read · +15 XP'}</button>
              </div>
            </div>
            {cardsForPart(w.num, pi).length > 0 && (
              <section className="box partcards" aria-label={`Flashcards for part ${pi + 1}`}>
                <div className="pc-head">
                  <div>
                    <span className="eyebrow">Read · apply</span>
                    <h4>Flashcards for part {pi + 1}</h4>
                    <p className="sub" style={{ margin: '2px 0 0' }}>{cardsForPart(w.num, pi).length} cards on {pi + 1}.1–{pi + 1}.{p.concepts.length}. Your ratings count for spaced repetition, like in the Flashcards tab.</p>
                  </div>
                  <button className={cardsOpen === pi ? 'btn ghost' : 'btn'} type="button" onClick={() => setCardsOpen(cardsOpen === pi ? null : pi)}>
                    {cardsOpen === pi ? 'Close cards' : `Test yourself · ${cardsForPart(w.num, pi).length} cards`}
                  </button>
                </div>
                {cardsOpen === pi && (
                  <div style={{ marginTop: 16 }}>
                    <FlashcardReviewer key={`${w.num}-${pi}`} cards={cardsForPart(w.num, pi)} cram
                      doneMessage={pi < n - 1 ? <>Part {pi + 1} done. Continue with part {pi + 2} below.</> : <>All parts done. Time for the Practice tab.</>} />
                  </div>
                )}
              </section>
            )}
            {pi < n - 1 ? (
              <div className="box next">
                <div><h4>Next up</h4><b>Part {pi + 2} · {w.parts[pi + 1].title}</b><p className="sub" style={{ margin: '2px 0 0' }}>Builds on {w.parts[pi + 1].buildsOn}.</p></div>
                <button className="btn ghost" type="button" onClick={() => jumpTo(`part-${pi + 2}`)}>Continue →</button>
              </div>
            ) : (
              <div className="box next">
                <div><h4>Done with week {w.num}</h4><b>Test yourself on all {allPractice(w).length} question types</b></div>
                <button className="btn" type="button" onClick={onPractice}>Start practising →</button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
