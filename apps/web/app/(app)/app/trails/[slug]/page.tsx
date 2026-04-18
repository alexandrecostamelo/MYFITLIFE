'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Check, Play, Pause, Sparkles } from 'lucide-react';

const THEME_COLORS: Record<string, string> = {
  workout: 'bg-blue-100 text-blue-800', cardio: 'bg-red-100 text-red-800',
  nutrition: 'bg-green-100 text-green-800', recovery: 'bg-amber-100 text-amber-800',
  mindset: 'bg-purple-100 text-purple-800',
};
const THEME_LABELS: Record<string, string> = {
  workout: 'Treino', cardio: 'Cardio', nutrition: 'Nutrição', recovery: 'Descanso', mindset: 'Mindset',
};

type Day = { day: number; title: string; theme: string; focus: string; workout_hint?: string; nutrition_hint?: string; tip: string };
type Trail = { id: string; slug: string; title: string; subtitle: string; description: string; duration_days: number; cover_emoji: string; days_config: Day[] };
type UserTrail = { current_day: number; days_completed: number[] | null; completed_at: string | null; abandoned: boolean };

export default function TrailDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [trail, setTrail] = useState<Trail | null>(null);
  const [userTrail, setUserTrail] = useState<UserTrail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  async function load() {
    const res = await fetch(`/api/trails/${slug}`);
    const data = await res.json();
    setTrail(data.trail); setUserTrail(data.user_trail); setLoading(false);
  }
  useEffect(() => { load(); }, [slug]);

  async function enroll() { setActing(true); await fetch(`/api/trails/${slug}/enroll`, { method: 'POST' }); await load(); setActing(false); }
  async function completeDay(day: number) {
    setActing(true);
    await fetch(`/api/trails/${slug}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete_day', day }) });
    await load(); setActing(false);
  }
  async function setAbandon(abandoned: boolean) {
    setActing(true);
    await fetch(`/api/trails/${slug}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: abandoned ? 'abandon' : 'resume' }) });
    await load(); setActing(false);
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!trail) return <div className="p-6">Trilha não encontrada</div>;

  const completedSet = new Set(userTrail?.days_completed || []);
  const isEnrolled = !!userTrail;
  const completed = !!userTrail?.completed_at;
  const abandoned = !!userTrail?.abandoned;
  const progress = userTrail ? Math.round(((userTrail.days_completed?.length || 0) / trail.duration_days) * 100) : 0;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/trails" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">Trilha</h1>
      </header>

      <Card className="mb-4 p-4">
        <div className="mb-2 flex items-start gap-3">
          <div className="text-4xl">{trail.cover_emoji}</div>
          <div><h2 className="text-lg font-bold">{trail.title}</h2><p className="text-sm text-muted-foreground">{trail.subtitle}</p></div>
        </div>
        <p className="text-sm">{trail.description}</p>
        {isEnrolled && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{userTrail?.days_completed?.length || 0} de {trail.duration_days} dias</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-slate-200"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
      </Card>

      {!isEnrolled && (
        <Button onClick={enroll} disabled={acting} className="mb-4 w-full">
          {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" /> Começar esta trilha</>}
        </Button>
      )}

      {isEnrolled && !completed && (
        <div className="mb-4">
          {abandoned ? (
            <Button onClick={() => setAbandon(false)} disabled={acting} className="w-full"><Play className="mr-2 h-4 w-4" /> Retomar</Button>
          ) : (
            <Button variant="outline" onClick={() => setAbandon(true)} disabled={acting} className="w-full"><Pause className="mr-2 h-4 w-4" /> Pausar trilha</Button>
          )}
        </div>
      )}

      {completed && (
        <Card className="mb-4 bg-green-50 p-4 text-center">
          <Check className="mx-auto mb-2 h-8 w-8 text-green-600" />
          <p className="font-medium text-green-900">Trilha concluída!</p>
          <p className="mt-1 text-xs text-green-800">Parabéns por completar {trail.duration_days} dias.</p>
        </Card>
      )}

      <h3 className="mb-2 text-sm font-medium text-muted-foreground">CRONOGRAMA</h3>
      <div className="space-y-2">
        {trail.days_config.map((day) => {
          const isCompleted = completedSet.has(day.day);
          const isCurrent = userTrail?.current_day === day.day && !isCompleted;
          return (
            <Card key={day.day} className={`p-3 ${isCurrent ? 'border-primary bg-primary/5' : ''} ${isCompleted ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${isCompleted ? 'bg-green-600 text-white' : isCurrent ? 'bg-primary text-white' : 'bg-slate-200'}`}>
                  {isCompleted ? <Check className="h-4 w-4" /> : day.day}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{day.title}</div>
                  <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-xs ${THEME_COLORS[day.theme] || 'bg-slate-100'}`}>
                    {THEME_LABELS[day.theme] || day.theme}
                  </span>
                  {isCurrent && (
                    <div className="mt-2 space-y-1 text-xs">
                      {day.workout_hint && <div><strong>Treino:</strong> {day.workout_hint}</div>}
                      {day.nutrition_hint && <div><strong>Nutrição:</strong> {day.nutrition_hint}</div>}
                      <div className="rounded bg-amber-50 p-2 italic text-amber-900">💡 {day.tip}</div>
                      {isEnrolled && !completed && !abandoned && (
                        <Button size="sm" onClick={() => completeDay(day.day)} disabled={acting} className="mt-2 w-full">
                          <Check className="mr-1 h-4 w-4" /> Completar dia {day.day}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
