'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  MessageCircleQuestion,
  X,
  Send,
  Loader2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const ROUTE_CONTEXT: Record<string, string> = {
  '/app': 'Dashboard principal — resumo diário, XP, streaks, progresso',
  '/app/workout': 'Treinos — geração IA, histórico, plano semanal',
  '/app/nutrition': 'Nutrição — refeições, plano alimentar, macros',
  '/app/checkin': 'Check-in diário — humor, dor, energia, peso',
  '/app/coach': 'Coach IA — chat inteligente para dúvidas de fitness',
  '/app/profile': 'Perfil — dados pessoais, metas, preferências',
  '/app/social': 'Social — feed, amigos, desafios, grupos',
  '/app/challenges': 'Desafios — competições e metas comunitárias',
  '/app/progress': 'Progresso — fotos, medidas, gráficos de evolução',
  '/app/settings': 'Configurações — conta, assinatura, notificações',
  '/app/explore': 'Explorar — academias, profissionais, conteúdo',
};

function getRouteContext(pathname: string): string {
  for (const [route, ctx] of Object.entries(ROUTE_CONTEXT)) {
    if (pathname === route || pathname.startsWith(route + '/')) return ctx;
  }
  return 'Navegação geral do MyFitLife';
}

export function HelpAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/help/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: getRouteContext(pathname),
          history: messages.slice(-6),
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || 'Desculpe, não consegui responder. Tente novamente.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erro de conexão. Verifique sua internet e tente novamente.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput('');
  };

  const suggestions = [
    'Como funciona o treino IA?',
    'Como registro minhas refeições?',
    'O que é o check-in diário?',
    'Como ganho XP e conquistas?',
  ];

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-24 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 sm:bottom-6 ${
          open
            ? 'bg-white/10 text-white/60 hover:bg-white/15'
            : 'bg-gradient-to-br from-accent to-emerald-600 text-white shadow-accent/30 hover:shadow-accent/50 hover:scale-105'
        }`}
        aria-label={open ? 'Fechar ajuda' : 'Abrir ajuda'}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircleQuestion className="h-5 w-5" />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-40 right-4 z-50 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c14]/95 shadow-2xl backdrop-blur-xl sm:bottom-20">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-gradient-to-r from-accent/10 to-emerald-600/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-emerald-600">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Assistente</p>
                <p className="text-[10px] text-white/30">Ajuda inteligente</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={resetChat}
                className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
                title="Recomeçar conversa"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-center text-xs text-white/30">
                  Olá! Posso ajudar com qualquer dúvida sobre o MyFitLife.
                </p>
                <div className="space-y-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setInput(s);
                        inputRef.current?.focus();
                      }}
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left text-xs text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/70"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-accent to-emerald-600 text-white'
                        : 'bg-white/[0.06] text-white/80'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-white/[0.06] px-3.5 py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  <span className="text-xs text-white/40">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Pergunte algo..."
                className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-accent/30 focus:outline-none"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-emerald-600 text-white transition-all hover:shadow-lg hover:shadow-accent/25 disabled:opacity-30 disabled:hover:shadow-none"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
