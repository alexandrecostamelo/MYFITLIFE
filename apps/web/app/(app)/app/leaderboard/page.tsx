'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Trophy, Loader2, Flame } from 'lucide-react';

export default function LeaderboardPage() {
  const [scope, setScope] = useState<'global' | 'friends'>('global');
  const [period, setPeriod] = useState<'week' | 'month' | 'alltime'>('alltime');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?scope=${scope}&period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d.leaderboard || []); setLoading(false); });
  }, [scope, period]);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/stats" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Ranking</h1>
      </header>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setScope('global')}
          className={`rounded-md border px-3 py-1.5 text-sm ${scope === 'global' ? 'border-primary bg-primary/10' : 'border-input'}`}
        >
          Global
        </button>
        <button
          onClick={() => setScope('friends')}
          className={`rounded-md border px-3 py-1.5 text-sm ${scope === 'friends' ? 'border-primary bg-primary/10' : 'border-input'}`}
        >
          Entre amigos
        </button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <button onClick={() => setPeriod('week')} className={`rounded-md border px-3 py-1.5 text-xs ${period === 'week' ? 'border-primary bg-primary/10' : 'border-input'}`}>Semana</button>
        <button onClick={() => setPeriod('month')} className={`rounded-md border px-3 py-1.5 text-xs ${period === 'month' ? 'border-primary bg-primary/10' : 'border-input'}`}>Mês</button>
        <button onClick={() => setPeriod('alltime')} className={`rounded-md border px-3 py-1.5 text-xs ${period === 'alltime' ? 'border-primary bg-primary/10' : 'border-input'}`}>Sempre</button>
      </div>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : data.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {scope === 'friends' ? 'Você ainda não tem amigos. Adicione em /app/friends.' : 'Sem dados suficientes.'}
        </Card>
      ) : (
        <div className="space-y-2">
          {data.map((e: any) => (
            <Card key={e.user.id} className={`p-3 ${e.is_me ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold">
                  {e.rank <= 3 ? ['🥇','🥈','🥉'][e.rank - 1] : e.rank}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {e.user.full_name || e.user.username || 'Usuário'}
                      {e.is_me && ' (você)'}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> Nv {e.level}</span>
                    <span>· {e.xp.toLocaleString('pt-BR')} XP</span>
                    {e.current_streak > 0 && (
                      <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> {e.current_streak}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
