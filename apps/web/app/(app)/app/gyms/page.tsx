'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, ChevronRight, MapPin, Dumbbell, Star } from 'lucide-react';

type Gym = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  is_primary: boolean;
  equipment_count: number;
};

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gyms').then((r) => r.json()).then((d) => {
      setGyms(d.gyms || []);
      setLoading(false);
    });
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/profile" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Minhas academias</h1>
      </header>

      <p className="mb-4 text-sm text-muted-foreground">
        Cadastre as academias que você frequenta e escaneie os aparelhos. Depois a IA monta treinos usando apenas os equipamentos que você tem disponível.
      </p>

      <Button asChild className="mb-4 w-full">
        <Link href="/app/gyms/new">
          <Plus className="mr-2 h-4 w-4" /> Nova academia
        </Link>
      </Button>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : gyms.length === 0 ? (
        <Card className="p-6 text-center">
          <Dumbbell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma academia cadastrada ainda.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {gyms.map((g) => (
            <Link key={g.id} href={`/app/gyms/${g.id}`}>
              <Card className="p-4 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{g.name}</span>
                      {g.is_primary && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    </div>
                    {(g.city || g.state) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[g.city, g.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-muted-foreground">
                      {g.equipment_count} {g.equipment_count === 1 ? 'aparelho' : 'aparelhos'} cadastrados
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
