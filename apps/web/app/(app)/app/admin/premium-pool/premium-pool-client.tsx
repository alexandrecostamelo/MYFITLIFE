'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Loader2 } from 'lucide-react';

const SPEC_LABELS: Record<string, string> = {
  nutrition: 'Nutrição',
  training: 'Treino',
  physio: 'Fisio',
};

export function PremiumPoolClient() {
  const [pools, setPools] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    professional_id: '',
    specialty: 'nutrition',
    max_clients: 20,
    rate_brl: 80,
  });

  const load = async () => {
    const [poolRes, profRes] = await Promise.all([
      fetch('/api/admin/premium-pool').then((r) => r.json()),
      fetch('/api/admin/professionals').then((r) => r.json()),
    ]);
    setPools(poolRes.pools || []);
    setProfessionals(profRes.professionals || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    const res = await fetch('/api/admin/premium-pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      load();
    }
  };

  const remove = async (professional_id: string, specialty: string) => {
    if (!confirm('Remover do pool Premium?')) return;
    await fetch('/api/admin/premium-pool', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professional_id, specialty }),
    });
    load();
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pool Premium</h1>
        <Button size="sm" onClick={() => setShowAdd((s) => !s)}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      {showAdd && (
        <section className="rounded-xl border bg-card p-4 space-y-3">
          <div className="space-y-1">
            <Label>Profissional</Label>
            <select
              value={form.professional_id}
              onChange={(e) => setForm({ ...form, professional_id: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            >
              <option value="">— selecionar —</option>
              {professionals.map((p: any) => (
                <option key={p.user_id || p.id} value={p.user_id || p.id}>
                  {p.full_name} ({p.council_type || p.profession})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label>Especialidade</Label>
              <select
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              >
                <option value="nutrition">Nutrição</option>
                <option value="training">Treino</option>
                <option value="physio">Fisio</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Clientes/mês</Label>
              <Input
                type="number"
                value={form.max_clients}
                onChange={(e) => setForm({ ...form, max_clients: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <Label>R$ por sessão</Label>
              <Input
                type="number"
                value={form.rate_brl}
                onChange={(e) => setForm({ ...form, rate_brl: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <Button onClick={add} disabled={!form.professional_id}>
            Adicionar ao pool
          </Button>
        </section>
      )}

      <section className="rounded-xl border divide-y">
        {pools.map((p: any) => (
          <div key={p.id} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{p.professional?.full_name || 'Profissional'}</p>
              <p className="text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px] mr-1">
                  {SPEC_LABELS[p.specialty] || p.specialty}
                </Badge>
                {p.current_clients_count}/{p.max_clients_per_month} clientes · R${' '}
                {Number(p.rate_brl_per_session || 0).toFixed(2).replace('.', ',')}/sessão
                {!p.is_active && (
                  <Badge variant="destructive" className="ml-1 text-[10px]">
                    Inativo
                  </Badge>
                )}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(p.professional_id, p.specialty)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {pools.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum profissional no pool</p>
        )}
      </section>
    </main>
  );
}
