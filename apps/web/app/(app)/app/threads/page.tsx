'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, MessageCircle } from 'lucide-react';

export default function ThreadsPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/threads').then((r) => r.json()).then((d) => {
      setThreads(d.threads || []);
      setLoading(false);
    });
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Conversas</h1>
      </header>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : threads.length === 0 ? (
        <Card className="p-6 text-center">
          <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <Link key={t.id} href={`/app/threads/${t.id}`}>
              <Card className="p-3 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
                    {t.other_user?.avatar_url ? (
                      <img src={t.other_user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        {(t.other_user?.full_name || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t.other_user?.full_name || 'Usuário'}</span>
                      {t.my_unread > 0 && (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">{t.my_unread}</span>
                      )}
                    </div>
                    {t.last_message_at && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(t.last_message_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
