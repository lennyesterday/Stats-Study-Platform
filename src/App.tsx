import { lazy, Suspense } from 'react';
import { Celebrations } from './components/Celebrations';
import { Layout } from './components/Layout';
import { Empty } from './components/ui';
import Dashboard from './pages/Dashboard';
import { useRoute } from './router';

const WorldMap = lazy(() => import('./pages/WorldMap'));
const WorldPage = lazy(() => import('./pages/WorldPage'));
const Plan = lazy(() => import('./pages/Plan'));
const Cards = lazy(() => import('./pages/Cards'));
const Practice = lazy(() => import('./pages/Practice'));
const Tables = lazy(() => import('./pages/Tables'));
const Mocks = lazy(() => import('./pages/Mocks'));
const Lab = lazy(() => import('./pages/Lab'));
const Formulas = lazy(() => import('./pages/Formulas'));
const Methods = lazy(() => import('./pages/Methods'));
const Progress = lazy(() => import('./pages/Progress'));
const Settings = lazy(() => import('./pages/Settings'));
const Dataset = lazy(() => import('./pages/Dataset'));

function Page() {
  const { parts, query } = useRoute();
  const [p0, p1, p2] = parts;
  switch (p0) {
    case undefined: return <Dashboard />;
    case 'weeks': case 'map': return <WorldMap />;
    case 'week': case 'world': return <WorldPage id={Number(p1)} tab={p2} />;
    case 'dataset': return <Dataset />;
    case 'plan': return <Plan />;
    case 'cards': return <Cards deck={query.deck} />;
    case 'practice': return <Practice />;
    case 'tables': return <Tables mode={p1} />;
    case 'mocks': return <Mocks sub={p1} />;
    case 'lab': return <Lab viz={p1} />;
    case 'formulas': return <Formulas />;
    case 'methods': return <Methods />;
    case 'progress': return <Progress />;
    case 'settings': return <Settings />;
    default: return <Empty>Page not found. <a className="underline underline-offset-2" href="#/">Back to Today</a></Empty>;
  }
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="p-10 text-muted">Loading…</div>}>
        <Page />
      </Suspense>
      <Celebrations />
    </Layout>
  );
}
