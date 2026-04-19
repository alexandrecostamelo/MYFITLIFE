'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Trophy, Dumbbell, Zap, Flame, Scale, Lock } from 'lucide-react';

export default function CompareFriendPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'stats' | 'skills' | 'photos'>('stats');

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/friends/${id}/compare?days=${days}`);
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || 'Erro');
      setLoading(false);
      return;
    }
    setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [days, id]);

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (error === 'not_friends') {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <Card className="p-6 text-center">
          <Lock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm">Você precisa ser amigo dessa pessoa para comparar.</p>
        </Card>
      </main>
    );
  }

  if (!data) return <div className="p-6">Dados não disponíveis.</div>;

  const me = data.me;
  const fr = data.friend;
  const friendFirstName = fr.full_name?.split(' ')[0] || 'Amigo';

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/friends" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">VS {friendFirstName}</h1>
      </header>

      {/* Avatares VS */}
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-center">
            <AvatarCircle user={me} />
            <div className="mt-2 text-sm font-semibold">Você</div>
            <div className="text-xs text-muted-foreground">Nv {me.stats?.level || 1}</div>
          </div>
          <div className="text-3xl font-black text-muted-foreground">VS</div>
          <div className="text-center">
            <AvatarCircle user={fr} />
            <div className="mt-2 text-sm font-semibold">{friendFirstName}</div>
            {fr.stats?.level && <div className="text-xs text-muted-foreground">Nv {fr.stats.level}</div>}
          </div>
        </div>
      </Card>

      {/* Seletor de período */}
      <Card className="mb-3 p-1">
        <div className="grid grid-cols-3 gap-1">
          {[7, 30, 365].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${days === d ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {d === 7 ? '7 dias' : d === 30 ? '30 dias' : '1 ano'}
            </button>
          ))}
        </div>
      </Card>

      {/* Abas */}
      <Card className="mb-4 p-1">
        <div className="grid grid-cols-3 gap-1">
          {(['stats', 'skills', 'photos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {t === 'stats' ? 'Estatísticas' : t === 'skills' ? 'Habilidades' : 'Fotos'}
            </button>
          ))}
        </div>
      </Card>

      {tab === 'stats' && <StatsComparison me={me} friend={fr} />}
      {tab === 'skills' && <SkillsComparison me={me} friend={fr} nodes={data.skill_nodes} />}
      {tab === 'photos' && <PhotosComparison friendId={id} />}

      <div className="mt-6 text-center">
        <Link href="/app/settings/comparison-privacy" className="text-xs text-muted-foreground underline underline-offset-2">
          Gerenciar o que você compartilha
        </Link>
      </div>
    </main>
  );
}

function AvatarCircle({ user }: { user: any }) {
  return (
    <div className="mx-auto h-16 w-16 overflow-hidden rounded-full bg-muted">
      {user?.avatar_url ? (
        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground">
          {(user?.full_name || '?').charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function StatsComparison({ me, friend }: any) {
  const hasFriendStats = friend?.stats && Object.keys(friend.stats).length > 0;
  const hasFriendWorkouts = friend?.workouts && Object.keys(friend.workouts).length > 0;
  const hasFriendWeight = friend?.weight != null;

  return (
    <div className="space-y-2">
      {hasFriendStats ? (
        <>
          <CompareRow icon={Trophy} label="Nível" mine={me.stats?.level || 1} theirs={friend.stats?.level || 1} />
          <CompareRow icon={Zap} label="XP total" mine={me.stats?.total_xp || 0} theirs={friend.stats?.total_xp || 0} unit="XP" />
          <CompareRow icon={Flame} label="Streak atual" mine={me.stats?.current_streak || 0} theirs={friend.stats?.current_streak || 0} unit="dias" />
          <CompareRow icon={Flame} label="Recorde de streak" mine={me.stats?.longest_streak || 0} theirs={friend.stats?.longest_streak || 0} unit="dias" />
        </>
      ) : (
        <LockedRow label="Estatísticas não compartilhadas pelo amigo" />
      )}

      {hasFriendWorkouts ? (
        <>
          <CompareRow icon={Dumbbell} label="Treinos no período" mine={me.workouts?.count || 0} theirs={friend.workouts?.count || 0} />
          <CompareRow icon={Dumbbell} label="Minutos totais" mine={me.workouts?.total_minutes || 0} theirs={friend.workouts?.total_minutes || 0} unit="min" />
        </>
      ) : (
        <LockedRow label="Treinos não compartilhados pelo amigo" />
      )}

      {hasFriendWeight && me.weight && (
        <CompareRow icon={Scale} label="Peso atual" mine={Number(me.weight?.current || 0)} theirs={Number(friend.weight?.current || 0)} unit="kg" lowerWins />
      )}
    </div>
  );
}

function CompareRow({ icon: Icon, label, mine, theirs, unit, lowerWins }: {
  icon: any; label: string; mine: number; theirs: number; unit?: string; lowerWins?: boolean;
}) {
  const myNum = Number(mine);
  const theirNum = Number(theirs);
  const iWin = lowerWins ? myNum < theirNum : myNum > theirNum;
  const tie = myNum === theirNum;

  return (
    <Card className="p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-2">
        <div className={`text-center ${iWin && !tie ? 'text-green-600' : ''}`}>
          <div className={`text-2xl font-bold ${iWin && !tie ? '' : ''}`}>{myNum.toLocaleString('pt-BR')}</div>
          {unit && <div className="text-xs text-muted-foreground">{unit}</div>}
        </div>
        <div className="text-center text-sm text-muted-foreground font-medium">
          {tie ? '=' : iWin ? '>' : '<'}
        </div>
        <div className={`text-center ${!iWin && !tie ? 'text-green-600' : ''}`}>
          <div className={`text-2xl font-bold`}>{theirNum.toLocaleString('pt-BR')}</div>
          {unit && <div className="text-xs text-muted-foreground">{unit}</div>}
        </div>
      </div>
    </Card>
  );
}

function LockedRow({ label }: { label: string }) {
  return (
    <Card className="p-3 text-center">
      <Lock className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

function SkillsComparison({ me, friend, nodes }: any) {
  if (!friend.skills || friend.skills.mastered === undefined) {
    return <LockedRow label="Árvore de habilidades não compartilhada pelo amigo" />;
  }

  const myKeys = new Set<string>(me.skills?.mastered_keys || []);
  const friendKeys = new Set<string>(friend.skills?.mastered_keys || []);
  const allKeys = new Set([...Array.from(myKeys), ...Array.from(friendKeys)]);
  const masteredNodes = (nodes || []).filter((n: any) => allKeys.has(n.key));

  const myTotal = me.skills?.mastered || 0;
  const friendTotal = friend.skills?.mastered || 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Card className={`p-4 text-center ${myTotal > friendTotal ? 'ring-2 ring-green-500' : ''}`}>
          <div className="text-3xl font-bold">{myTotal}</div>
          <div className="text-xs text-muted-foreground">dominadas</div>
        </Card>
        <div className="text-sm font-bold text-muted-foreground">VS</div>
        <Card className={`p-4 text-center ${friendTotal > myTotal ? 'ring-2 ring-green-500' : ''}`}>
          <div className="text-3xl font-bold">{friendTotal}</div>
          <div className="text-xs text-muted-foreground">dominadas</div>
        </Card>
      </div>

      {masteredNodes.length > 0 && (
        <div>
          <div className="mb-2 grid grid-cols-[32px_1fr_36px_36px] gap-2 px-2 text-xs text-muted-foreground">
            <div />
            <div>Habilidade</div>
            <div className="text-center">Eu</div>
            <div className="text-center">Amigo</div>
          </div>
          <div className="space-y-1">
            {masteredNodes.map((n: any) => {
              const iHave = myKeys.has(n.key);
              const theyHave = friendKeys.has(n.key);
              return (
                <div key={n.key} className="grid grid-cols-[32px_1fr_36px_36px] items-center gap-2 rounded border p-2">
                  <span className="text-lg">{n.icon}</span>
                  <span className="truncate text-sm">{n.name}</span>
                  <span className={`text-center text-sm ${iHave ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {iHave ? '✓' : '—'}
                  </span>
                  <span className={`text-center text-sm ${theyHave ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {theyHave ? '✓' : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {masteredNodes.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">Nenhuma habilidade dominada ainda por nenhum dos dois.</p>
      )}
    </div>
  );
}

function PhotosComparison({ friendId }: { friendId: string }) {
  const [photoData, setPhotoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/friends/${friendId}/progress-photos`).then(async (r) => {
      if (!r.ok) {
        const e = await r.json();
        setErr(e.error);
      } else {
        setPhotoData(await r.json());
      }
      setLoading(false);
    });
  }, [friendId]);

  if (loading) return <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (err === 'not_shared') return <LockedRow label="Fotos de progresso não compartilhadas pelo amigo" />;
  if (!photoData) return null;

  const myPhotos = photoData.my_photos || [];
  const friendPhotos = photoData.friend_photos || [];
  const maxLen = Math.max(myPhotos.length, friendPhotos.length);

  if (maxLen === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma foto de progresso pra comparar ainda.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: maxLen }).map((_, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <PhotoCell photo={myPhotos[i] || null} label="Você" />
          <PhotoCell photo={friendPhotos[i] || null} label="Amigo" />
        </div>
      ))}
    </div>
  );
}

function PhotoCell({ photo, label }: { photo: any; label: string }) {
  if (!photo) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
        sem foto
      </div>
    );
  }
  return (
    <div>
      <div className="overflow-hidden rounded-lg bg-muted">
        <img src={photo.photo_url} alt="" className="aspect-[3/4] w-full object-cover" />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{new Date(photo.taken_at).toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  );
}
