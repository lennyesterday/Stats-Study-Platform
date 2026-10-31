// The three chat providers of the Question window. Each SDK is loaded on first use.
// stream() yields text pieces and returns a note when the answer did not end normally.

export type Provider = 'claude' | 'openai' | 'gemini';
export interface ChatTurn { role: 'user' | 'assistant'; text: string }

export const PROVIDERS: Record<Provider, { name: string; model: string; keyHint: string; keyUrl: string }> = {
  claude: { name: 'Claude', model: 'claude-opus-5-5', keyHint: 'sk-ant-…', keyUrl: 'platform.claude.com → API keys' },
  openai: { name: 'ChatGPT', model: 'gpt-6.1-sol', keyHint: 'sk-…', keyUrl: 'platform.openai.com → API keys' },
  gemini: { name: 'Gemini', model: 'gemini-flash-latest', keyHint: 'AIza…', keyUrl: 'aistudio.google.com → Get API key' },
};

export type Ending = 'refused' | 'cut' | undefined;

export async function* stream(p: Provider, key: string, model: string, system: string, turns: ChatTurn[], signal: AbortSignal): AsyncGenerator<string, Ending> {
  if (p === 'claude') {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
    const s = client.beta.messages.stream({
      model,
      max_tokens: 16000,
      ...(model === PROVIDERS.claude.model && { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const, output_config: { effort: 'medium' as const } }),
      cache_control: { type: 'ephemeral' },
      system,
      messages: turns.map((t) => ({ role: t.role, content: t.text })),
    }, { signal });
    for await (const ev of s) if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') yield ev.delta.text;
    const end = (await s.finalMessage()).stop_reason;
    return end === 'refusal' ? 'refused' : end === 'max_tokens' ? 'cut' : undefined;
  }
  if (p === 'openai') {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
    const s = await client.chat.completions.create({
      model,
      max_completion_tokens: 16000,
      stream: true,
      messages: [{ role: 'developer', content: system }, ...turns.map((t) => ({ role: t.role, content: t.text }))],
    }, { signal });
    let end: string | null | undefined;
    for await (const chunk of s) {
      const c = chunk.choices[0];
      if (c?.delta?.content) yield c.delta.content;
      if (c?.finish_reason) end = c.finish_reason;
    }
    return end === 'content_filter' ? 'refused' : end === 'length' ? 'cut' : undefined;
  }
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: key });
  const s = await ai.models.generateContentStream({
    model,
    contents: turns.map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.text }] })),
    config: { systemInstruction: system, abortSignal: signal },
  });
  let end: string | undefined;
  for await (const chunk of s) {
    if (chunk.text) yield chunk.text;
    end = chunk.candidates?.[0]?.finishReason ?? end;
  }
  return end === 'SAFETY' || end === 'PROHIBITED_CONTENT' ? 'refused' : end === 'MAX_TOKENS' ? 'cut' : undefined;
}

/** chat models the key can use, for the model picker (empty if the list can't be loaded) */
export async function listModels(p: Provider, key: string): Promise<string[]> {
  const ids: string[] = [];
  try {
    if (p === 'claude') {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      for await (const m of new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true }).models.list()) ids.push(m.id);
    } else if (p === 'openai') {
      const { default: OpenAI } = await import('openai');
      for await (const m of new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true }).models.list()) {
        if (/^(gpt|o\d|chatgpt)/.test(m.id) && !/audio|realtime|tts|image|transcribe|search|embed/.test(m.id)) ids.push(m.id);
      }
      ids.sort().reverse();
    } else {
      const { GoogleGenAI } = await import('@google/genai');
      for await (const m of await new GoogleGenAI({ apiKey: key }).models.list()) {
        const id = m.name?.replace(/^models\//, '');
        if (id?.startsWith('gemini') && m.supportedActions?.includes('generateContent') && !/image|tts|audio|embed/.test(id)) ids.push(id);
      }
    }
  } catch { /* offline or wrong key: the error shows when a question is sent */ }
  return ids;
}

/** a readable message for any provider's error */
export function errorText(p: Provider, model: string, e: unknown): string {
  const status = (e as { status?: number })?.status;
  const name = PROVIDERS[p].name;
  if (status === 401 || status === 403) return `${name} did not accept the API key (or it may not use ${model}). Check it under Settings.`;
  if (status === 404) return `${name} has no model "${model}" for this key. Pick another model under Settings.`;
  if (status === 429) return `${name}: too many requests or no credit left. Wait a moment, or check the account's billing.`;
  if (status) return `${name} answered with an error (${status}): ${(e as Error).message}`;
  if (e instanceof TypeError) return `No connection to ${name}. Are you online?`;
  return e instanceof Error ? e.message : String(e);
}
