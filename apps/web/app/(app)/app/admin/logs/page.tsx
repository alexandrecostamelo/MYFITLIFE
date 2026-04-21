'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  Shield,
  UserX,
  UserCheck,
  Crown,
  Trash2,
  Eye,
} from 'lucide-react';

interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  block: { bg: 'bg-red-500/10', text: 'text-red-400', icon: UserX },
  unblock: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: UserCheck },
  change_tier: { bg: 'bg-accent/10', text: 'text-accent', icon: Crown },
  remove_content: { bg: 'bg-red-500/10', text: 'text-red-400', icon: Trash2 },
  dismiss: { bg: 'bg-white/[0.06]', text: 'text-white/50', icon: Eye },
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/logs?page=${page}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setTotalPages(data.total_pages || 1);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Logs de Auditoria</h1>
          <p className="text-sm text-white/35">{total} registros</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-zinc-600 shadow-lg">
          <ScrollText className="h-4 w-4 text-white" />
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-16">
            <Loader2 className="h-5 w-5 animate-spin text-white/30" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-16">
            <Shield className="mb-2 h-8 w-8 text-white/10" />
            <p className="text-sm text-white/30">Nenhum log registrado</p>
          </div>
        ) : (
          logs.map((log) => {
            const style = ACTION_STYLES[log.action] || { bg: 'bg-white/[0.06]', text: 'text-white/50', icon: Eye };
            const ActionIcon = style.icon;
            return (
              <div
                key={log.id}
                className="group flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.1] hover:bg-white/[0.03]"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
                  <ActionIcon className={`h-4 w-4 ${style.text}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-lg ${style.bg} px-2 py-0.5 text-xs font-medium ${style.text}`}>
                      {log.action}
                    </span>
                    <span className="text-xs text-white/30">por</span>
                    <span className="text-xs font-medium text-white/60">{log.admin_name}</span>
                  </div>
                  {log.target_user_id && (
                    <p className="mt-1 text-xs text-white/25">
                      Alvo: <span className="font-mono text-white/40">{log.target_user_id.slice(0, 8)}...</span>
                    </p>
                  )}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="mt-0.5 max-w-lg truncate text-xs text-white/20">
                      {JSON.stringify(log.details)}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-white/20">
                  {new Date(log.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-xl border border-white/[0.06] p-2 text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] px-3 py-1.5 text-xs">
            <span className="font-semibold text-white">{page}</span>
            <span className="text-white/25">de</span>
            <span className="text-white/50">{totalPages}</span>
          </div>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-xl border border-white/[0.06] p-2 text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  );
}
