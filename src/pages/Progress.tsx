import { Heatmap, MasteryRadar, Gauge } from '../components/widgets';
import { Card, PageHeader, Pill, Progress as Bar } from '../components/ui';
import { WORLDS } from '../content/worlds';
import { todayKey } from '../lib/dates';
import { BADGES, displayStreak, LEVEL_TITLES, levelInfo } from '../lib/game';
import { allMastery, readiness } from '../lib/mastery';
import { useStore } from '../store';

export default function Progress() {
  const s = useStore();
  const lv = levelInfo(s.xp);
  const st = displayStreak(s.streak, todayKey());
  const r = readiness(s);
  const m = allMastery(s);
  const reviews = Object.values(s.cards).reduce((a, c) => a + c.seen, 0);
  const solved = Object.values(s.exercises).reduce((a, e) => a + e.correct, 0);
  const stats = [
    ['Total XP', s.xp.toLocaleString()], ['Streak', `${st.value} (best ${s.streak.best})`], ['Card reviews', reviews], ['Exercises solved', solved],
    ['Table accuracy', s.tables.total ? `${Math.round((s.tables.correct / s.tables.total) * 100)} %` : '—'], ['Sprint best', s.sprint.best],
    ['Bosses beaten', `${Object.values(s.bosses).filter((b) => b.passed).length} / 6`], ['Mocks taken', s.mocks.length], ['Decision streak (best)', s.decisionBest],
  ];
  return (
    <div>
      <PageHeader title="Progress" subtitle="Level, badges, mastery per topic and exam readiness" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-xp text-2xl font-bold text-white">{lv.level}</span>
            <div><div className="text-xl font-semibold">{lv.title}</div><div className="text-sm text-muted">{lv.into} / {lv.span} XP to level {lv.level + 1}</div></div>
          </div>
          <Bar value={lv.progress} className="mt-3" color="var(--xp)" />
          <div className="mt-4 space-y-1 text-sm">
            {LEVEL_TITLES.map((t) => <div key={t.from} className={`flex justify-between ${lv.level >= t.from ? '' : 'text-muted'}`}><span>{lv.level >= t.from ? '✓' : '·'} {t.title}</span><span>Lv {t.from}</span></div>)}
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-1 font-semibold">Exam readiness</div>
          <Gauge value={r.grade} label="estimated grade / 20" />
          <p className="mt-2 text-sm text-muted">{r.basedOnMocks ? `40 % mastery + 60 % average of your last ${r.basedOnMocks} full mock(s).` : 'Based on mastery only until you take full mocks.'} Average mastery {r.masteryAvg} %.</p>
        </Card>
        <Card className="p-5">
          <div className="mb-2 font-semibold">Stats</div>
          <div className="grid grid-cols-2 gap-2 text-sm">{stats.map(([k, v]) => <div key={k as string} className="rounded-xl bg-surface2 px-3 py-2"><div className="text-xs text-muted">{k}</div><div className="font-semibold">{v}</div></div>)}</div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><div className="mb-2 font-semibold">Mastery radar</div><MasteryRadar height={320} /></Card>
        <Card className="p-5">
          <div className="mb-2 font-semibold">Mastery by topic</div>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted"><tr><th className="text-left">Topic</th><th>Theory</th><th>Cards</th><th>Exercises</th><th>Mocks</th><th>Total</th></tr></thead>
            <tbody>
              {m.map((t) => (
                <tr key={t.id} className="border-t border-line">
                  <td className="py-1.5"><a className="hover:text-accent" href={`#/week/${t.world}/exercises`}>{t.label}</a></td>
                  {[t.theory, t.cards, t.exercises].map((v, i) => <td key={i} className="text-center">{Math.round(v * 100)}</td>)}
                  <td className="text-center">{t.mock === null ? '—' : Math.round(t.mock * 100)}</td>
                  <td className="text-center"><Pill tone={t.total >= 75 ? 'good' : t.total >= 40 ? 'warn' : 'bad'}>{t.total}%</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">Total = 15 % theory + 30 % flashcards + 35 % exercises + 20 % mock questions (renormalised before your first mock).</p>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <div className="mb-3 flex items-center justify-between font-semibold"><span>Badges</span><span className="text-sm text-muted">{Object.keys(s.badges).length} / {BADGES.length}</span></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {BADGES.map((b) => {
            const got = s.badges[b.id];
            return (
              <div key={b.id} className={`flex items-center gap-3 rounded-xl border p-3 ${got ? 'border-xp/40 bg-accent-soft' : 'border-line opacity-60'}`}>
                <span className={`text-3xl ${got ? '' : 'grayscale'}`}>{b.icon}</span>
                <div><div className="text-sm font-semibold">{b.title}</div><div className="text-xs text-muted">{b.desc}</div>{got && <div className="text-[11px] text-xp">earned {got}</div>}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="p-5"><div className="mb-2 font-semibold">Activity</div><Heatmap weeks={12} /></Card>
        <Card className="p-5">
          <div className="mb-2 font-semibold">Weeks</div>
          {WORLDS.map((w) => <div key={w.id} className="flex justify-between border-b border-line py-1 text-sm"><span>{w.icon} {w.title}</span><span>{s.bosses[w.id]?.passed ? '👑' : s.bosses[w.id] ? `${s.bosses[w.id].best}%` : '—'}</span></div>)}
        </Card>
      </div>
    </div>
  );
}
