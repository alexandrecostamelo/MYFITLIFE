'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, Camera, Eye, EyeOff } from 'lucide-react';

const CATEGORIES = [
  { key: 'weight_loss', label: 'Emagrecimento' },
  { key: 'hypertrophy', label: 'Hipertrofia' },
  { key: 'recomposition', label: 'Recomposição' },
  { key: 'health', label: 'Saúde' },
  { key: 'mobility', label: 'Mobilidade' },
  { key: 'other', label: 'Outro' },
];

export default function NewTransformationPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);
  const [category, setCategory] = useState('weight_loss');
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [anonymized, setAnonymized] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false })
        .then(({ data }) => {
          const enriched = (data || []).map((p: any) => ({
            ...p,
            url: supabase.storage.from('progress-photos').getPublicUrl(p.photo_path).data.publicUrl,
          }));
          setPhotos(enriched);
          setLoading(false);
        });
    });
  }, []);

  async function submit() {
    if (!beforeId || !afterId || !acceptTerms) return;
    setSubmitting(true);
    const res = await fetch('/api/transformations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        before_photo_id: beforeId,
        after_photo_id: afterId,
        category,
        title: title || undefined,
        story: story || undefined,
        anonymized,
        display_name_override: displayName || undefined,
        accept_terms: true,
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      router.push('/app/transformations?submitted=1');
    } else {
      alert(data.error || 'Erro ao enviar');
    }
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (photos.length < 2) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <header className="mb-4 flex items-center gap-2">
          <Link href="/app/transformations" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-xl font-bold">Compartilhar transformação</h1>
        </header>
        <Card className="p-6 text-center">
          <Camera className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Você precisa de pelo menos 2 fotos de progresso antes de poder publicar.
          </p>
          <Button asChild variant="outline" className="mt-3">
            <Link href="/app/progress">Adicionar fotos</Link>
          </Button>
        </Card>
      </main>
    );
  }

  const canSubmit = beforeId && afterId && beforeId !== afterId && acceptTerms;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/transformations" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Compartilhar transformação</h1>
      </header>

      {/* Seleção de foto "antes" */}
      <Card className="mb-4 p-4">
        <h3 className="mb-2 text-sm font-medium">
          Foto &quot;antes&quot; {beforeId && <span className="text-primary">✓</span>}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setBeforeId(p.id === beforeId ? null : p.id)}
              className={`overflow-hidden rounded-lg border-2 transition-all ${beforeId === p.id ? 'border-primary' : 'border-transparent'}`}
            >
              <img src={p.url} alt="" className="aspect-square w-full object-cover" />
              <div className="bg-black/70 p-1 text-center text-xs text-white">
                {new Date(p.taken_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Seleção de foto "depois" */}
      <Card className="mb-4 p-4">
        <h3 className="mb-2 text-sm font-medium">
          Foto &quot;depois&quot; {afterId && <span className="text-primary">✓</span>}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setAfterId(p.id === afterId ? null : p.id)}
              disabled={beforeId === p.id}
              className={`overflow-hidden rounded-lg border-2 transition-all ${
                afterId === p.id ? 'border-primary' : 'border-transparent'
              } ${beforeId === p.id ? 'pointer-events-none opacity-30' : ''}`}
            >
              <img src={p.url} alt="" className="aspect-square w-full object-cover" />
              <div className="bg-black/70 p-1 text-center text-xs text-white">
                {new Date(p.taken_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Detalhes */}
      <Card className="mb-4 space-y-3 p-4">
        <div>
          <Label className="text-xs">Categoria</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
          >
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs">Título (opcional)</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: 6 meses de consistência"
            maxLength={120}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">História (opcional)</Label>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-transparent p-3 text-sm"
            rows={4}
            maxLength={2000}
            placeholder="Conta como você chegou até aqui..."
          />
        </div>
      </Card>

      {/* Privacidade */}
      <Card className="mb-4 space-y-3 p-4">
        <h3 className="text-sm font-medium">Privacidade</h3>

        <label className="flex cursor-pointer items-start justify-between gap-3 rounded border p-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              {anonymized ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Publicar anônimo
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Rosto será coberto e seu nome ficará oculto.
            </p>
          </div>
          <div className="relative mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={anonymized}
              onChange={(e) => setAnonymized(e.target.checked)}
            />
            <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary" />
            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </div>
        </label>

        {anonymized && (
          <div>
            <Label className="text-xs">Nome alternativo (opcional)</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Maria · 38 anos"
              maxLength={60}
              className="mt-1"
            />
          </div>
        )}
      </Card>

      {/* Aceite de termos */}
      <Card className="mb-4 border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0"
          />
          <p className="text-xs text-amber-900 dark:text-amber-200">
            Confirmo que as fotos são minhas e que concordo em compartilhá-las publicamente.
            Entendo que o MyFitLife pode remover o post a qualquer momento.
            Posso excluir minhas fotos da galeria a qualquer momento.
            Uma marca d&apos;água MyFitLife será aplicada automaticamente.
          </p>
        </label>
      </Card>

      <Button onClick={submit} disabled={!canSubmit || submitting} className="w-full" size="lg">
        {submitting
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : 'Enviar para aprovação'}
      </Button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Seu post passará por moderação antes de aparecer na galeria pública.
      </p>
    </main>
  );
}
