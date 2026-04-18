'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Star, MapPin, Mail, Instagram, Globe, CheckCircle, Heart, Loader2, MessageCircle } from 'lucide-react';

const PROFESSION_LABELS: Record<string, string> = {
  nutritionist: 'Nutricionista',
  personal_trainer: 'Personal Trainer',
  physiotherapist: 'Fisioterapeuta',
};

const MODALITY_LABELS: Record<string, string> = {
  online: 'Online',
  presencial: 'Presencial',
  domiciliar: 'Domicílio',
};

export default function ProfessionalDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  async function load() {
    const res = await fetch(`/api/professionals/${id}`);
    const d = await res.json();
    setData(d);
    if (d.my_review) {
      setReviewRating(d.my_review.rating);
      setReviewComment(d.my_review.comment || '');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function toggleFavorite() {
    const method = data.is_favorite ? 'DELETE' : 'POST';
    await fetch(`/api/professionals/${id}/favorite`, { method });
    await load();
  }

  async function submitReview() {
    setSavingReview(true);
    await fetch(`/api/professionals/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: reviewRating, comment: reviewComment || undefined }),
    });
    await load();
    setSavingReview(false);
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.professional) return <div className="p-6">Profissional não encontrado</div>;

  const pro = data.professional;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/professionals" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">Profissional</h1>
      </header>

      <Card className="mb-4 p-4">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
            {pro.avatar_url ? (
              <img src={pro.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-slate-500">{pro.full_name.charAt(0)}</div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{pro.full_name}</h2>
              {pro.verified && <CheckCircle className="h-4 w-4 fill-blue-500 text-white" />}
            </div>
            <div className="text-sm text-muted-foreground">{PROFESSION_LABELS[pro.profession]}</div>
            <div className="text-xs text-muted-foreground">
              {pro.council_type} {pro.council_number}/{pro.council_state}
            </div>
            {(pro.city || pro.state) && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {[pro.city, pro.state].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
          <button onClick={toggleFavorite} className="p-2">
            <Heart className={`h-5 w-5 ${data.is_favorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
        </div>

        {pro.rating_count > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(pro.rating_avg)) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
              ))}
            </div>
            <span className="text-sm font-medium">{Number(pro.rating_avg).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({pro.rating_count} avaliações)</span>
          </div>
        )}
      </Card>

      {pro.bio && (
        <Card className="mb-4 p-4">
          <h3 className="mb-2 text-sm font-medium">Sobre</h3>
          <p className="whitespace-pre-wrap text-sm">{pro.bio}</p>
        </Card>
      )}

      {pro.specialties?.length > 0 && (
        <Card className="mb-4 p-4">
          <h3 className="mb-2 text-sm font-medium">Especialidades</h3>
          <div className="flex flex-wrap gap-2">
            {pro.specialties.map((s: string, i: number) => (
              <span key={i} className="rounded bg-primary/10 px-2 py-1 text-xs text-primary">{s}</span>
            ))}
          </div>
        </Card>
      )}

      {pro.formations?.length > 0 && (
        <Card className="mb-4 p-4">
          <h3 className="mb-2 text-sm font-medium">Formação</h3>
          <ul className="space-y-1 text-sm">
            {pro.formations.map((f: string, i: number) => (
              <li key={i} className="text-muted-foreground">• {f}</li>
            ))}
          </ul>
        </Card>
      )}

      {pro.modalities?.length > 0 && (
        <Card className="mb-4 p-4">
          <h3 className="mb-2 text-sm font-medium">Modalidades de atendimento</h3>
          <div className="flex flex-wrap gap-2">
            {pro.modalities.map((m: string, i: number) => (
              <span key={i} className="rounded border px-2 py-1 text-xs">{MODALITY_LABELS[m] || m}</span>
            ))}
          </div>
        </Card>
      )}

      {(pro.price_consultation || pro.price_monthly) && (
        <Card className="mb-4 p-4">
          <h3 className="mb-2 text-sm font-medium">Valores</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {pro.price_consultation && (
              <div className="rounded border p-2">
                <div className="text-xs text-muted-foreground">Consulta avulsa</div>
                <div className="font-bold">R$ {Number(pro.price_consultation).toFixed(2)}</div>
              </div>
            )}
            {pro.price_monthly && (
              <div className="rounded border p-2">
                <div className="text-xs text-muted-foreground">Acompanhamento mensal</div>
                <div className="font-bold">R$ {Number(pro.price_monthly).toFixed(2)}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="mb-4 p-4">
        <h3 className="mb-2 text-sm font-medium">Contato</h3>
        <div className="space-y-2">
          {pro.whatsapp && (
            <a
              href={`https://wa.me/${pro.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 text-sm text-green-700 hover:underline"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
          {pro.email && (
            <a href={`mailto:${pro.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Mail className="h-4 w-4" /> {pro.email}
            </a>
          )}
          {pro.instagram && (
            <a
              href={`https://instagram.com/${pro.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Instagram className="h-4 w-4" /> {pro.instagram}
            </a>
          )}
          {pro.website && (
            <a href={pro.website} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Globe className="h-4 w-4" /> Website
            </a>
          )}
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <h3 className="mb-3 text-sm font-medium">Sua avaliação</h3>
        <div className="mb-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((r) => (
            <button key={r} onClick={() => setReviewRating(r)}>
              <Star className={`h-6 w-6 ${r <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
            </button>
          ))}
        </div>
        <Input
          placeholder="Comentário (opcional)"
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          className="mb-2"
        />
        <Button onClick={submitReview} size="sm" className="w-full" disabled={savingReview}>
          {savingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : data.my_review ? 'Atualizar avaliação' : 'Enviar avaliação'}
        </Button>
      </Card>

      {data.recent_reviews?.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-medium">Avaliações recentes</h3>
          <div className="space-y-3">
            {data.recent_reviews.map((r: any, i: number) => (
              <div key={i} className="border-b pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.user.full_name || r.user.username || 'Usuário'}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="mt-1 text-xs text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}
