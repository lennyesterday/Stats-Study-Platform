import { useEffect, useRef, useState } from 'react';
import type { MathfieldElement } from 'mathlive';

// Visual math input (MathLive): fractions as a box over a box, roots, powers — like a school calculator.
// Loaded on first use; it reuses the KaTeX fonts the app already has.

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement> & { 'math-virtual-keyboard-policy'?: string };
    }
  }
}

let ready: Promise<void> | null = null;
const loadMathLive = () => ready ??= import('mathlive').then(({ MathfieldElement }) => {
  MathfieldElement.fontsDirectory = null;
  MathfieldElement.soundsDirectory = null;
});

export type { MathfieldElement };

/** `value` is LaTeX; `onChange` fires on every edit (typing or keypad). */
export function MathInput({ value, onChange, onKeyDown, fieldRef, label }: {
  value: string; onChange: (latex: string) => void; onKeyDown?: (e: KeyboardEvent, mf: MathfieldElement) => void;
  fieldRef?: React.RefObject<MathfieldElement | null>; label: string;
}) {
  const own = useRef<MathfieldElement>(null);
  const ref = fieldRef ?? own;
  const [loaded, setLoaded] = useState(false);
  const cb = useRef({ onChange, onKeyDown });
  useEffect(() => { cb.current = { onChange, onKeyDown }; });

  useEffect(() => { loadMathLive().then(() => setLoaded(true)); }, []);
  useEffect(() => {
    const mf = ref.current;
    if (!loaded || !mf) return;
    mf.smartFence = true;
    mf.popoverPolicy = 'off';
    mf.menuItems = [];
    mf.mathVirtualKeyboardPolicy = 'manual';
    // "*" → ×, and no automatic conversions that the calculator would not understand
    mf.inlineShortcuts = { ...mf.inlineShortcuts, '*': '\\times', sqrt: '\\sqrt{#?}', cbrt: '\\sqrt[3]{#?}', pi: '\\pi', Ans: '\\mathrm{Ans}' };
    const onInput = () => cb.current.onChange(mf.value);
    const onKey = (e: KeyboardEvent) => cb.current.onKeyDown?.(e, mf);
    mf.addEventListener('input', onInput);
    mf.addEventListener('keydown', onKey, { capture: true });
    mf.focus();
    return () => { mf.removeEventListener('input', onInput); mf.removeEventListener('keydown', onKey, { capture: true }); };
  }, [loaded, ref]);
  // outside changes (AC, history, "Use in calculator")
  useEffect(() => {
    const mf = ref.current;
    if (loaded && mf && mf.value !== value) mf.setValue(value, { silenceNotifications: true });
  }, [value, loaded, ref]);

  return <math-field ref={ref} aria-label={label} className="calc-mf" math-virtual-keyboard-policy="manual" />;
}
