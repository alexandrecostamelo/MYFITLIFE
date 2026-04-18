'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Star, Loader2, Heart } from 'lucide-react';

const PROFESSION_LABELS: Record<string, string> = {
  nutritionist: 'Nutricionista',
  personal_trainer: 'Personal',
  physiotherapist: 'Fisioterapeuta',
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/professionals/favorites').then((r) => r.json()).then((d) => {
      setFavorites(d.favorites || []);
      setLoading(false);
    });
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/professionals" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Favoritos</h1>
      </header>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : favorites.length === 0 ? (
        <Card className="p-6 text-center">
          <Heart className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum profissional favoritado ainda.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {favorites.map((p) => (
            <Link key={p.id} href={`/app/professionals/${p.id}`}>
              <Card className="p-3 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">{p.full_name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {PROFESSION_LABELS[p.profession]}{p.city ? ` · ${p.city}` : ''}
                    </div>
                    {p.rating_count > 0 && (
                      <div className="mt-1 flex items-center gap-0.5 text-xs">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{Number(p.rating_avg).toFixed(1)}</span>
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
