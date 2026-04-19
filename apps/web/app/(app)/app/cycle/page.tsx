'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Moon, Trash2 } from 'lucide-react';

type FlowIntensity = 'light' | 'medium' | 'heavy';
type Cycle = { id: string; period_start: string; period_end: string | null; flow_intensity: string | null };
type Settings = { tracking_enabled: boolean; average_cycle_length: number; average_period_length: number };
type CurrentPhase = { phase: string; dayInCycle: number; daysUntilNext: number };

const PHASE_LABELS: Record<string, string> = {
  menstrual: 'Menstrual',
  follicular: 'Folicular',
  ovulatory: 'Ovulatória',
  luteal: 'Lútea',
  unknown: 'Desconhecida',
};

const PHASE_COLORS: Record<string, string> = {
  menstrual: 'bg-red-100 text-red-800 border-red-200',
  follicular: 'bg-green-100 text-green-800 border-green-200',
  ovulatory: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  luteal: 'bg-purple-100 text-purple-800 border-purple-200',
  unknown: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function CyclePage() {
  const [settings, setSettings] = useState<Settings>({ tracking_enabled: false, average_cycle_length: 28, average_period_length: 5 });
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [currentPhase, setCurrentPhase] = useState<CurrentPhase | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ period_start: string; period_end: string; flow_intensity: FlowIntensity }>({ period_start: '', period_end: '', flow_intensity: 'medium' });

  useEffect(() => {
    fetch('/api/cycle')
      .then((r) => r.json())
      .then((d) => {
        setCycles(d.cycles || []);
        if (d.settings) setSettings(d.settings);
        setCurrentPhase(d.current_phase || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveSettings() {
    setSaving(true);
    await fetch('/api/cycle/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).catch(() => {});
    setSaving(false);
  }

  async function addCycle() {
    if (!form.period_start) return;
    setSaving(true);
    const res = await fetch('/api/cycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await fetch('/api/cycle').then((r) => r.json());
      setCycles(updated.cycles || []);
      setCurrentPhase(updated.current_phase || null);
      setForm({ period_start: '', period_end: '', flow_intensity: 'medium' });
    }
    setSaving(false);
  }

  async function deleteCycle(id: string) {
    await fetch(`/api/cycle/${id}`, { method: 'DELETE' });
    setCycles((p) => p.filter((c) => c.id !== id));
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-2">
        <Moon className="h-5 w-5 text-purple-600" />
        <h1 className="text-xl font-bold">Ciclo Menstrual</h1>
      </div>

      {currentPhase && settings.tracking_enabled && (
        <Card className={`border px-4 py-4 ${PHASE_COLORS[currentPhase.phase]}`}>
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">Fase atual</p>
          <p className="mt-1 text-2xl font-bold">{PHASE_LABELS[currentPhase.phase]}</p>
          <p className="mt-1 text-sm">Dia {currentPhase.dayInCycle} do ciclo · próxima fase em {currentPhase.daysUntilNext} dia(s)</p>
        </Card>
      )}

      <Card className="px-4 py-4 space-y-4">
        <h2 className="font-semibold">Configurações</h2>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="tracking_enabled"
            checked={settings.tracking_enabled}
            onChange={(e) => setSettings((s) => ({ ...s, tracking_enabled: e.target.checked }))}
            className="h-4 w-4"
          />
          <Label htmlFor="tracking_enabled">Ativar rastreamento de ciclo</Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Duração do ciclo (dias)</Label>
            <Input type="number" min={21} max={45} value={settings.average_cycle_length}
              onChange={(e) => setSettings((s) => ({ ...s, average_cycle_length: Number(e.target.value) }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Duração da menstruação (dias)</Label>
            <Input type="number" min={2} max={10} value={settings.average_period_length}
              onChange={(e) => setSettings((s) => ({ ...s, average_period_length: Number(e.target.value) }))} />
          </div>
        </div>
        <Button onClick={saveSettings} disabled={saving} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
        </Button>
      </Card>

      <Card className="px-4 py-4 space-y-3">
        <h2 className="font-semibold">Registrar período</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Início</Label>
            <Input type="date" value={form.period_start} onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fim (opcional)</Label>
            <Input type="date" value={form.period_end} onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Fluxo</Label>
          <div className="flex gap-2">
            {(['light', 'medium', 'heavy'] as const).map((f) => (
              <Button key={f} size="sm" variant={form.flow_intensity === f ? 'default' : 'outline'}
                onClick={() => setForm((p) => ({ ...p, flow_intensity: f }))}>
                {{ light: 'Leve', medium: 'Médio', heavy: 'Intenso' }[f]}
              </Button>
            ))}
          </div>
        </div>
        <Button onClick={addCycle} disabled={saving || !form.period_start} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}
        </Button>
      </Card>

      {cycles.length > 0 && (
        <Card className="px-4 py-4 space-y-2">
          <h2 className="font-semibold">Histórico</h2>
          <div className="space-y-2">
            {cycles.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{c.period_start}</span>
                  {c.period_end && <span className="text-muted-foreground"> → {c.period_end}</span>}
                  {c.flow_intensity && (
                    <span className="ml-2 rounded border px-1.5 py-0.5 text-xs">
                      {{ light: 'Leve', medium: 'Médio', heavy: 'Intenso' }[c.flow_intensity] || c.flow_intensity}
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCycle(c.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
