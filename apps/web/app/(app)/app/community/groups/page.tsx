'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Users } from 'lucide-react';

const CAT_LABELS: Record<string, string> = {
  treino: 'Treino',
  cardio: 'Cardio',
  nutricao: 'Nutrição',
  bem_estar: 'Bem-estar',
  geral: 'Geral',
};

export default function GroupsListPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/groups').then((r) => r.json()).then((d) => {
      setGroups(d.groups || []);
      setLoading(false);
    });
  }, []);

  const byCategory: Record<string, any[]> = {};
  groups.forEach((g) => {
    if (!byCategory[g.category]) byCategory[g.category] = [];
    byCategory[g.category].push(g);
  });

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/community" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Grupos</h1>
      </header>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">{CAT_LABELS[cat] || cat}</h3>
              <div className="space-y-2">
                {items.map((g) => (
                  <Link key={g.id} href={`/app/community/groups/${g.slug}`}>
                    <Card className="p-3 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{g.cover_emoji}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{g.name}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" /> {g.member_count}
                            {g.is_member && <span className="ml-1 rounded bg-primary/10 px-1 text-primary">membro</span>}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
