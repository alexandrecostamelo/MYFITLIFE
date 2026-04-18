'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react';

type Quest = { id: string; title: string; description: string; xp_reward: number; completed: boolean };

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() { const res = await fetch('/api/quests/daily'); const d = await res.json(); setQuests(d.quests || []); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function complete(id: string) { setActing(id); await fetch(`/api/quests/${id}/complete`, { method: 'POST' }); await load(); setActing(null); }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/stats" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Quests do dia</h1>
      </header>

      {loading ? <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      : quests.length === 0 ? <Card className="p-6 text-center text-sm text-muted-foreground"><Sparkles className="mx-auto mb-2 h-6 w-6" />Gerando quests...</Card>
      : (
        <div className="space-y-3">
          {quests.map((q) => (
            <Card key={q.id} className={`p-4 ${q.completed ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    {q.completed && <Check className="h-4 w-4 text-green-600" />}
                    <div className={`text-sm font-medium ${q.completed ? 'line-through' : ''}`}>{q.title}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{q.description}</div>
                  <div className="mt-2 text-xs"><span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">+{q.xp_reward} XP</span></div>
                </div>
                {!q.completed && <Button size="sm" onClick={() => complete(q.id)} disabled={acting === q.id}>{acting === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Concluir'}</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-4 text-center text-xs text-muted-foreground">Novas quests aparecem todo dia.</p>
    </main>
  );
}
