'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, Send } from 'lucide-react';

export default function ThreadPage() {
  const params = useParams();
  const id = params.id as string;

  const [thread, setThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [other, setOther] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function load() {
    const res = await fetch(`/api/threads/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setThread(data.thread);
    setMessages(data.messages || []);
    setOther(data.i_am_client ? data.professional : data.client);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  useEffect(() => { loadUser(); load(); }, [id]);

  useEffect(() => {
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [id]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    const res = await fetch(`/api/threads/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      if (data.error === 'flagged') alert('Sua mensagem foi bloqueada pela moderação: ' + (data.reason || 'conteúdo inadequado'));
      return;
    }
    setText('');
    await load();
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col">
      <header className="flex items-center gap-2 border-b p-4">
        <Link href="/app/threads" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
          {other?.avatar_url ? (
            <img src={other.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500">
              {(other?.full_name || '?').charAt(0)}
            </div>
          )}
        </div>
        <div>
          <div className="text-sm font-medium">{other?.full_name || 'Usuário'}</div>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Comece a conversa...</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-primary text-white' : 'bg-slate-100'}`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <div className={`mt-1 text-right text-xs ${mine ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t p-4">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Digite sua mensagem..."
          maxLength={2000}
        />
        <Button onClick={send} disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </main>
  );
}
