'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const GOALS = [
  { value: 'lose_fat', label: 'Perder gordura' },
  { value: 'gain_muscle', label: 'Ganhar massa' },
  { value: 'maintain', label: 'Manter' },
  { value: 'general_health', label: 'Saúde geral' },
  { value: 'performance', label: 'Performance' },
];

const LEVELS = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
];

const TONES = [
  { value: 'warm', label: 'Acolhedor' },
  { value: 'motivational', label: 'Motivacional' },
  { value: 'technical', label: 'Técnico' },
  { value: 'tough', label: 'Durão' },
];

const DIETS = [
  { value: 'balanced', label: 'Balanceada' },
  { value: 'low_carb', label: 'Low Carb' },
  { value: 'ketogenic', label: 'Cetogênica' },
  { value: 'mediterranean', label: 'Mediterrânea' },
  { value: 'vegetarian', label: 'Vegetariana' },
  { value: 'vegan', label: 'Vegana' },
  { value: 'intermittent_fasting', label: 'Jejum intermitente' },
  { value: 'flexible', label: 'Flexível (IIFYM)' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentário' },
  { value: 'light', label: 'Leve' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'active', label: 'Ativo' },
  { value: 'very_active', label: 'Muito ativo' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then((d) => {
      setForm({
        full_name: d.profile?.full_name || '',
        city: d.profile?.city || '',
        state: d.profile?.state || '',
        height_cm: d.profile?.height_cm || '',
        current_weight_kg: d.profile?.current_weight_kg || '',
        target_weight_kg: d.profile?.target_weight_kg || '',
        primary_goal: d.profile?.primary_goal || 'general_health',
        experience_level: d.profile?.experience_level || 'beginner',
        coach_tone: d.profile?.coach_tone || 'warm',
        diet_preference: d.profile?.diet_preference || 'balanced',
        activity_level: d.profile?.activity_level || 'moderate',
        sleep_hours_avg: d.profile?.sleep_hours_avg || '',
        available_minutes_per_day: d.profile?.available_minutes_per_day || '',
        injuries_notes: d.profile?.injuries_notes || '',
        age: '',
      });
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    const payload: any = {
      full_name: form.full_name,
      city: form.city || undefined,
      state: form.state || undefined,
      primary_goal: form.primary_goal,
      experience_level: form.experience_level,
      coach_tone: form.coach_tone,
      diet_preference: form.diet_preference,
      activity_level: form.activity_level,
      injuries_notes: form.injuries_notes || '',
    };
    if (form.height_cm) payload.height_cm = parseFloat(form.height_cm);
    if (form.current_weight_kg) payload.current_weight_kg = parseFloat(form.current_weight_kg);
    if (form.target_weight_kg) payload.target_weight_kg = parseFloat(form.target_weight_kg);
    if (form.sleep_hours_avg) payload.sleep_hours_avg = parseFloat(form.sleep_hours_avg);
    if (form.available_minutes_per_day) payload.available_minutes_per_day = parseInt(form.available_minutes_per_day);

    if (form.age && form.current_weight_kg && form.height_cm) {
      payload.age = parseInt(form.age);
      payload.recalculate_targets = true;
    }

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || 'Erro ao salvar');
      return;
    }
    router.push('/app/profile');
    router.refresh();
  }

  function setField(k: string, v: any) { setForm({ ...form, [k]: v }); }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/profile" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Editar perfil</h1>
      </header>

      <Card className="mb-4 p-4 space-y-3">
        <h2 className="text-sm font-medium">Dados pessoais</h2>
        <div>
          <Label>Nome</Label>
          <Input value={form.full_name} onChange={(e) => setField('full_name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Cidade</Label>
            <Input value={form.city} onChange={(e) => setField('city', e.target.value)} />
          </div>
          <div>
            <Label>Estado</Label>
            <Input value={form.state} onChange={(e) => setField('state', e.target.value)} placeholder="SP" />
          </div>
        </div>
      </Card>

      <Card className="mb-4 p-4 space-y-3">
        <h2 className="text-sm font-medium">Corpo e metas</h2>
        <div>
          <Label>Idade (para recalcular metas)</Label>
          <Input type="number" value={form.age} onChange={(e) => setField('age', e.target.value)} placeholder="Necessária para recalcular calorias" />
          <p className="mt-1 text-xs text-muted-foreground">Preencher idade + peso + altura recalcula automaticamente suas metas calóricas.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>Altura (cm)</Label>
            <Input type="number" value={form.height_cm} onChange={(e) => setField('height_cm', e.target.value)} />
          </div>
          <div>
            <Label>Peso (kg)</Label>
            <Input type="number" step="0.1" value={form.current_weight_kg} onChange={(e) => setField('current_weight_kg', e.target.value)} />
          </div>
          <div>
            <Label>Meta (kg)</Label>
            <Input type="number" step="0.1" value={form.target_weight_kg} onChange={(e) => setField('target_weight_kg', e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="mb-4 p-4 space-y-3">
        <h2 className="text-sm font-medium">Objetivo e nível</h2>
        <div>
          <Label>Objetivo</Label>
          <select value={form.primary_goal} onChange={(e) => setField('primary_goal', e.target.value)} className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
            {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <Label>Nível de experiência</Label>
          <select value={form.experience_level} onChange={(e) => setField('experience_level', e.target.value)} className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <Label>Nível de atividade diária</Label>
          <select value={form.activity_level} onChange={(e) => setField('activity_level', e.target.value)} className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
            {ACTIVITY_LEVELS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
      </Card>

      <Card className="mb-4 p-4 space-y-3">
        <h2 className="text-sm font-medium">Dieta e coach</h2>
        <div>
          <Label>Preferência alimentar</Label>
          <select value={form.diet_preference} onChange={(e) => setField('diet_preference', e.target.value)} className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
            {DIETS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <Label>Tom do coach</Label>
          <select value={form.coach_tone} onChange={(e) => setField('coach_tone', e.target.value)} className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
            {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </Card>

      <Card className="mb-4 p-4 space-y-3">
        <h2 className="text-sm font-medium">Rotina</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Sono (horas)</Label>
            <Input type="number" step="0.5" value={form.sleep_hours_avg} onChange={(e) => setField('sleep_hours_avg', e.target.value)} />
          </div>
          <div>
            <Label>Tempo treino (min)</Label>
            <Input type="number" value={form.available_minutes_per_day} onChange={(e) => setField('available_minutes_per_day', e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Lesões ou restrições</Label>
          <Input value={form.injuries_notes} onChange={(e) => setField('injuries_notes', e.target.value)} placeholder="Ex: dor no joelho direito" />
        </div>
      </Card>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <Button onClick={save} disabled={saving || !form.full_name} className="w-full">
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </main>
  );
}
