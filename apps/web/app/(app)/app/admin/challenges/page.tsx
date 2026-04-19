'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { statusLabel } from '@myfitlife/core/challenges';
import { ArrowLeft, Shield, Loader2, Star } from 'lucide-react';

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/admin/challenges');
    if (!res.ok) { setLoading(false); return; }
    setChallenges((await res.json()).challenges || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleFeatured(id: string, current: boolean) {
    await fetch(`/api/admin/challenges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !current }),
    });
    await load();
  }

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/admin/challenges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/gym-admin" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Desafios da comunidade</h1>
      </header>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : challenges.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Sem acesso ou sem desafios.</Card>
      ) : (
        <div className="space-y-2">
          {challenges.map((c) => (
            <Card key={c.id} className="p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.cover_emoji}</span>
                  <div>
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.slug} · {c.duration_days}d · {c.start_date} → {c.end_date}
                    </div>
                  </div>
                </div>
                <button onClick={() => toggleFeatured(c.id, c.featured)}>
                  <Star className={`h-5 w-5 ${c.featured ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {(['draft', 'enrollment', 'active', 'completed', 'cancelled'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(c.id, s)}
                    disabled={c.status === s}
                    className={`rounded border px-2 py-0.5 text-xs ${
                      c.status === s
                        ? 'border-primary bg-primary text-white'
                        : 'border-input hover:bg-muted'
                    }`}
                  >
                    {statusLabel(s)}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Criar novo desafio: use a API <code>POST /api/admin/challenges</code> diretamente.
      </p>
    </main>
  );
}
