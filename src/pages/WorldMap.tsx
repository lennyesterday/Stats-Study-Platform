import { conceptAnchor, getWeek } from '../course';
import { WORLDS } from '../content/worlds';
import type { World } from '../content/types';
import { Progress } from '../components/ui';
import type { GameState } from '../lib/state';
import { navigate } from '../router';
import { useStore } from '../store';

export function worldProgress(s: GameState, w: World) {
  const theory = w.theory.filter((t) => s.theoryRead[t.id]).length;
  const examples = w.examples.filter((e) => s.examplesDone[e.id]).length;
  const ex = w.exercises.filter((e) => (s.exercises[e.id]?.correct ?? 0) > 0).length;
  const cards = w.flashcards.filter((c) => s.cards[c.id]?.seen).length;
  const parts = [theory / w.theory.length, examples / w.examples.length, ex / w.exercises.length, cards / w.flashcards.length, s.bosses[w.id]?.passed ? 1 : 0];
  return { theory, examples, ex, cards, total: parts.reduce((a, b) => a + b, 0) / parts.length };
}

/** Course overview: Weeks 1–6, each with its parts and concepts (Stats Study Lab roadmap style). */
export default function WeeksOverview() {
  const s = useStore();
  return (
    <div className="lab">
      <div className="head"><span className="eyebrow">Course</span><h1>Weeks 1–6</h1><p className="lede">Each week has a lesson (Learn), fresh-number practice, worked examples, flashcards, exam exercises and a boss fight that checks the whole week.</p></div>
      {WORLDS.map((w) => {
        const wk = getWeek(w.id)!, p = worldProgress(s, w);
        return (
          <section className="part" key={w.id}>
            <header className="parthead">
              <span className="pn">{w.id}</span><span className="eyebrow">Week {w.id} · {Math.round(p.total * 100)}% complete{s.bosses[w.id]?.passed ? ' · boss beaten' : ''}</span>
              <h2><a href={`#/week/${w.id}/learn`} style={{ color: 'inherit', textDecoration: 'none' }}>{wk.title}</a></h2>
              <p className="lede" style={{ marginTop: 6 }}>{wk.blurb}</p>
              <div style={{ marginTop: 10, maxWidth: 320 }}><Progress value={p.total} height={4} color="var(--ink)" /></div>
            </header>
            <div className="roadmap" style={{ marginBottom: 20 }}>
              {wk.parts.map((part, pi) => (
                <div className="rm-part" key={pi}>
                  <span className="rk">Part {pi + 1}{s.theoryRead[w.theory[pi].id] ? ' · ✓' : ''}</span><b>{part.title}</b>
                  <ol>{part.concepts.map((c, ci) => (
                    <li key={ci}><button type="button" onClick={() => { navigate(`/week/${w.id}/learn`); setTimeout(() => document.getElementById(conceptAnchor(pi, ci))?.scrollIntoView({ block: 'start' }), 60); }}><span>{pi + 1}.{ci + 1}</span>{c.name}</button></li>
                  ))}</ol>
                </div>
              ))}
            </div>
            <div className="actions">
              <button className="btn" type="button" onClick={() => navigate(`/week/${w.id}/learn`)}>Learn</button>
              <button className="btn ghost" type="button" onClick={() => navigate(`/week/${w.id}/practice`)}>Practice</button>
              <button className="btn ghost" type="button" onClick={() => navigate(`/week/${w.id}/examples`)}>Examples · {p.examples}/{w.examples.length}</button>
              <button className="btn ghost" type="button" onClick={() => navigate(`/week/${w.id}/cards`)}>Flashcards · {p.cards}/{w.flashcards.length}</button>
              <button className="btn ghost" type="button" onClick={() => navigate(`/week/${w.id}/exercises`)}>Exam exercises · {p.ex}/{w.exercises.length}</button>
              <button className="btn ghost" type="button" onClick={() => navigate(`/week/${w.id}/boss`)}>Boss{s.bosses[w.id]?.passed ? ' ✓' : ''}</button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
