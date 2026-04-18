'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, ShoppingCart, Loader2, Sparkles } from 'lucide-react';

type ListSummary = {
  id: string;
  title: string;
  source: string | null;
  completed: boolean;
  created_at: string;
};

export default function ShoppingListsPage() {
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/shopping-list');
    const data = await res.json();
    setLists(data.lists || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function generate(days: number) {
    setGenerating(true);
    setError(null);
    const res = await fetch('/api/shopping-list/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setError(data.message || data.error || 'Erro ao gerar');
      return;
    }
    await load();
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Lista de compras</h1>
      </header>

      <Card className="mb-4 p-4">
        <h2 className="mb-2 text-sm font-medium">Gerar automaticamente</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          A IA cria uma lista consolidada a partir dos planos do Autopilot.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => generate(3)} disabled={generating}>
            <Sparkles className="mr-1 h-3 w-3" /> 3 dias
          </Button>
          <Button variant="outline" size="sm" onClick={() => generate(7)} disabled={generating}>
            <Sparkles className="mr-1 h-3 w-3" /> 7 dias
          </Button>
          <Button variant="outline" size="sm" onClick={() => generate(14)} disabled={generating}>
            <Sparkles className="mr-1 h-3 w-3" /> 14 dias
          </Button>
        </div>
        {generating && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Gerando lista...
          </div>
        )}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : lists.length === 0 ? (
        <Card className="p-6 text-center">
          <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma lista ainda. Gere uma a partir do seu plano.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {lists.map((l) => (
            <Link key={l.id} href={`/app/shopping-list/${l.id}`}>
              <Card className={`p-4 hover:bg-slate-50 ${l.completed ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{l.title}</span>
                      {l.completed && <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">concluída</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleDateString('pt-BR')}
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
