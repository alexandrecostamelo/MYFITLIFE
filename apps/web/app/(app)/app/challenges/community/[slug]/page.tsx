'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORY_LABELS, computeProgress } from '@myfitlife/core/challenges';
import { ArrowLeft, Loader2, Users, Camera, Calendar, Flame, Trophy, Medal } from 'lucide-react';

export default function ChallengeDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'leaderboard'>('overview');
  const [checkingIn, setCheckingIn] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [valueInput, setValueInput] = useState('1');
  const [notesInput, setNotesInput] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [d, lb] = await Promise.all([
      fetch(`/api/community/challenges/${slug}`).then((r) => r.json()),
      fetch(`/api/community/challenges/${slug}/leaderboard`).then((r) => r.json()),
    ]);
    setData(d);
    setLeaderboard(lb);
    setLoading(false);
    if (
      d?.challenge?.challenge_type === 'total_reps' ||
      d?.challenge?.challenge_type === 'accumulated_minutes' ||
      d?.challenge?.challenge_type === 'daily_reps'
    ) {
      setValueInput(String(d.challenge.target_value));
    }
  }

  useEffect(() => { load(); }, [slug]);

  async function enroll() {
    setEnrolling(true);
    const res = await fetch(`/api/community/challenges/${slug}/enroll`, { method: 'POST' });
    if (res.ok) await load();
    setEnrolling(false);
  }

  async function abandon() {
    if (!confirm('Tem certeza que quer abandonar este desafio?')) return;
    await fetch(`/api/community/challenges/${slug}/enroll`, { method: 'DELETE' });
    await load();
  }

  async function checkin() {
    setCheckingIn(true);
    try {
      let r: any;
      if (photoFile) {
        const formData = new FormData();
        formData.append('value', valueInput);
        if (notesInput) formData.append('notes', notesInput);
        formData.append('photo', photoFile);
        const res = await fetch(`/api/community/challenges/${slug}/checkin`, { method: 'POST', body: formData });
        r = await res.json();
      } else {
        const res = await fetch(`/api/community/challenges/${slug}/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: parseInt(valueInput) || 1, notes: notesInput || undefined }),
        });
        r = await res.json();
      }
      if (r.just_completed) alert('Parabéns! Você completou o desafio! 🎉');
      setNotesInput('');
      setPhotoFile(null);
      await load();
    } finally {
      setCheckingIn(false);
    }
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.challenge) return <div className="p-6 text-sm text-muted-foreground">Desafio não encontrado.</div>;

  const c = data.challenge;
  const p = data.my_participation;
  const iAmIn = !!p && !p.abandoned_at;
  const completed = !!p?.completed_at;
  const canCheckin = iAmIn && !completed && !data.today_checkin;
  const progress = p ? computeProgress(c, p) : null;
  const needsValue =
    c.challenge_type === 'total_reps' ||
    c.challenge_type === 'accumulated_minutes' ||
    c.challenge_type === 'daily_reps';

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/challenges/community" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{c.title}</h1>
      </header>

      {/* Challenge info */}
      <Card className="mb-4 p-5">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{c.cover_emoji}</div>
          <div className="flex-1">
            <div className="mb-1 flex flex-wrap gap-1">
              <span className="rounded bg-muted px-2 py-0.5 text-xs">{CATEGORY_LABELS[c.category]}</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">+{c.xp_on_complete} XP</span>
            </div>
            <p className="text-sm">{c.description}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {data.participant_count}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {c.duration_days} dias</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress card */}
      {iAmIn && progress && (
        <Card
          className={`mb-4 border p-4 ${
            completed ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : ''
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Seu progresso</div>
              <div className="text-lg font-bold">{progress.label}</div>
            </div>
            {completed ? (
              <span className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white">
                <Trophy className="h-4 w-4" /> Completo!
              </span>
            ) : (
              <div className="text-2xl font-bold">{Math.round(progress.percent)}%</div>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${completed ? 'bg-green-500' : 'bg-primary'}`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          {p.current_streak > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              <Flame className="h-3 w-3 text-orange-500" />
              {p.current_streak} dia{p.current_streak > 1 ? 's' : ''} seguidos (recorde: {p.longest_streak})
            </div>
          )}
        </Card>
      )}

      {/* Check-in form */}
      {canCheckin && (
        <Card className="mb-4 border-primary/30 bg-primary/5 p-4">
          <h3 className="mb-2 text-sm font-medium">Check-in de hoje</h3>

          {needsValue && (
            <Input
              type="number"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              placeholder={`Quantidade (${c.target_unit})`}
              className="mb-2"
            />
          )}

          <Input
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Notas do dia (opcional)"
            className="mb-2"
          />

          {c.challenge_type === 'photo_habit' ? (
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mb-2 w-full">
              <Camera className="mr-2 h-4 w-4" />
              {photoFile ? photoFile.name : 'Escolher foto (obrigatória)'}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mb-2 w-full text-xs"
            >
              <Camera className="mr-2 h-3 w-3" />
              {photoFile ? photoFile.name : 'Adicionar foto (opcional)'}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          />

          <Button
            onClick={checkin}
            disabled={checkingIn || (c.challenge_type === 'photo_habit' && !photoFile)}
            className="w-full"
          >
            {checkingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fazer check-in'}
          </Button>
        </Card>
      )}

      {/* Today done */}
      {iAmIn && data.today_checkin && !completed && (
        <Card className="mb-4 border-green-200 bg-green-50 p-3 text-center text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          ✓ Check-in de hoje feito. Volta amanhã!
        </Card>
      )}

      {/* Enroll button */}
      {!iAmIn && (c.status === 'enrollment' || c.status === 'active') && (
        <Button onClick={enroll} disabled={enrolling} className="mb-4 w-full" size="lg">
          {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : '⚡ Entrar no desafio'}
        </Button>
      )}

      {/* Tips */}
      {c.tips?.length > 0 && (
        <Card className="mb-4 p-4">
          <h3 className="mb-2 text-sm font-medium">Dicas</h3>
          <ul className="space-y-1 text-xs">
            {c.tips.map((t: string, i: number) => (
              <li key={i} className="text-muted-foreground">• {t}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Tabs */}
      {iAmIn && (
        <>
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => setTab('overview')}
              className={`flex-1 rounded-md border px-3 py-1.5 text-xs ${tab === 'overview' ? 'border-primary bg-primary/10' : 'border-input'}`}
            >
              Meus check-ins
            </button>
            <button
              onClick={() => setTab('leaderboard')}
              className={`flex-1 rounded-md border px-3 py-1.5 text-xs ${tab === 'leaderboard' ? 'border-primary bg-primary/10' : 'border-input'}`}
            >
              Ranking
            </button>
          </div>

          {tab === 'overview' && (
            <Card className="mb-4 p-4">
              <h3 className="mb-2 text-sm font-medium">Últimos check-ins</h3>
              {!data.recent_checkins?.length ? (
                <p className="text-xs text-muted-foreground">Nenhum check-in ainda.</p>
              ) : (
                <div className="space-y-1">
                  {data.recent_checkins.map((ci: any) => (
                    <div key={ci.id} className="flex items-center justify-between rounded border p-2 text-sm">
                      <div>
                        <div>{new Date(ci.checkin_date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                        {ci.notes && <div className="text-xs text-muted-foreground">{ci.notes}</div>}
                      </div>
                      <div className="text-right">
                        {c.challenge_type !== 'daily_streak' && c.challenge_type !== 'photo_habit' && (
                          <div className="font-medium">{ci.value} {c.target_unit}</div>
                        )}
                        {ci.photo_path && <Camera className="inline h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {tab === 'leaderboard' && leaderboard?.leaderboard && (
            <Card className="mb-4 p-4">
              <h3 className="mb-3 text-sm font-medium">Top {leaderboard.leaderboard.length}</h3>
              <div className="space-y-1">
                {leaderboard.leaderboard.map((l: any) => (
                  <div
                    key={l.id}
                    className={`flex items-center gap-2 rounded p-2 ${l.is_me ? 'bg-primary/10' : ''}`}
                  >
                    <span className="w-6 text-sm font-bold">
                      {l.rank === 1 ? '🥇' : l.rank === 2 ? '🥈' : l.rank === 3 ? '🥉' : `#${l.rank}`}
                    </span>
                    <div className="flex-1 text-sm">
                      {l.user?.full_name || 'Usuário'}
                      {l.is_me && <span className="ml-1 text-xs text-primary">(você)</span>}
                    </div>
                    <div className="text-sm">
                      {c.challenge_type === 'total_reps' || c.challenge_type === 'accumulated_minutes'
                        ? `${l.current_progress} ${c.target_unit}`
                        : `${l.check_in_count}/${c.duration_days}`}
                    </div>
                    {l.completed_at && <Medal className="h-3 w-3 text-amber-500" />}
                  </div>
                ))}
              </div>
              {leaderboard.total > 20 && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  e mais {leaderboard.total - 20} participantes
                </p>
              )}
            </Card>
          )}

          {!completed && (
            <Button variant="outline" size="sm" onClick={abandon} className="w-full">
              Abandonar desafio
            </Button>
          )}
        </>
      )}
    </main>
  );
}
