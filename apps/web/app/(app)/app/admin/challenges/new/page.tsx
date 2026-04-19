'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';

const EMOJIS = ['🏆','🔥','💪','⚡','🎯','🏃','🚴','🧘','🥗','💧','🌟','🎖️','🏅'];

const CATEGORIES = [
  { key: 'strength', label: 'Força' },
  { key: 'endurance', label: 'Resistência' },
  { key: 'flexibility', label: 'Flexibilidade' },
  { key: 'nutrition', label: 'Nutrição' },
  { key: 'mindset', label: 'Mentalidade' },
  { key: 'consistency', label: 'Consistência' },
  { key: 'other', label: 'Outro' },
];

const TYPES = [
  { key: 'reps', label: 'Repetições totais' },
  { key: 'sessions', label: 'Sessões' },
  { key: 'duration_sec', label: 'Duração (segundos)' },
  { key: 'distance_m', label: 'Distância (metros)' },
  { key: 'custom', label: 'Personalizado' },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function addDays(dateStr: string, days: number) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function NewChallengePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [emoji, setEmoji] = useState('🏆');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('strength');
  const [challengeType, setChallengeType] = useState('reps');
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [exerciseHint, setExerciseHint] = useState('');
  const [durationDays, setDurationDays] = useState('21');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [enrollmentEnd, setEnrollmentEnd] = useState('');
  const [xpOnComplete, setXpOnComplete] = useState('100');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [featured, setFeatured] = useState(false);
  const [rules, setRules] = useState('');
  const [tips, setTips] = useState<string[]>(['']);

  function handleTitleChange(v: string) {
    setTitle(v);
    setSlug(slugify(v));
  }

  function handleStartDateChange(v: string) {
    setStartDate(v);
    const dur = parseInt(durationDays) || 21;
    setEndDate(addDays(v, dur));
    setEnrollmentEnd(addDays(v, -1));
  }

  function handleDurationChange(v: string) {
    setDurationDays(v);
    const dur = parseInt(v) || 21;
    if (startDate) setEndDate(addDays(startDate, dur));
  }

  function addTip() { setTips((t) => [...t, '']); }
  function removeTip(i: number) { setTips((t) => t.filter((_, idx) => idx !== i)); }
  function updateTip(i: number, v: string) { setTips((t) => t.map((x, idx) => idx === i ? v : x)); }

  async function submit() {
    setError('');
    if (!title || !slug || !startDate || !endDate || !targetValue || !targetUnit) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    setSubmitting(true);

    const res = await fetch('/api/admin/challenges/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        title,
        description: description || undefined,
        category,
        challenge_type: challengeType,
        target_value: parseInt(targetValue),
        target_unit: targetUnit,
        exercise_hint: exerciseHint || undefined,
        duration_days: parseInt(durationDays),
        start_date: startDate,
        end_date: endDate,
        enrollment_end: enrollmentEnd || undefined,
        cover_emoji: emoji,
        xp_on_complete: parseInt(xpOnComplete) || 100,
        max_participants: maxParticipants ? parseInt(maxParticipants) : undefined,
        featured,
        rules: rules || undefined,
        tips: tips.filter(Boolean),
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Erro ao criar desafio.');
      return;
    }
    router.push('/app/admin/challenges');
  }

  const sel = 'border-primary bg-primary/10 text-primary';
  const unsel = 'border-input hover:bg-muted';

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/admin/challenges" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Criar novo desafio</h1>
      </header>

      {/* Emoji picker */}
      <Card className="mb-4 p-4">
        <Label className="mb-2 block text-xs">Emoji do desafio</Label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`rounded-lg border-2 p-2 text-2xl transition-all ${emoji === e ? 'border-primary' : 'border-transparent'}`}
            >
              {e}
            </button>
          ))}
        </div>
      </Card>

      {/* Identificação */}
      <Card className="mb-4 space-y-3 p-4">
        <div>
          <Label className="text-xs">Título <span className="text-destructive">*</span></Label>
          <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Ex: Desafio 21 dias de flexão" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Slug <span className="text-destructive">*</span></Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ex-21-dias-flexao" className="mt-1 font-mono text-sm" />
          <p className="mt-0.5 text-xs text-muted-foreground">Identificador único (a-z, 0-9, hífens)</p>
        </div>
        <div>
          <Label className="text-xs">Descrição</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-transparent p-3 text-sm"
            rows={3}
            maxLength={2000}
            placeholder="O que é esse desafio?"
          />
        </div>
      </Card>

      {/* Categoria */}
      <Card className="mb-4 p-4">
        <Label className="mb-2 block text-xs">Categoria</Label>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setCategory(c.key)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${category === c.key ? sel : unsel}`}>
              {c.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Meta */}
      <Card className="mb-4 space-y-3 p-4">
        <h3 className="text-sm font-medium">Meta do desafio</h3>
        <div>
          <Label className="text-xs">Tipo de métrica</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {TYPES.map((t) => (
              <button key={t.key} onClick={() => setChallengeType(t.key)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${challengeType === t.key ? sel : unsel}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Valor alvo <span className="text-destructive">*</span></Label>
            <Input type="number" min={1} value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="100" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Unidade <span className="text-destructive">*</span></Label>
            <Input value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} placeholder="flexões, sessões, km…" className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Exercício sugerido (opcional)</Label>
          <Input value={exerciseHint} onChange={(e) => setExerciseHint(e.target.value)} placeholder="Ex: Flexão de braço" className="mt-1" />
        </div>
      </Card>

      {/* Datas */}
      <Card className="mb-4 space-y-3 p-4">
        <h3 className="text-sm font-medium">Período</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Início <span className="text-destructive">*</span></Label>
            <Input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Duração (dias)</Label>
            <Input type="number" min={1} max={365} value={durationDays} onChange={(e) => handleDurationChange(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Fim (calculado)</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Fim inscrições</Label>
            <Input type="date" value={enrollmentEnd} onChange={(e) => setEnrollmentEnd(e.target.value)} className="mt-1" />
          </div>
        </div>
      </Card>

      {/* Configurações extras */}
      <Card className="mb-4 space-y-3 p-4">
        <h3 className="text-sm font-medium">Configurações</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">XP ao completar</Label>
            <Input type="number" min={0} value={xpOnComplete} onChange={(e) => setXpOnComplete(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Máx. participantes</Label>
            <Input type="number" min={1} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} placeholder="sem limite" className="mt-1" />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4" />
          <span className="text-sm">Destacar na listagem</span>
        </label>
      </Card>

      {/* Regras */}
      <Card className="mb-4 p-4">
        <Label className="mb-1 block text-xs">Regras (opcional)</Label>
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent p-3 text-sm"
          rows={4}
          maxLength={5000}
          placeholder="Como funciona, o que é permitido…"
        />
      </Card>

      {/* Dicas */}
      <Card className="mb-4 p-4">
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-xs">Dicas (opcional)</Label>
          <Button variant="ghost" size="sm" onClick={addTip} className="h-7 px-2 text-xs">
            <Plus className="mr-1 h-3 w-3" /> Adicionar
          </Button>
        </div>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={tip}
                onChange={(e) => updateTip(i, e.target.value)}
                placeholder={`Dica ${i + 1}`}
                maxLength={200}
                className="flex-1"
              />
              {tips.length > 1 && (
                <button onClick={() => removeTip(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar desafio'}
      </Button>
    </main>
  );
}
