import { type ReactNode } from 'react';
import { conceptAnchor, WEEKS } from '../course';
import { TablesDrawer } from '../course/Html';
import { FormulaLayer } from '../course/formulaUi';
import { Calculator } from '../course/Calculator';
import { FormulaWindow } from '../course/FormulaWindow';
import { AskWindow } from '../course/AskWindow';
import { jumpTo } from '../course/Learn';
import { todayKey } from '../lib/dates';
import { displayStreak, levelInfo } from '../lib/game';
import { useRoute } from '../router';
import { useStore } from '../store';
import { Countdown } from './widgets';

// Rail layout from Stats Study Lab: weeks (with the open week's outline), study tools, reference.
const STUDY: { to: string; wk: string; label: string; match: string }[] = [
  { to: '/', wk: '◷', label: 'Today', match: '' },
  { to: '/weeks', wk: '▤', label: 'Course overview', match: 'weeks|map' },
  { to: '/plan', wk: '▦', label: 'Study plan', match: 'plan' },
  { to: '/cards', wk: '❐', label: 'Flashcards', match: 'cards' },
  { to: '/practice', wk: '✎', label: 'Mixed practice', match: 'practice' },
  { to: '/tables', wk: '⊞', label: 'Table trainer', match: 'tables' },
  { to: '/mocks', wk: '◎', label: 'Mock exams', match: 'mocks' },
  { to: '/lab', wk: '∿', label: 'Visual lab', match: 'lab' },
  { to: '/progress', wk: '↗', label: 'Progress', match: 'progress' },
];
const REFERENCE: typeof STUDY = [
  { to: '/formulas', wk: 'Σ', label: 'Formula sheet', match: 'formulas' },
  { to: '/dataset', wk: '▦', label: 'Dataset', match: 'dataset' },
  { to: '/methods', wk: '?', label: 'Which method?', match: 'methods' },
  { to: '/settings', wk: '⚙', label: 'Settings', match: 'settings' },
];

function NavItem({ to, wk, label, active, extra }: { to: string; wk: string; label: string; active: boolean; extra?: ReactNode }) {
  return (
    <a className="navbtn" href={`#${to}`} aria-current={active ? 'page' : undefined}>
      <span className="wk">{wk}</span><span className="nt">{label}</span>{extra ?? <span />}
    </a>
  );
}

function Rail() {
  const { parts } = useRoute();
  const [p0, p1, p2] = parts;
  const read = useStore((s) => s.theoryRead);
  const xp = useStore((s) => s.xp);
  const streak = useStore((s) => s.streak);
  const lv = levelInfo(xp);
  const st = displayStreak(streak, todayKey());
  const onWeek = p0 === 'week' || p0 === 'world';
  const learnOpen = onWeek && (!p2 || p2 === 'learn' || p2 === 'theory');
  const group = (items: typeof STUDY) => items.map((n) => (
    <NavItem key={n.to} to={n.to} wk={n.wk} label={n.label} active={n.match === '' ? p0 === undefined : new RegExp(`^(${n.match})$`).test(p0 ?? '')} />
  ));
  return (
    <aside className="rail no-print">
      <a className="brand" href="#/" style={{ color: 'inherit', textDecoration: 'none' }}><b>Stats Quest</b><span>Statistical Analysis · 2966</span></a>
      <div className="rail-stats">
        <a href="#/progress" title={`${lv.into} / ${lv.span} XP to level ${lv.level + 1}`} style={{ color: 'inherit', textDecoration: 'none' }}>Lv <b>{lv.level}</b> · {lv.title}</a>
        <span title={st.atRisk ? 'Study today to keep your streak' : 'Daily streak'}>Streak <b>{st.value}</b>{st.atRisk ? ' !' : ''}</span>
        <span><Countdown compact /></span>
      </div>
      <nav className="navs" aria-label="Course">
        <div className="navgroup">
          <div className="navlabel">Weeks</div>
          {WEEKS.map((w) => {
            const active = onWeek && Number(p1) === w.num;
            const done = w.parts.filter((_, pi) => read[`w${w.num}-p${pi + 1}`]).length;
            return (
              <div key={w.id} style={{ display: 'contents' }}>
                <NavItem to={`/week/${w.num}/learn`} wk={`W${w.num}`} label={w.title} active={active} extra={<span className="np">{done}/{w.parts.length}</span>} />
                {active && learnOpen && (
                  <div className="nav-outline">
                    {w.parts.map((p, pi) => (
                      <div key={pi} style={{ display: 'contents' }}>
                        <div className="op">Part {pi + 1} · {p.title}</div>
                        {p.concepts.map((c, ci) => <button key={ci} type="button" onClick={() => jumpTo(conceptAnchor(pi, ci))}><span>{pi + 1}.{ci + 1}</span>{c.name}</button>)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="navgroup"><div className="navlabel">Study</div>{group(STUDY)}</div>
        <div className="navgroup">
          <div className="navlabel">Reference</div>
          {group(REFERENCE.slice(0, 1))}
          <button className="navbtn" type="button" data-open-table=""><span className="wk">⊞</span><span className="nt">Statistical tables</span><span /></button>
          <button className="navbtn" type="button" data-open-formulas=""><span className="wk">ƒ</span><span className="nt">Formula window</span><span /></button>
          <button className="navbtn" type="button" data-open-calc=""><span className="wk">±</span><span className="nt">Calculator</span><span /></button>
          {group(REFERENCE.slice(1))}
        </div>
      </nav>
    </aside>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="shell">
        <Rail />
        <main className="page">{children}</main>
      </div>
      <div className="dock no-print"><FormulaWindow /><Calculator /><TablesDrawer /><AskWindow /></div>
      <FormulaLayer />
    </>
  );
}

