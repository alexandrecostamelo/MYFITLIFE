'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Trophy, MapPin, Building2, Users, Globe, Flame } from 'lucide-react';

type RankingScope = 'global' | 'friends' | 'gym' | 'city' | 'state';
type RankingPeriod = 7 | 30 | 365;

const PERIOD_TO_LEADERBOARD: Record<number, string> = { 7: 'week', 30: 'month', 365: 'alltime' };

export default function RankingsPage() {
  const [scope, setScope] = useState<RankingScope>('global');
  const [period, setPeriod] = useState<RankingPeriod>(7);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let res: Response;
    if (scope === 'global' || scope === 'friends') {
      res = await fetch(`/api/leaderboard?scope=${scope}&period=${PERIOD_TO_LEADERBOARD[period]}`);
      const json = await res.json();
      // Normalise to same shape
      const ranking = (json.leaderboard || []).map((e: any) => ({
        user_id: e.user?.id,
        full_name: e.user?.full_name || e.user?.username,
        avatar_url: e.user?.avatar_url,
        xp_period: e.xp,
        workouts_period: e.workouts ?? 0,
        current_streak: e.current_streak,
        rank: e.rank,
        is_me: e.is_me,
      }));
      setData({ ranking, total: ranking.length });
    } else {
      const endpoints: Record<string, string> = {
        gym: `/api/rankings/gym?days=${period}`,
        city: `/api/rankings/city?days=${period}`,
        state: `/api/rankings/state?days=${period}`,
      };
      res = await fetch(endpoints[scope]);
      setData(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [scope, period]);

  const scopes: Array<{ key: RankingScope; label: string; Icon: any }> = [
    { key: 'global', label: 'Global', Icon: Globe },
    { key: 'friends', label: 'Amigos', Icon: Users },
    { key: 'gym', label: 'Academia', Icon: Building2 },
    { key: 'city', label: 'Cidade', Icon: MapPin },
    { key: 'state', label: 'Estado', Icon: MapPin },
  ];

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <Trophy className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Rankings</h1>
      </header>

      {/* Scope tabs */}
      <Card className="mb-3 p-2">
        <div className="grid grid-cols-5 gap-1">
          {scopes.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setScope(key)}
              className={`flex flex-col items-center gap-0.5 rounded-md border p-2 text-xs ${scope === key ? 'border-primary bg-primary/10' : 'border-input'}`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Period tabs */}
      <Card className="mb-4 p-2">
        <div className="grid grid-cols-3 gap-1">
          {([7, 30, 365] as RankingPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md border px-3 py-1 text-xs ${period === p ? 'border-primary bg-primary/10' : 'border-input'}`}
            >
              {p === 7 ? '7 dias' : p === 30 ? '30 dias' : 'Ano'}
            </button>
          ))}
        </div>
      </Card>

      {/* Context badges */}
      {scope === 'gym' && data?.gym && (
        <Card className="mb-3 bg-muted p-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{data.gym.name}{data.gym.city ? ` · ${data.gym.city}` : ''}</span>
          </div>
        </Card>
      )}
      {scope === 'city' && data?.city && (
        <Card className="mb-3 bg-muted p-3 text-xs">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-muted-foreground" />{data.city}, {data.state}</span>
        </Card>
      )}
      {scope === 'state' && data?.state && (
        <Card className="mb-3 bg-muted p-3 text-xs">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-muted-foreground" />Estado: {data.state}</span>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : data?.reason === 'no_gym' ? (
        <Card className="p-6 text-center">
          <Building2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="mb-3 text-sm text-muted-foreground">Faça check-in em uma academia para ver este ranking.</p>
          <Button asChild variant="outline"><Link href="/app/explore">Buscar academias</Link></Button>
        </Card>
      ) : data?.reason === 'no_city' || data?.reason === 'no_state' ? (
        <Card className="p-6 text-center">
          <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="mb-3 text-sm text-muted-foreground">Defina sua cidade e estado no perfil para ver este ranking.</p>
          <Button asChild variant="outline"><Link href="/app/settings/ranking-privacy">Completar localização</Link></Button>
        </Card>
      ) : !data?.ranking?.length ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma entrada no período.</Card>
      ) : (
        <>
          {data.my_entry && data.my_entry.rank > 10 && (
            <Card className="mb-3 border-primary/40 bg-primary/5 p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">#{data.my_entry.rank}</span>
                <span className="flex-1 text-sm font-medium">Você</span>
                <span className="text-sm">{data.my_entry.xp_period?.toLocaleString('pt-BR')} XP</span>
              </div>
            </Card>
          )}

          <Card className="p-2">
            <div className="space-y-0.5">
              {data.ranking.map((r: any) => (
                <div
                  key={r.user_id}
                  className={`flex items-center gap-2 rounded px-2 py-2 ${r.is_me ? 'bg-primary/10' : r.rank <= 3 ? 'bg-amber-50 dark:bg-amber-950' : ''}`}
                >
                  <span className="w-8 text-sm font-bold">
                    {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
                  </span>
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                    {r.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        {(r.full_name || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {r.full_name || 'Usuário'}
                      {r.is_me && <span className="ml-1 text-xs text-primary">(você)</span>}
                    </div>
                    {scope === 'state' && r.city && (
                      <div className="text-xs text-muted-foreground">{r.city}</div>
                    )}
                    {scope === 'gym' && r.checkins_period > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {r.checkins_period} check-in{r.checkins_period > 1 ? 's' : ''}
                      </div>
                    )}
                    {(scope === 'global' || scope === 'friends') && r.current_streak > 0 && (
                      <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Flame className="h-3 w-3 text-orange-500" />{r.current_streak}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{r.xp_period?.toLocaleString('pt-BR')} XP</div>
                    {r.workouts_period > 0 && (
                      <div className="text-xs text-muted-foreground">{r.workouts_period} treinos</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {data.total > 30 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">Mostrando top 30 de {data.total}</p>
          )}
        </>
      )}

      <Card className="mt-4 p-3 text-xs text-muted-foreground">
        <Link href="/app/settings/ranking-privacy" className="text-primary hover:underline">
          Gerenciar privacidade nos rankings →
        </Link>
      </Card>
    </main>
  );
}
