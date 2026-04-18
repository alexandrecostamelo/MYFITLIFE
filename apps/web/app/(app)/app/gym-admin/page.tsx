'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, BarChart2, Loader2 } from 'lucide-react';

export default function GymAdminIndexPage() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user-gyms')
      .then((r) => r.json())
      .then((d) => {
        // Filter to only claimed/managed gyms
        const managed = (d.gyms || []).filter((g: any) => g.gym_place_id);
        setGyms(managed);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/profile" className="rounded p-2 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Painel da academia</h1>
      </header>

      <p className="mb-4 text-sm text-muted-foreground">
        Gerencie suas academias e veja métricas agregadas de uso.
      </p>

      {gyms.length === 0 ? (
        <Card className="p-6 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="mb-2 text-sm font-medium">Nenhuma academia gerenciada</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Para administrar uma academia, acesse a página dela e envie uma solicitação de propriedade.
          </p>
          <Button asChild variant="outline">
            <Link href="/app/explore">Explorar academias</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {gyms.map((g: any) => (
            <Card key={g.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{g.gym_place?.name || g.name}</div>
                  {g.gym_place?.city && (
                    <div className="text-xs text-muted-foreground">{[g.gym_place.city, g.gym_place.state].filter(Boolean).join(', ')}</div>
                  )}
                </div>
                <Button asChild size="sm">
                  <Link href={`/app/gym-admin/${g.gym_place_id}`}>
                    <BarChart2 className="mr-1 h-4 w-4" /> Analytics
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
