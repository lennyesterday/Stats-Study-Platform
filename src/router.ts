// Minimal hash router: '#/week/1/learn?x=y' → { parts: ['week','1','learn'], query }.
import { useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

const get = () => window.location.hash.replace(/^#/, '') || '/';

export function useRoute() {
  const raw = useSyncExternalStore(subscribe, get);
  const [path, qs = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(qs));
  return { path, parts, query, raw };
}

export function navigate(to: string) {
  if (get() === to) return;
  window.location.hash = to;
  window.scrollTo({ top: 0 });
}
