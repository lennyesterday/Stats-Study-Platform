import { useEffect, useRef, useState } from 'react';
import { WEEKS } from '.';
import { Rich } from '../components/Rich';
import { useRoute } from '../router';
import { DockButton, FloatWindow, isShortcut, load, save, type Box } from './FloatWindow';
import { errorText, listModels, PROVIDERS, stream, type Provider } from './askProviders';

// "Question" window: ask Claude, ChatGPT or Gemini about anything in the course, answers stream in.
// API keys are typed in by the student and stay in this browser's localStorage. Open with Q;
// text selected on the page when opening is quoted into the question.

const KEYS = 'sq-ask-keys', MODELS = 'sq-ask-models', PROVIDER = 'sq-ask-provider', CHAT = 'sq-ask-chat';

interface Turn { role: 'user' | 'assistant'; text: string; context?: string; by?: string }

/** keys per provider; the first version saved a single Claude key */
const loadKeys = (): Partial<Record<Provider, string>> => {
  const keys = load<Partial<Record<Provider, string>>>(KEYS, {}), old = load<string>('sq-ask-key', '');
  if (old && !keys.claude) { keys.claude = old; save(KEYS, keys); }
  localStorage.removeItem('sq-ask-key');
  return keys;
};

const strip = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

const outline = WEEKS.map((w) => `Week ${w.num}: ${strip(w.title)}\n${w.parts.map((p, pi) =>
  `  Part ${pi + 1} ${strip(p.title)}: ${p.concepts.map((c, ci) => `${pi + 1}.${ci + 1} ${strip(c.name)}`).join('; ')}`).join('\n')}`).join('\n');

// stable, so it is cached across questions
const SYSTEM = `You are the tutor inside Stats Quest, a study app for the university course "Statistical Analysis" (course 2966). The student asks when they don't understand something.

Course outline (the notation and order the student learns):
${outline}

The exam: open book on paper (printed or handwritten notes, formula sheet and printed tables allowed), 26 multiple-choice questions in 90 minutes, a calculator, no software. So the student does not need to memorise formulas. Help them understand what things mean, why they work, how the ideas connect, and how to pick the right method, read a table and interpret a result.

How to answer:
- Answer in the language of the question (often German or English).
- Explain intuitively first, then precisely. Use a small concrete example with numbers when it helps.
- Keep it short: a few short paragraphs. Go longer only when asked for a full worked solution.
- Use the course notation: x̄, s, σ, μ, SE, df, H₀, H₁, π, π₀, p, t, z, F, χ², SSB, SSW, MSB, MSW, b₀, b₁, r, R².
- Formatting: plain paragraphs, "- " bullet lists, **bold** for key terms, $...$ for inline math and $$...$$ for a displayed formula (LaTeX). No headings, tables or code blocks.
- If the question is outside the course, answer briefly and say how it relates (or not) to what they need for the exam.`;

/** where the student is right now, sent with each question (not shown in the chat) */
function pageContext(parts: string[]) {
  const [p0, p1, p2] = parts;
  if ((p0 === 'week' || p0 === 'world') && p1) {
    const w = WEEKS.find((x) => String(x.num) === p1);
    if (w) return `Week ${w.num} (${strip(w.title)}) · ${p2 ?? 'learn'} tab`;
  }
  return p0 ? `${p0} page` : 'home page';
}

const askBox = (): Box => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.min(460, vw - 32), h = Math.min(Math.round(vh * 0.78), vh - 32);
  return { x: Math.max(16, vw - w - 24), y: Math.max(16, vh - h - 80), w, h };
};

export function AskWindow() {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<Provider>(() => load<Provider>(PROVIDER, 'claude'));
  const [keys, setKeys] = useState(loadKeys);
  const [models, setModels] = useState(() => load<Partial<Record<Provider, string>>>(MODELS, {}));
  const [options, setOptions] = useState<Partial<Record<Provider, string[]>>>({});
  const [settings, setSettings] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [chat, setChat] = useState<Turn[]>(() => load<Turn[]>(CHAT, []));
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const { parts } = useRoute();
  const where = pageContext(parts);
  const info = PROVIDERS[provider], apiKey = keys[provider] ?? '', model = models[provider]?.trim() || info.model;

  /** open; quote the text selected on the page (outside this window) into the question */
  const openAsk = () => {
    const sel = window.getSelection(), text = sel?.toString().trim() ?? '';
    const inside = sel?.anchorNode && (sel.anchorNode.parentElement?.closest('.ask-win'));
    if (text && !inside) setDraft((d) => `${d ? `${d}\n\n` : ''}"${text.slice(0, 1500)}"\n\n`);
    setOpen(true);
    setTimeout(() => input.current?.focus());
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (isShortcut(e, 'q')) { e.preventDefault(); if (open) setOpen(false); else openAsk(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
  useEffect(() => { if (!busy) save(CHAT, chat); }, [chat, busy]);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [chat, open]);
  useEffect(() => () => abort.current?.abort(), []);
  // the model picker lists what the key can use
  useEffect(() => {
    if (!settings || !apiKey || options[provider]) return;
    let live = true;
    listModels(provider, apiKey).then((ids) => { if (live) setOptions((o) => ({ ...o, [provider]: ids })); });
    return () => { live = false; };
  }, [settings, provider, apiKey, options]);

  const pickProvider = (p: Provider) => { setProvider(p); save(PROVIDER, p); setError(''); setKeyDraft(''); };
  const setKey = (k: string) => {
    const next = { ...keys, [provider]: k || undefined };
    setKeys(next); save(KEYS, next); setKeyDraft(''); setError('');
    setOptions((o) => ({ ...o, [provider]: undefined }));
  };
  const setModel = (m: string) => { const next = { ...models, [provider]: m }; setModels(next); save(MODELS, next); };

  const send = async () => {
    const q = draft.trim();
    if (!q || busy || !apiKey) return;
    const history: Turn[] = [...chat, { role: 'user', text: q, context: where }];
    const by = `${info.name} · ${model}`;
    setChat([...history, { role: 'assistant', text: '', by }]);
    setDraft(''); setError(''); setBusy(true);
    const put = (text: string) => setChat((c) => [...c.slice(0, -1), { role: 'assistant', text, by }]);
    const ctl = new AbortController();
    abort.current = ctl;
    let text = '';
    try {
      const turns = history.map((t) => ({ role: t.role, text: t.role === 'user' && t.context ? `[I'm on: ${t.context}]\n\n${t.text}` : t.text }));
      const it = stream(provider, apiKey, model, SYSTEM, turns, ctl.signal);
      let r = await it.next();
      for (; !r.done; r = await it.next()) { text += r.value; put(text); }
      if (r.value === 'refused') put(text || `*${info.name} declined to answer this one. Try asking it differently.*`);
      else if (r.value === 'cut') put(`${text}\n\n*(The answer was cut off. Ask "continue" for the rest.)*`);
      else if (!text) put('*(empty answer)*');
    } catch (e) {
      if (ctl.signal.aborted) put(text ? `${text}\n\n*(stopped)*` : '*(stopped)*');
      else {
        setError(errorText(provider, model, e));
        // drop the empty answer, give the question back so it can be sent again
        if (!text) { setChat(history.slice(0, -1)); setDraft(q); } else put(text);
      }
    } finally {
      abort.current = null;
      setBusy(false);
    }
  };

  const showSettings = !apiKey || settings;
  return (
    <>
      <DockButton open={open} onClick={() => (open ? setOpen(false) : openAsk())} label="Question" kbd="Q"
        icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 4.5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H9l-3.5 3v-3H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" strokeLinejoin="round" /><path d="M8.3 7.6a1.8 1.8 0 1 1 2.5 1.7c-.5.2-.8.6-.8 1.1M10 12h.01" strokeLinecap="round" /></svg>} />
      {open && (
        <FloatWindow id="ask" title="Question" label="Question" defaultBox={askBox} minW={360} minH={380} onClose={() => { abort.current?.abort(); setOpen(false); }}
          head={<>
            <button type="button" className="btn ghost sm" aria-pressed={settings} onClick={() => setSettings((v) => !v)}>Settings</button>
            <button type="button" className="btn ghost sm" disabled={busy || !chat.length} onClick={() => { setChat([]); setError(''); }}>New chat</button>
          </>}>
          <div className="ask-win">
            <div className="dsub ask-pick">
              <div className="seg" role="group" aria-label="AI">
                {(Object.keys(PROVIDERS) as Provider[]).map((p) => (
                  <button key={p} type="button" aria-pressed={provider === p} disabled={busy} onClick={() => pickProvider(p)}>
                    {PROVIDERS[p].name}
                  </button>
                ))}
              </div>
              <span className="ask-model" title="Model">{model}</span>
            </div>
            {showSettings && (
              <div className="ask-key">
                {apiKey ? (
                  <div className="ask-keyrow"><span className="ask-saved">{info.name} key saved ({apiKey.slice(0, 6)}…{apiKey.slice(-4)})</span>
                    <button type="button" className="btn ghost sm" onClick={() => setKey('')}>Remove key</button></div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); if (keyDraft.trim()) setKey(keyDraft.trim()); }}>
                    <p>To ask {info.name}, paste your API key (from {info.keyUrl}). It is stored only in this browser and sent only to {info.name}'s API. Each question costs a little API credit.</p>
                    <div className="ask-keyrow">
                      <input type="password" autoComplete="off" spellCheck={false} placeholder={info.keyHint} value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} aria-label={`${info.name} API key`} />
                      <button className="btn sm" type="submit" disabled={!keyDraft.trim()}>Save</button>
                    </div>
                  </form>
                )}
                <label className="ask-keyrow">Model
                  <input type="text" list={`ask-models-${provider}`} spellCheck={false} placeholder={info.model} value={models[provider] ?? ''} onChange={(e) => setModel(e.target.value)} />
                  <datalist id={`ask-models-${provider}`}>{(options[provider] ?? []).map((m) => <option key={m} value={m} />)}</datalist>
                </label>
                <p className="ask-fine">Leave empty for the default ({info.model}). {apiKey ? (options[provider]?.length ? `${options[provider]!.length} models available for your key: click the field to pick one.` : 'Loading the models your key can use…') : ''}</p>
              </div>
            )}
            <div className="ask-log" ref={log} aria-live="polite">
              {!chat.length && !showSettings && (
                <div className="ask-empty">
                  <b>Stuck on something?</b>
                  <p>Ask in English or German, e.g. "Why do we divide by n − 1?" or "When do I use a t test instead of a z test?"</p>
                  <p>Tip: select a sentence on the page, then press <kbd>Q</kbd> to ask about it.</p>
                </div>
              )}
              {chat.map((t, i) => (
                <div key={i} className={`ask-msg ${t.role}`}>
                  {t.role === 'user'
                    ? <div className="ask-q">{t.text}</div>
                    : <>{t.by && <div className="ask-by">{t.by}</div>}{t.text ? <Rich text={t.text} symbols /> : <span className="ask-typing">Thinking…</span>}</>}
                </div>
              ))}
              {error && <div className="ask-err" role="alert">{error}</div>}
            </div>
            <form className="ask-in" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <textarea ref={input} rows={2} value={draft} disabled={!apiKey} placeholder={apiKey ? `Ask ${info.name} a question…` : `Add your ${info.name} API key first`}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } if (e.key === 'Escape') e.currentTarget.blur(); }}
                aria-label="Your question" />
              {busy
                ? <button className="btn ghost sm" type="button" onClick={() => abort.current?.abort()}>Stop</button>
                : <button className="btn sm" type="submit" disabled={!draft.trim() || !apiKey}>Ask</button>}
            </form>
            <div className="ask-ctx">Context sent: {where} · Enter to send, Shift+Enter for a new line</div>
          </div>
        </FloatWindow>
      )}
    </>
  );
}
