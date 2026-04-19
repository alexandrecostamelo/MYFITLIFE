'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Shield, Loader2, Save } from 'lucide-react';

export default function AdminExercisesPage() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Record<string, { video_url: string; pose_check_key: string }>>({});

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from('exercises')
      .select('id, name_pt, category, video_url, pose_check_key')
      .order('name_pt')
      .limit(300);
    setExercises(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(id: string) {
    const payload = editing[id];
    if (!payload) return;
    const res = await fetch('/api/admin/exercises/video', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercise_id: id,
        video_url: payload.video_url || null,
        video_source: payload.video_url?.includes('youtu') ? 'youtube' : 'direct',
        pose_check_key: payload.pose_check_key || null,
      }),
    });
    if (res.ok) {
      setEditing((e) => { const copy = { ...e }; delete copy[id]; return copy; });
      await load();
    }
  }

  const filtered = q
    ? exercises.filter((e) =>
        e.name_pt.toLowerCase().includes(q.toLowerCase()) ||
        e.category?.toLowerCase().includes(q.toLowerCase())
      )
    : exercises;

  return (
    <main className="mx-auto max-w-3xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/gym-admin" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Vídeos de exercícios</h1>
      </header>

      <Card className="mb-4 p-2">
        <div className="grid grid-cols-6 gap-1">
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/claims">Claims</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/professionals">Pros</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/reports">Denúncias</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/ai-metrics">IA</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/feature-flags">Flags</Link></Button>
          <Button asChild variant="default" size="sm"><Link href="/app/admin/exercises">Vídeos</Link></Button>
        </div>
      </Card>

      <Input
        placeholder="Buscar exercício"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4"
      />

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 100).map((ex) => {
            const editValues = editing[ex.id] || {
              video_url: ex.video_url || '',
              pose_check_key: ex.pose_check_key || '',
            };
            const changed =
              editValues.video_url !== (ex.video_url || '') ||
              editValues.pose_check_key !== (ex.pose_check_key || '');

            return (
              <Card key={ex.id} className="p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{ex.name_pt}</div>
                    <div className="text-xs text-muted-foreground">{ex.category}</div>
                  </div>
                  {ex.video_url && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                      Com vídeo
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="URL do YouTube ou vídeo direto"
                    value={editValues.video_url}
                    onChange={(e) =>
                      setEditing({ ...editing, [ex.id]: { ...editValues, video_url: e.target.value } })
                    }
                  />
                  <div className="flex gap-2">
                    <select
                      value={editValues.pose_check_key}
                      onChange={(e) =>
                        setEditing({ ...editing, [ex.id]: { ...editValues, pose_check_key: e.target.value } })
                      }
                      className="flex-1 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
                    >
                      <option value="">Sem análise de forma</option>
                      <option value="squat">Agachamento</option>
                      <option value="push_up">Flexão</option>
                      <option value="plank">Prancha</option>
                      <option value="lunge">Avanço</option>
                    </select>
                    {changed && (
                      <Button size="sm" onClick={() => save(ex.id)}>
                        <Save className="mr-1 h-3 w-3" /> Salvar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
