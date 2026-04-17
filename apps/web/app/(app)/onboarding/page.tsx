'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

const FIRST_MESSAGE: Message = {
  role: 'assistant',
  content: 'Oi! Sou o coach do MyFitLife. Antes de montar seu plano, preciso te conhecer um pouco. Como posso te chamar?',
};

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([FIRST_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }

      if (data.profile?.complete && data.profile.profile) {
        setSaving(true);
        const completeRes = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.profile.profile),
        });
        if (completeRes.ok) {
          router.push('/app');
        } else {
          setSaving(false);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'Tive um problema ao salvar. Pode tentar novamente?',
            },
          ]);
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Tive um problema aqui, pode repetir?' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b bg-white px-4 py-3">
        <h1 className="text-lg font-semibold">Vamos te conhecer</h1>
        <p className="text-sm text-muted-foreground">Leva uns 3 minutos</p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <Card
                className={`max-w-[85%] whitespace-pre-wrap px-4 py-3 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white'
                }`}
              >
                {m.content}
              </Card>
            </div>
          ))}
          {(loading || saving) && (
            <div className="flex justify-start">
              <Card className="bg-white px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-white px-4 py-3">
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
            placeholder="Digite sua resposta..."
            disabled={loading || saving}
          />
          <Button onClick={send} disabled={loading || saving || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
