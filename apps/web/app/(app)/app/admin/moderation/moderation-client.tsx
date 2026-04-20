'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Check, Trash2, AlertTriangle, Ban, Loader2 } from 'lucide-react';

interface PendingPost {
  id: string;
  content: string | null;
  created_at: string;
  moderation_reason: string | null;
  moderation_categories: string[] | null;
  ai_moderation_score: number | null;
  author: { full_name?: string; username?: string; avatar_url?: string };
}

interface Report {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  created_at: string;
  reporter: { full_name?: string; username?: string };
}

interface Stats {
  total: number;
  aiAuto: number;
  human: number;
  removed: number;
}

export function ModerationClient({
  pending,
  reports,
  stats,
}: {
  pending: PendingPost[];
  reports: Report[];
  stats: Stats;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'pending' | 'reports'>('pending');
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (contentId: string, action: string) => {
    setBusy(contentId);
    try {
      await fetch('/api/admin/moderation/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId, action }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const reviewReport = async (reportId: string, decision: string) => {
    setBusy(reportId);
    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: decision === 'remove' ? 'remove_content' : 'dismiss' }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Moderação</h1>
        <p className="text-sm text-muted-foreground">Fila de revisão + denúncias</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Ações 7d" value={stats.total} />
        <StatCard label="IA automático" value={stats.aiAuto} />
        <StatCard label="Humano" value={stats.human} />
        <StatCard label="Removidos" value={stats.removed} accent />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <TabBtn active={tab === 'pending'} onClick={() => setTab('pending')} count={pending.length}>
          Fila de revisão
        </TabBtn>
        <TabBtn active={tab === 'reports'} onClick={() => setTab('reports')} count={reports.length}>
          Denúncias
        </TabBtn>
      </div>

      {tab === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 && <EmptyState label="Fila vazia — nada para revisar" />}
          {pending.map((p) => (
            <div key={p.id} className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {p.author.avatar_url ? (
                    <img src={p.author.avatar_url} className="h-9 w-9 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-bold">
                      {(p.author.full_name || '?')[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">{p.author.full_name || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">
                      @{p.author.username} · {timeAgo(p.created_at)}
                    </p>
                  </div>
                </div>
                {p.ai_moderation_score != null && (
                  <span className="rounded border px-2 py-0.5 text-[10px] font-medium">
                    IA: {(Number(p.ai_moderation_score) * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {p.content && (
                <p className="whitespace-pre-wrap break-words rounded bg-muted/40 p-3 text-sm">
                  {p.content}
                </p>
              )}

              {p.moderation_reason && (
                <div className="flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold">Motivo da IA</p>
                    <p className="text-muted-foreground">{p.moderation_reason}</p>
                    {(p.moderation_categories?.length || 0) > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.moderation_categories!.map((c) => (
                          <span key={c} className="rounded border px-1.5 py-0.5 text-[10px]">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => act(p.id, 'approve')} disabled={busy === p.id}>
                  {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                  Aprovar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => act(p.id, 'remove')} disabled={busy === p.id}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover
                </Button>
                <Button size="sm" variant="outline" onClick={() => act(p.id, 'warn')} disabled={busy === p.id}>
                  <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Remover + avisar
                </Button>
                <Button size="sm" variant="outline" onClick={() => act(p.id, 'ban')} disabled={busy === p.id}>
                  <Ban className="mr-1 h-3.5 w-3.5" /> Banir 7d
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 && <EmptyState label="Nenhuma denúncia pendente" />}
          {reports.map((r) => (
            <div key={r.id} className="space-y-2 rounded-lg border bg-card p-4">
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {r.target_type} ·{' '}
                  <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                    {r.reason}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  por @{r.reporter?.username || 'anônimo'} · {timeAgo(r.created_at)}
                </p>
              </div>
              {r.details && <p className="rounded bg-muted/40 p-2 text-sm">{r.details}</p>}
              <p className="font-mono text-xs text-muted-foreground">ID: {r.target_id}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => reviewReport(r.id, 'keep')} disabled={busy === r.id}>
                  <Check className="mr-1 h-3.5 w-3.5" /> Manter
                </Button>
                <Button size="sm" variant="destructive" onClick={() => reviewReport(r.id, 'remove')} disabled={busy === r.id}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover conteúdo
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function TabBtn({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      {count > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
          {count}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? 'border-destructive/30 bg-destructive/5' : ''}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="py-12 text-center text-sm text-muted-foreground">{label}</p>;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
