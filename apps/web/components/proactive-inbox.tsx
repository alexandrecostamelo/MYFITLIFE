'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X, Info, AlertTriangle, Lightbulb } from 'lucide-react';

type ProactiveMessage = {
  id: string;
  title: string;
  content: string;
  severity: 'info' | 'suggestion' | 'warning';
  action_label: string | null;
  action_url: string | null;
  read_at: string | null;
};

const SEVERITY_ICON = {
  info: Info,
  suggestion: Lightbulb,
  warning: AlertTriangle,
};

const SEVERITY_CLASS = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  suggestion: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

export function ProactiveInbox() {
  const [messages, setMessages] = useState<ProactiveMessage[]>([]);

  useEffect(() => {
    fetch('/api/coach/proactive')
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => {});
  }, []);

  async function dismiss(id: string) {
    setMessages((p) => p.filter((m) => m.id !== id));
    await fetch(`/api/coach/proactive/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismiss' }),
    }).catch(() => {});
  }

  async function markRead(id: string) {
    await fetch(`/api/coach/proactive/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read' }),
    }).catch(() => {});
  }

  if (messages.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Bell className="h-4 w-4" />
        Mensagens do Coach
      </div>
      {messages.map((msg) => {
        const Icon = SEVERITY_ICON[msg.severity];
        return (
          <Card key={msg.id} className={`flex items-start gap-3 border px-4 py-3 ${SEVERITY_CLASS[msg.severity]}`}
            onClick={() => { if (!msg.read_at) markRead(msg.id); }}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{msg.title}</p>
              <p className="mt-0.5 text-xs opacity-80">{msg.content}</p>
              {msg.action_label && msg.action_url && (
                <a href={msg.action_url} className="mt-1 inline-block text-xs font-medium underline">
                  {msg.action_label}
                </a>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); dismiss(msg.id); }}>
              <X className="h-3 w-3" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
