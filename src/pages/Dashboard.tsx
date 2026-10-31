import { ALL_CARDS, WORLDS } from '../content/worlds';
import { Countdown, Gauge, Heatmap, MasteryRadar } from '../components/widgets';
import { Button, Card, LinkButton, Pill, Progress } from '../components/ui';
import { PlanTaskRow } from './Plan';
import { prettyDate, todayKey } from '../lib/dates';
import { canFreeze, displayStreak, levelInfo } from '../lib/game';
import { readiness, weakestTopics } from '../lib/mastery';
import { agenda, buildPlan, overdueCount, phaseFor } from '../lib/plan';
import { isUnlocked } from '../lib/unlock';
import { navigate } from '../router';
import { planSettings, todaysQuests, useStore } from '../store';
import { addDays } from '../lib/dates';

export default function Dashboard() {
  const s = useStore();
  const today = todayKey();
  const plan = buildPlan(planSettings(s), s.plan);
  const tasks = agenda(plan, today, today, s.tasksDone, planSettings(s));
  const quests = todaysQuests(s, today);
  const counters = s.day[today] ?? {};
  const lv = levelInfo(s.xp);
  const st = displayStreak(s.streak, today);
  const rd = readiness(s);
  const phase = phaseFor(today);
  const due = ALL_CARDS.filter((c) => (s.cards[c.id]?.due ?? today) <= today).length + s.mistakes.filter((m) => (s.cards[`m:${m.id}`]?.due ?? today) <= today).length;
  const nextTheory = WORLDS.filter((w) => isUnlocked(s, w.id)).flatMap((w) => w.theory.map((t) => ({ w, t }))).find(({ t }) => !s.theoryRead[t.id]);
  const weak = weakestTopics(s, 2);
  const overdue = overdueCount(plan, today, s.tasksDone);
  const freezeLeft = canFreeze(s.streak.freezes, today);
  const hello = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-muted">{prettyDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1 className="text-3xl font-semibold">{hello}{s.settings.name ? `, ${s.settings.name}` : ''} 👋</h1>
          {phase && <p className="mt-1 text-muted"><Pill tone="accent">{phase.title}</Pill> <span className="ml-1">{phase.focus}</span></p>}
          {!phase && today < '2026-10-28' && <p className="mt-1 text-muted">The plan starts on 28 October.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {nextTheory && <Button onClick={() => navigate(`/week/${nextTheory.w.id}/learn`)}>▶ Continue: {nextTheory.t.title}</Button>}
          <LinkButton to="/cards" variant="soft">🃏 {due} cards due</LinkButton>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm font-semibold text-muted">Exam · Wed 9 Dec, 14:30</div>
          <div className="mt-3"><Countdown /></div>
          <div className="mt-2 text-xs text-muted">Open book (paper only) · 26 multiple choice · 90 min + 10 · own laptop with Safe Exam Browser</div>
        </Card>
        <Card className="flex flex-col items-center p-4">
          <div className="self-start text-sm font-semibold text-muted">Exam readiness</div>
          <Gauge value={rd.grade} label="Estimated grade" />
          <div className="text-center text-xs text-muted">Mastery avg {rd.masteryAvg} %{rd.mockAvg !== null ? ` · mocks Ø ${rd.mockAvg.toFixed(1)}` : ' · no mocks yet'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold text-muted">Level</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-xp font-display text-xl font-bold text-white">{lv.level}</span>
            <div><div className="font-display text-lg font-semibold">{lv.title}</div><div className="text-xs text-muted">{s.xp} XP total</div></div>
          </div>
          <Progress value={lv.progress} color="var(--xp)" className="mt-3" />
          <div className="mt-1 text-xs text-muted">{lv.span - lv.into} XP to level {lv.level + 1} · today +{s.dailyXp[today] ?? 0} XP</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold text-muted">Daily streak</div>
          <div className="mt-2 flex items-baseline gap-2"><span className="font-display text-4xl font-bold text-fire">🔥 {st.value}</span><span className="text-sm text-muted">best {s.streak.best}</span></div>
          <div className="mt-2 text-xs text-muted">
            {(s.dailyXp[today] ?? 0) >= 20 ? '✅ Today counts for your streak.' : `Earn ${20 - (s.dailyXp[today] ?? 0)} more XP today to extend it.`}
            <br />🧊 Streak freeze this week: {freezeLeft ? 'available' : 'used'}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Daily quests</h2>
          <div className="space-y-3">
            {quests.map((q) => {
              const v = Math.min(q.target, counters[q.counter] ?? 0);
              const claimed = !!s.questsClaimed[q.id];
              return (
                <button key={q.id} onClick={() => navigate(q.to)} className="block w-full rounded-xl border border-line p-3 text-left transition hover:bg-surface2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{q.icon} {q.title}</span>
                    {claimed ? <Pill tone="good">+30 XP ✓</Pill> : <span className="text-sm text-muted">{v}/{q.target}</span>}
                  </div>
                  <Progress value={v / q.target} className="mt-2" color={claimed ? 'var(--good)' : 'var(--accent)'} height={6} />
                </button>
              );
            })}
          </div>
        </Card>
        <Card className="p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today’s plan</h2>
            <div className="flex items-center gap-2">{overdue > 0 && <Pill tone="warn">{overdue} to catch up</Pill>}<LinkButton to="/plan" size="sm">Full plan</LinkButton></div>
          </div>
          {tasks.length ? <div className="space-y-1.5">{tasks.map((t) => <PlanTaskRow key={t.id + (t.catchUp ? 'c' : '')} task={t} />)}</div> : <p className="text-muted">Nothing scheduled — rest day or outside the plan. Tomorrow: {buildPlan(planSettings(s), s.plan).find((d) => d.date === addDays(today, 1))?.tasks[0]?.title ?? '—'}</p>}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold">Activity</h2>
          <Heatmap />
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Mastery</h2><LinkButton to="/progress" size="sm">Details</LinkButton></div>
          <MasteryRadar height={240} />
          <div className="mt-1 text-sm text-muted">Weakest: {weak.map((w) => `${w.label} (${w.total} %)`).join(' · ')}</div>
        </Card>
      </div>
    </div>
  );
}
