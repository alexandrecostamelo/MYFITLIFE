'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BodyCompositionRings } from '@/components/ui/body-composition-rings';
import { ProgressChart } from '@/components/ui/progress-chart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, TrendingDown, TrendingUp } from 'lucide-react';

interface Props {
  records: Record<string, unknown>[];
}

function Field({
  label,
  value,
  onChange,
  type = 'number',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function BodyCompClient({ records }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    measured_at: new Date().toISOString().slice(0, 10),
    weight_kg: '',
    body_fat_pct: '',
    muscle_mass_kg: '',
    lean_mass_kg: '',
    bone_mass_kg: '',
    water_pct: '',
    visceral_fat_level: '',
    basal_metabolic_rate: '',
    body_age: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const latest = records[0];
  const prev = records[1];

  const save = async () => {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { measured_at: form.measured_at };
    for (const [k, v] of Object.entries(form)) {
      if (k === 'measured_at' || k === 'notes') continue;
      if (v) payload[k] = parseFloat(v);
    }
    if (form.notes) payload.notes = form.notes;
    await fetch('/api/body-composition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setShowForm(false);
    setSaving(false);
    router.refresh();
  };

  const delta = (field: string) => {
    if (!latest || !prev) return null;
    const diff = Number(latest[field] || 0) - Number(prev[field] || 0);
    if (diff === 0) return null;
    return { value: diff, positive: diff > 0 };
  };

  // Chart data
  const fatData = records
    .filter((r) => r.body_fat_pct != null)
    .map((r) => ({
      date: String(r.measured_at),
      value: Number(r.body_fat_pct),
    }))
    .reverse();
  const muscleData = records
    .filter((r) => r.muscle_mass_kg != null)
    .map((r) => ({
      date: String(r.measured_at),
      value: Number(r.muscle_mass_kg),
    }))
    .reverse();

  // Derived percentages for ring chart
  const weightKg = Number(latest?.weight_kg) || 0;
  const musclePct =
    latest?.muscle_mass_kg && weightKg
      ? (Number(latest.muscle_mass_kg) / weightKg) * 100
      : 0;
  const bonePct =
    latest?.bone_mass_kg && weightKg
      ? (Number(latest.bone_mass_kg) / weightKg) * 100
      : 0;

  const METRICS = [
    {
      label: 'Gordura',
      field: 'body_fat_pct',
      unit: '%',
      goodDown: true,
    },
    {
      label: 'M. Magra',
      field: 'muscle_mass_kg',
      unit: 'kg',
      goodDown: false,
    },
    { label: 'Água', field: 'water_pct', unit: '%', goodDown: false },
    {
      label: 'Osso',
      field: 'bone_mass_kg',
      unit: 'kg',
      goodDown: false,
    },
    {
      label: 'Gord. Visceral',
      field: 'visceral_fat_level',
      unit: '',
      goodDown: true,
    },
    {
      label: 'TMB',
      field: 'basal_metabolic_rate',
      unit: 'kcal',
      goodDown: false,
    },
  ];

  return (
    <main className="mx-auto max-w-lg px-4 py-6 pb-28 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="display-title">Composição Corporal</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> Registrar
        </Button>
      </div>

      {/* Ring chart */}
      {latest && (
        <section className="glass-card-elevated p-6">
          <BodyCompositionRings
            fat_pct={Number(latest.body_fat_pct) || 0}
            muscle_pct={musclePct}
            water_pct={Number(latest.water_pct) || 0}
            bone_pct={bonePct}
            size={180}
          />
        </section>
      )}

      {/* Metric cards */}
      {latest && (
        <section className="grid grid-cols-2 gap-2">
          {METRICS.filter((m) => latest[m.field] != null).map((m) => {
            const d = delta(m.field);
            return (
              <div key={m.field} className="glass-card p-3">
                <p className="metric-label">{m.label}</p>
                <p className="font-mono text-xl font-light mt-1">
                  {Number(latest[m.field]).toFixed(1)}{' '}
                  <span className="text-xs text-muted-foreground">
                    {m.unit}
                  </span>
                </p>
                {d && (
                  <p
                    className={`text-xs mt-0.5 flex items-center gap-0.5 ${
                      (d.positive && m.goodDown) ||
                      (!d.positive && !m.goodDown)
                        ? 'text-red-400'
                        : 'text-accent'
                    }`}
                  >
                    {d.positive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {d.positive ? '+' : ''}
                    {d.value.toFixed(1)}
                  </p>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Evolution charts */}
      {fatData.length >= 2 && (
        <section className="space-y-2">
          <h2 className="section-title">Evolução gordura (%)</h2>
          <ProgressChart data={fatData} unit="%" height={140} />
        </section>
      )}

      {muscleData.length >= 2 && (
        <section className="space-y-2">
          <h2 className="section-title">Evolução massa magra (kg)</h2>
          <ProgressChart data={muscleData} unit="kg" height={140} />
        </section>
      )}

      {/* Form */}
      {showForm && (
        <section className="glass-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Novo registro</h2>
          <Field
            label="Data"
            type="date"
            value={form.measured_at}
            onChange={(v) => setForm({ ...form, measured_at: v })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Peso (kg)"
              value={form.weight_kg}
              onChange={(v) => setForm({ ...form, weight_kg: v })}
            />
            <Field
              label="Gordura (%)"
              value={form.body_fat_pct}
              onChange={(v) => setForm({ ...form, body_fat_pct: v })}
            />
            <Field
              label="Massa magra (kg)"
              value={form.muscle_mass_kg}
              onChange={(v) => setForm({ ...form, muscle_mass_kg: v })}
            />
            <Field
              label="Massa óssea (kg)"
              value={form.bone_mass_kg}
              onChange={(v) => setForm({ ...form, bone_mass_kg: v })}
            />
            <Field
              label="Água (%)"
              value={form.water_pct}
              onChange={(v) => setForm({ ...form, water_pct: v })}
            />
            <Field
              label="Gord. Visceral"
              value={form.visceral_fat_level}
              onChange={(v) =>
                setForm({ ...form, visceral_fat_level: v })
              }
            />
            <Field
              label="TMB (kcal)"
              value={form.basal_metabolic_rate}
              onChange={(v) =>
                setForm({ ...form, basal_metabolic_rate: v })
              }
            />
            <Field
              label="Idade corporal"
              value={form.body_age}
              onChange={(v) => setForm({ ...form, body_age: v })}
            />
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            Salvar
          </Button>
        </section>
      )}

      {/* History */}
      {records.length > 0 && (
        <section className="space-y-2">
          <h2 className="section-title">Histórico</h2>
          {records.slice(0, 10).map((r) => (
            <div
              key={String(r.id)}
              className="glass-card p-3 flex items-center justify-between text-sm"
            >
              <span>
                {new Date(String(r.measured_at)).toLocaleDateString(
                  'pt-BR',
                )}
              </span>
              <div className="flex gap-3 text-xs text-muted-foreground">
                {r.body_fat_pct != null && (
                  <span>{Number(r.body_fat_pct).toFixed(1)}% gord</span>
                )}
                {r.muscle_mass_kg != null && (
                  <span>
                    {Number(r.muscle_mass_kg).toFixed(1)}kg magra
                  </span>
                )}
                {r.weight_kg != null && (
                  <span>{Number(r.weight_kg).toFixed(1)}kg</span>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Empty state */}
      {!latest && !showForm && (
        <section className="glass-card p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Faça uma avaliação de bioimpedância na sua academia e registre
            aqui.
          </p>
          <Button onClick={() => setShowForm(true)}>
            Registrar primeira medição
          </Button>
        </section>
      )}
    </main>
  );
}
