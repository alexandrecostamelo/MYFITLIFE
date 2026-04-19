'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string; streaming?: boolean };

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((p) => [...p, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    setMessages((p) => [...p, { role: 'assistant', content: '', streaming: true }]);

    try {
      const res = await fetch('/api/coach/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error('stream_error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const { text: chunk } = JSON.parse(payload);
            if (chunk) {
              setMessages((p) => {
                const next = [...p];
                const last = next[next.length - 1];
                if (last?.streaming) {
                  next[next.length - 1] = { ...last, content: last.content + chunk };
                }
                return next;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }

      setMessages((p) => {
        const next = [...p];
        const last = next[next.length - 1];
        if (last?.streaming) next[next.length - 1] = { ...last, streaming: false };
        return next;
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((p) => {
          const next = [...p];
          const last = next[next.length - 1];
          if (last?.streaming) {
            next[next.length - 1] = { role: 'assistant', content: 'Tive um problema. Pode repetir?', streaming: false };
          }
          return next;
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col">
      <header className="border-b bg-white px-4 py-3">
        <h1 className="text-lg font-semibold">Coach</h1>
        <p className="text-xs text-muted-foreground">Tire qualquer dúvida sobre treino, nutrição ou rotina.</p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.length === 0 && (
            <Card className="bg-white px-4 py-3 text-sm text-muted-foreground">
              Oi! Pode me perguntar sobre treino, alimentação, como ajustar sua rotina ou tirar qualquer dúvida fitness.
            </Card>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <Card className={`max-w-[85%] whitespace-pre-wrap px-4 py-3 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white'}`}>
                {m.content}
                {m.streaming && <span className="inline-block w-2 animate-pulse">▋</span>}
              </Card>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.content === '' && messages[messages.length - 1]?.streaming && (
            <div className="flex justify-start">
              <Card className="bg-white px-4 py-3"><Loader2 className="h-4 w-4 animate-spin" /></Card>
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Pergunte alguma coisa..."
            disabled={loading}
          />
          <Button onClick={send} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
