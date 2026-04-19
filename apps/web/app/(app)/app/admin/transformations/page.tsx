'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Shield, Loader2, Check, X, Star,
  ShieldCheck, ShieldAlert, ShieldX, Clock,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// AI moderation badge
// ---------------------------------------------------------------------------
const AI_BADGES: Record<string, { label: string; Icon: React.ElementType; className: string }> = {
  pending: {
    label: 'IA analisando...',
    Icon: Clock,
    className: 'bg-muted text-muted-foreground border-muted-foreground/30',
  },
  auto_approved: {
    label: 'IA aprovou',
    Icon: ShieldCheck,
    className: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  },
  needs_review: {
    label: 'IA: revisar',
    Icon: ShieldAlert,
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  auto_rejected: {
    label: 'IA rejeitou',
    Icon: ShieldX,
    className: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  },
  error: {
    label: 'IA com erro',
    Icon: Shield,
    className: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
  },
};

function AiBadge({ status }: { status: string | null }) {
  const b = AI_BADGES[status || 'pending'];
  if (!b) return null;
  const { Icon } = b;
  return (
    <Badge variant="outline" className={`gap-1 text-[11px] ${b.className}`}>
      <Icon className="h-3 w-3" />
      {b.label}
    </Badge>
  );
}

function AiReasoning({
  reasoning,
  flags,
  confidence,
}: {
  reasoning: string | null;
  flags: unknown;
  confidence: number | null;
}) {
  if (!reasoning) return null;
  const flagList = Array.isArray(flags) ? (flags as string[]) : [];
  return (
    <div className="mt-2 rounded-md border bg-muted/30 p-3 text-sm space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-wide">Análise da IA</span>
        {confidence !== null && confidence !== undefined && (
          <span>Confiança: {Math.round((confidence || 0) * 100)}%</span>
        )}
      </div>
      <p className="text-sm">{reasoning}</p>
      {flagList.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {flagList.map((f) => (
            <Badge key={f} variant="secondary" className="text-[10px]">
              {f}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminTransformationsPage() {
  const [posts, setPosts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/transformations?status=${status}`);
    if (res.status === 403) { setForbidden(true); setLoading(false); return; }
    if (!res.ok) { setLoading(false); return; }
    setPosts((await res.json()).posts || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [status]);

  async function doAction(id: string, act: string, reason?: string) {
    await fetch('/api/admin/transformations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: act, reason }),
    });
    await load();
  }

  if (forbidden) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <Card className="p-6 text-center">
          <Shield className="mx-auto mb-2 h-8 w-8 text-destructive" />
          <p className="text-sm">Acesso negado. Apenas admins da plataforma.</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/gym-admin" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Moderar transformações</h1>
      </header>

      <Card className="mb-3 p-1">
        <div className="grid grid-cols-3 gap-1">
          {(['pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                status === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {s === 'pending' ? 'Pendentes' : s === 'approved' ? 'Aprovadas' : 'Rejeitadas'}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="p-6 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Nenhum post.</Card>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => {
            const author = p.author as Record<string, unknown> | undefined;
            const authorName = String(author?.full_name ?? '');
            const authorUsername = author?.username ? String(author.username) : null;
            const category = String(p.category ?? '');
            const periodDays = p.period_days as number | null;
            const title = p.title ? String(p.title) : null;
            const story = p.story ? String(p.story) : null;
            return (
              <Card key={p.id as string} className="overflow-hidden">
                <div className="grid grid-cols-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.before_url as string} alt="" className="aspect-square w-full object-cover" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.after_url as string} alt="" className="aspect-square w-full object-cover" />
                </div>
                <div className="p-3">
                  {/* Meta row */}
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium">{authorName}</span>
                    {authorUsername && (
                      <span className="text-xs text-muted-foreground">@{authorUsername}</span>
                    )}
                    <span className="text-xs text-muted-foreground">· {category}</span>
                    {!!p.anonymized && (
                      <span className="text-xs text-amber-600">· ANÔNIMO</span>
                    )}
                    {!!periodDays && (
                      <span className="text-xs text-muted-foreground">· {periodDays} dias</span>
                    )}
                    {/* AI status badge */}
                    <AiBadge status={p.ai_moderation_status as string | null} />
                  </div>

                  {title && (
                    <div className="mb-1 text-sm font-medium">{title}</div>
                  )}
                  {story && (
                    <p className="mb-2 line-clamp-4 text-xs text-muted-foreground">
                      {story}
                    </p>
                  )}

                  {/* AI reasoning box */}
                  <AiReasoning
                    reasoning={p.ai_moderation_reasoning as string | null}
                    flags={p.ai_moderation_flags}
                    confidence={p.ai_moderation_confidence as number | null}
                  />

                  {/* Action buttons */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => doAction(p.id as string, 'approve')}>
                          <Check className="mr-1 h-3 w-3" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const reason = prompt('Motivo da rejeição:');
                            if (reason !== null) doAction(p.id as string, 'reject', reason);
                          }}
                        >
                          <X className="mr-1 h-3 w-3" /> Rejeitar
                        </Button>
                      </>
                    )}
                    {status === 'approved' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            doAction(p.id as string, p.featured ? 'unfeature' : 'feature')
                          }
                        >
                          <Star
                            className={`mr-1 h-3 w-3 ${p.featured ? 'fill-current text-amber-500' : ''}`}
                          />
                          {p.featured ? 'Remover destaque' : 'Destacar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Remover definitivamente?'))
                              doAction(p.id as string, 'remove');
                          }}
                        >
                          Remover
                        </Button>
                      </>
                    )}
                    {status === 'rejected' && !!p.reject_reason && (
                      <p className="text-xs text-destructive">
                        Motivo: {String(p.reject_reason)}
                      </p>
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
