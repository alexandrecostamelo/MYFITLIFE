'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';

type Achievement = { id: string; slug: string; title: string; description: string; icon: string; category: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'; xp_reward: number; unlocked: boolean; unlocked_at: string | null };

const RARITY_COLORS: Record<string, string> = { common: 'border-slate-300 bg-slate-50', rare: 'border-blue-300 bg-blue-50', epic: 'border-purple-300 bg-purple-50', legendary: 'border-amber-400 bg-amber-50' };
const RARITY_LABELS: Record<string, string> = { common: 'Comum', rare: 'Rara', epic: 'Épica', legendary: 'Lendária' };
const RARITY_BADGE_BG: Record<string, string> = { legendary: '#fbbf24', epic: '#a78bfa', rare: '#60a5fa', common: '#cbd5e1' };
const CAT_LABELS: Record<string, string> = { workout: 'Treino', nutrition: 'Nutrição', consistency: 'Consistência', milestone: 'Marco', special: 'Especial' };

export default function AchievementsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => { fetch('/api/me/achievements').then((r) => r.json()).then((d) => { setData(d); setLoading(false); }); }, []);

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data) return <div className="p-6">Erro.</div>;

  const filtered = (data.achievements as Achievement[]).filter((a) => filter === 'unlocked' ? a.unlocked : filter === 'locked' ? !a.unlocked : true);
  const byCategory: Record<string, Achievement[]> = {};
  filtered.forEach((a) => { if (!byCategory[a.category]) byCategory[a.category] = []; byCategory[a.category].push(a); });

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/stats" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Conquistas</h1>
      </header>

      <Card className="mb-4 p-4">
        <div className="flex items-baseline justify-between">
          <div><div className="text-3xl font-bold">{data.unlocked_count}</div><div className="text-xs text-muted-foreground">de {data.total} desbloqueadas</div></div>
          <div className="text-right text-xs text-muted-foreground">{Math.round((data.unlocked_count / data.total) * 100)}%</div>
        </div>
      </Card>

      <div className="mb-4 flex gap-2">
        {(['all', 'unlocked', 'locked'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`flex-1 rounded-md border px-3 py-1.5 text-xs ${filter === f ? 'border-primary bg-primary/10 text-primary' : 'border-input'}`}>
            {f === 'all' ? 'Todas' : f === 'unlocked' ? 'Desbloqueadas' : 'Bloqueadas'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat}>
            <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">{CAT_LABELS[cat] || cat}</h3>
            <div className="space-y-2">
              {items.map((a) => (
                <Card key={a.id} className={`border-2 p-3 ${a.unlocked ? RARITY_COLORS[a.rarity] : 'bg-slate-50 opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{a.unlocked ? a.icon : <Lock className="mt-1 h-6 w-6 text-slate-400" />}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div><div className="text-sm font-medium">{a.title}</div><div className="text-xs text-muted-foreground">{a.description}</div></div>
                        <div className="text-right">
                          <div className="rounded px-1.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: RARITY_BADGE_BG[a.rarity] }}>{RARITY_LABELS[a.rarity]}</div>
                          <div className="mt-1 text-xs text-muted-foreground">+{a.xp_reward} XP</div>
                        </div>
                      </div>
                      {a.unlocked && a.unlocked_at && <div className="mt-1 text-xs text-muted-foreground">Desbloqueada em {new Date(a.unlocked_at).toLocaleDateString('pt-BR')}</div>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
