'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Youtube, Film, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Exercise {
  id: string;
  name_pt: string;
  slug: string;
}

interface Video {
  id: string;
  exercise_id: string;
  video_type: string;
  storage_path: string | null;
  youtube_id: string | null;
  duration_seconds: number | null;
  exercise: { name_pt: string; slug: string } | null;
}

const TYPES = [
  { value: 'front', label: 'Vista frontal' },
  { value: 'side', label: 'Vista lateral' },
  { value: 'mistakes', label: 'Erros comuns' },
  { value: 'setup', label: 'Setup' },
];

export function VideosAdminClient({
  exercises,
  videos,
}: {
  exercises: Exercise[];
  videos: Video[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'file' | 'youtube'>('youtube');
  const [exerciseId, setExerciseId] = useState('');
  const [videoType, setVideoType] = useState('front');
  const [youtubeId, setYoutubeId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const extractYoutubeId = (input: string): string => {
    const match = input.match(
      /(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/,
    );
    return match ? match[1] : input.trim();
  };

  const submit = async () => {
    setError('');
    if (!exerciseId) {
      setError('Selecione um exercício');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'youtube') {
        const id = extractYoutubeId(youtubeId);
        if (!id || id.length !== 11) {
          setError('YouTube ID inválido');
          setSubmitting(false);
          return;
        }
        const res = await fetch('/api/admin/exercise-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise_id: exerciseId,
            video_type: videoType,
            youtube_id: id,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Falha');
        setYoutubeId('');
      } else {
        if (!file) {
          setError('Escolha um arquivo');
          setSubmitting(false);
          return;
        }
        if (file.size > 20 * 1024 * 1024) {
          setError('Arquivo acima de 20MB');
          setSubmitting(false);
          return;
        }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('exercise_id', exerciseId);
        fd.append('video_type', videoType);
        const res = await fetch('/api/admin/exercise-videos/upload', {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Falha no upload');
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este vídeo?')) return;
    await fetch(`/api/admin/exercise-videos/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Vídeos de exercícios</h1>
        <p className="text-sm text-muted-foreground">{videos.length} vídeos cadastrados</p>
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Adicionar vídeo</h2>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === 'file' ? 'default' : 'outline'}
            onClick={() => setMode('file')}
          >
            <Film className="mr-1 h-4 w-4" /> Upload .mp4
          </Button>
          <Button
            size="sm"
            variant={mode === 'youtube' ? 'default' : 'outline'}
            onClick={() => setMode('youtube')}
          >
            <Youtube className="mr-1 h-4 w-4" /> YouTube
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Exercício *</Label>
            <select
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">— selecionar —</option>
              {exercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name_pt}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo *</Label>
            <select
              value={videoType}
              onChange={(e) => setVideoType(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {mode === 'youtube' ? (
          <div className="space-y-1.5">
            <Label>URL ou ID do YouTube *</Label>
            <Input
              value={youtubeId}
              onChange={(e) => setYoutubeId(e.target.value)}
              placeholder="https://youtube.com/watch?v=... ou apenas o ID"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Arquivo .mp4 (máx 20MB) *</Label>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} · {(file.size / 1024 / 1024).toFixed(1)}MB
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={submit} disabled={submitting}>
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Adicionar
        </Button>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Vídeos cadastrados</h2>
        <div className="divide-y rounded-lg border">
          {videos.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {v.exercise?.name_pt || 'Sem exercício'}
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded border px-1.5 py-0.5 text-[10px]">{v.video_type}</span>
                  {v.youtube_id ? (
                    <span className="flex items-center gap-1">
                      <Youtube className="h-3 w-3" /> {v.youtube_id}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Film className="h-3 w-3" /> próprio
                    </span>
                  )}
                  {v.duration_seconds && <span>· {v.duration_seconds}s</span>}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(v.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {videos.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhum vídeo ainda</p>
          )}
        </div>
      </section>
    </main>
  );
}
