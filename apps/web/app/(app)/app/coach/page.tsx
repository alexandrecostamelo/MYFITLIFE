'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { CoachAvatar } from '@/components/ui/coach-avatar';
import { getPersona } from '@/lib/ai/personas';

type Message = { role: 'user' | 'assistant'; content: string; streaming?: boolean };

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [personaId, setPersonaId] = useState('leo');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch('/api/profile/coach-persona')
      .then((r) => r.json())
      .then((d) => { if (d.persona) setPersonaId(d.persona); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const persona = getPersona(personaId);

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
            next[next.length - 1] = {
              role: 'assistant',
              content: 'Tive um problema. Pode repetir?',
              streaming: false,
            };
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
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <CoachAvatar persona={personaId as 'leo' | 'sofia' | 'rafa'} size="md" showName />
          <p className="text-xs text-muted-foreground">{persona.tagline}</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.length === 0 && (
            <div className="glass-card px-4 py-3 text-sm text-muted-foreground">
              Oi! Sou {persona.name}. Pode me perguntar sobre treino, alimentação,
              como ajustar sua rotina ou tirar qualquer dúvida fitness.
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                  m.role === 'user'
                    ? 'bg-accent text-accent-foreground'
                    : 'glass-card'
                }`}
              >
                {m.content}
                {m.streaming && (
                  <span className="inline-block w-2 animate-pulse">|</span>
                )}
              </div>
            </div>
          ))}
          {loading &&
            messages[messages.length - 1]?.content === '' &&
            messages[messages.length - 1]?.streaming && (
              <div className="flex justify-start">
                <div className="glass-card px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
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
