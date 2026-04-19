'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Heart, Plus, Share2, Sparkles, CheckCircle } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  weight_loss: 'Emagrecimento',
  hypertrophy: 'Hipertrofia',
  recomposition: 'Recomposição',
  health: 'Saúde',
  mobility: 'Mobilidade',
  other: 'Outro',
};

function TransformationsContent() {
  const searchParams = useSearchParams();
  const submitted = searchParams.get('submitted');

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [tab, setTab] = useState<'public' | 'mine'>('public');

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('scope', tab);
    if (category && tab === 'public') params.set('category', category);
    const res = await fetch(`/api/transformations?${params}`);
    const data = await res.json();
    setPosts(data.posts || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [category, tab]);

  async function toggleInspire(id: string) {
    const res = await fetch(`/api/transformations/${id}/inspire`, { method: 'POST' });
    if (res.ok) {
      const { inspired } = await res.json();
      setPosts((ps) => ps.map((p) => p.id === id
        ? { ...p, i_inspired: inspired, inspires_count: p.inspires_count + (inspired ? 1 : -1) }
        : p
      ));
    }
  }

  async function sharePost(post: any) {
    const text = `Olha essa transformação no MyFitLife!${post.title ? ` ${post.title}` : ''}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'MyFitLife', text }); } catch {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }

  async function removeMine(id: string) {
    if (!confirm('Remover este post da galeria? A ação é irreversível.')) return;
    await fetch(`/api/transformations/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Transformações</h1>
      </header>

      {submitted === '1' && (
        <Card className="mb-4 border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
          <p className="text-sm">
            <CheckCircle className="mr-2 inline h-4 w-4 text-green-600" />
            Post enviado! Passará por moderação antes de aparecer na galeria.
          </p>
        </Card>
      )}

      {/* Tabs */}
      <div className="mb-3 grid grid-cols-2 gap-1">
        {(['public', 'mine'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${tab === t ? 'border-primary bg-primary/10 text-primary' : 'border-input'}`}
          >
            {t === 'public' ? 'Galeria' : 'Meus posts'}
          </button>
        ))}
      </div>

      <Button asChild variant="outline" className="mb-4 w-full" size="sm">
        <Link href="/app/transformations/new">
          <Plus className="mr-2 h-4 w-4" /> Compartilhar transformação
        </Link>
      </Button>

      {/* Filtros de categoria */}
      {tab === 'public' && (
        <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory('')}
            className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${category === '' ? 'border-primary bg-primary/10 text-primary' : 'border-input'}`}
          >
            Todas
          </button>
          {Object.entries(CATEGORY_LABELS).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setCategory(k)}
              className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${category === k ? 'border-primary bg-primary/10 text-primary' : 'border-input'}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : posts.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {tab === 'mine' ? 'Você ainda não publicou nenhuma transformação.' : 'Nenhuma transformação aprovada ainda.'}
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <Card key={p.id} className={`overflow-hidden ${p.featured ? 'ring-2 ring-amber-400' : ''}`}>
              {/* Fotos lado a lado */}
              <div className="grid grid-cols-2">
                <div className="relative">
                  <img src={p.before_url} alt="antes" className="aspect-[3/4] w-full object-cover" />
                  <div className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">Antes</div>
                </div>
                <div className="relative">
                  <img src={p.after_url} alt="depois" className="aspect-[3/4] w-full object-cover" />
                  <div className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">Depois</div>
                </div>
              </div>

              <div className="p-3">
                {p.title && <h3 className="mb-1 text-sm font-bold">{p.title}</h3>}

                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs">
                    {CATEGORY_LABELS[p.category] || p.category}
                  </span>
                  {p.period_days && (
                    <span className="text-xs text-muted-foreground">{p.period_days} dias</span>
                  )}
                  {p.featured && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      ⭐ Destaque
                    </span>
                  )}
                  {tab === 'mine' && (
                    <span className={`rounded px-2 py-0.5 text-xs ${
                      p.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' :
                      p.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' :
                      p.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {p.status === 'approved' ? 'Publicado' : p.status === 'pending' ? 'Em análise' : p.status === 'rejected' ? 'Rejeitado' : 'Removido'}
                    </span>
                  )}
                </div>

                {p.story && (
                  <p className="mb-2 line-clamp-3 text-xs text-muted-foreground">{p.story}</p>
                )}

                {tab === 'public' && (
                  <div className="flex items-center gap-1 border-t pt-2">
                    <span className="flex-1 truncate text-xs text-muted-foreground">
                      {p.author_name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleInspire(p.id)}
                      className={`h-8 px-2 ${p.i_inspired ? 'text-pink-600' : ''}`}
                    >
                      <Heart className={`mr-1 h-4 w-4 ${p.i_inspired ? 'fill-current' : ''}`} />
                      <span className="text-xs">{p.inspires_count}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => sharePost(p)}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {tab === 'mine' && p.status !== 'removed' && (
                  <div className="border-t pt-2">
                    {p.status === 'rejected' && p.reject_reason && (
                      <p className="mb-2 text-xs text-destructive">Motivo: {p.reject_reason}</p>
                    )}
                    <Button variant="outline" size="sm" onClick={() => removeMine(p.id)}>
                      Remover post
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export default function TransformationsPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <TransformationsContent />
    </Suspense>
  );
}
