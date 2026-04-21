'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ScrollText,
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

const ACTION_COLORS: Record<string, string> = {
  block: 'bg-red-500/20 text-red-400',
  unblock: 'bg-green-500/20 text-green-400',
  change_tier: 'bg-accent/20 text-accent',
  remove_content: 'bg-red-500/20 text-red-400',
  dismiss: 'bg-white/10 text-white/60',
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
    <main className="p-6 space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Logs de Auditoria</h1>
        </div>
        <span className="text-sm text-muted-foreground">{total} registros</span>
      </div>

      <Card className="divide-y divide-white/5">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum log registrado.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-white/10 text-white/60'}`}>
                    {log.action}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    por {log.admin_name}
                  </span>
                </div>
                {log.target_user_id && (
                  <p className="text-xs text-muted-foreground">
                    Alvo: <span className="font-mono">{log.target_user_id.slice(0, 8)}...</span>
                  </p>
                )}
                {log.details && Object.keys(log.details).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {JSON.stringify(log.details)}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(log.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
          ))
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page}/{totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </main>
  );
}
