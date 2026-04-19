'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRealtimeChat } from '@/lib/hooks/useRealtimeChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Circle, Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  threadId: string;
  currentUserId: string;
  otherUserName: string;
  otherUserAvatar?: string | null;
}

export function RealtimeChatClient({ threadId, currentUserId, otherUserName, otherUserAvatar }: Props) {
  const {
    messages,
    loading,
    connected,
    otherUserOnline,
    otherUserTyping,
    sendMessage,
    sendTyping,
  } = useRealtimeChat(threadId, currentUserId);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTypingSentRef = useRef<number>(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, otherUserTyping]);

  function handleChange(v: string) {
    setInput(v);
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      sendTyping();
      lastTypingSentRef.current = now;
    }
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await sendMessage(input);
      setInput('');
    } catch (err: unknown) {
      const e = err as { error?: string; reason?: string };
      if (e?.error === 'flagged') {
        setSendError('Mensagem bloqueada pela moderação: ' + (e.reason || 'conteúdo inadequado'));
      } else {
        setSendError('Erro ao enviar. Tente novamente.');
      }
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <Link href="/app/threads" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {otherUserAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherUserAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {(otherUserName || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{otherUserName}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Circle
              className={`h-2 w-2 ${
                otherUserOnline ? 'fill-green-500 text-green-500' : 'fill-muted-foreground text-muted-foreground'
              }`}
            />
            {otherUserOnline ? 'online' : 'offline'}
          </p>
        </div>
        {!connected && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            reconectando
          </span>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Comece a conversa...
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  mine
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm bg-slate-100 dark:bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}
                >
                  {formatDistanceToNow(new Date(m.created_at), { locale: ptBR, addSuffix: true })}
                  {mine && m.read_at && ' · lida'}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 dark:bg-muted">
              <span className="inline-flex gap-1">
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-card p-3">
        {sendError && (
          <p className="mb-2 text-xs text-destructive">{sendError}</p>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            rows={1}
            className="min-h-[40px] max-h-32 resize-none"
            maxLength={2000}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            size="icon"
            className="shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
