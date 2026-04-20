'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

const DAYS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

const MODALITIES = [
  'spinning',
  'yoga',
  'funcional',
  'crossfit',
  'pilates',
  'danca',
  'luta',
  'natacao',
  'musculacao_guiada',
  'alongamento',
  'hiit',
  'outro',
];

const MODALITY_LABELS: Record<string, string> = {
  spinning: 'Spinning',
  yoga: 'Yoga',
  funcional: 'Funcional',
  crossfit: 'CrossFit',
  pilates: 'Pilates',
  danca: 'Dança',
  luta: 'Luta',
  natacao: 'Natação',
  musculacao_guiada: 'Musculação Guiada',
  alongamento: 'Alongamento',
  hiit: 'HIIT',
  outro: 'Outro',
};

interface Props {
  gymId: string;
  gymName: string;
  classes: Record<string, unknown>[];
}

export function GymClassAdminClient({ gymId, gymName, classes }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    modality: 'funcional',
    instructor_name: '',
    day_of_week: '1',
    start_time: '07:00',
    end_time: '08:00',
    max_capacity: '20',
    location_detail: '',
  });

  const create = async () => {
    setSaving(true);
    await fetch('/api/gym-classes/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gym_id: gymId,
        title: form.title,
        modality: form.modality,
        instructor_name: form.instructor_name || null,
        day_of_week: parseInt(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
        max_capacity: parseInt(form.max_capacity),
        location_detail: form.location_detail || null,
      }),
    });
    setShowForm(false);
    setSaving(false);
    setForm({
      title: '',
      modality: 'funcional',
      instructor_name: '',
      day_of_week: '1',
      start_time: '07:00',
      end_time: '08:00',
      max_capacity: '20',
      location_detail: '',
    });
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Desativar esta turma?')) return;
    await fetch('/api/gym-classes/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: id }),
    });
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-title">Turmas</h1>
          <p className="text-sm text-muted-foreground">{gymName}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> Nova turma
        </Button>
      </div>

      {showForm && (
        <section className="glass-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Nova turma</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Título</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="Spinning manhã"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Modalidade</Label>
              <select
                value={form.modality}
                onChange={(e) =>
                  setForm({ ...form, modality: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              >
                {MODALITIES.map((m) => (
                  <option key={m} value={m}>
                    {MODALITY_LABELS[m] || m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Instrutor</Label>
              <Input
                value={form.instructor_name}
                onChange={(e) =>
                  setForm({ ...form, instructor_name: e.target.value })
                }
                placeholder="Nome do instrutor"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dia da semana</Label>
              <select
                value={form.day_of_week}
                onChange={(e) =>
                  setForm({ ...form, day_of_week: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Início</Label>
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fim</Label>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) =>
                  setForm({ ...form, end_time: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vagas</Label>
              <Input
                type="number"
                value={form.max_capacity}
                onChange={(e) =>
                  setForm({ ...form, max_capacity: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Local</Label>
              <Input
                value={form.location_detail}
                onChange={(e) =>
                  setForm({ ...form, location_detail: e.target.value })
                }
                placeholder="Sala 2, Piscina..."
              />
            </div>
          </div>
          <Button
            onClick={create}
            disabled={!form.title || saving}
            className="w-full"
          >
            {saving ? 'Criando...' : 'Criar turma'}
          </Button>
        </section>
      )}

      {/* Classes list grouped by day */}
      <div className="space-y-4">
        {DAYS.map((dayName, dayIndex) => {
          const dayClasses = classes.filter(
            (c) => Number(c.day_of_week) === dayIndex,
          );
          if (dayClasses.length === 0) return null;
          return (
            <div key={dayIndex}>
              <h3 className="text-xs font-semibold text-muted-foreground mb-1.5">
                {dayName}
              </h3>
              <div className="rounded-xl border divide-y divide-white/5">
                {dayClasses.map((c) => {
                  const id = String(c.id);
                  const title = String(c.title || '');
                  const modality = String(c.modality || '');
                  const startTime = String(c.start_time || '').slice(0, 5);
                  const endTime = String(c.end_time || '').slice(0, 5);
                  const maxCap = Number(c.max_capacity) || 20;
                  const instructor = String(c.instructor_name || '');
                  const location = String(c.location_detail || '');

                  return (
                    <div
                      key={id}
                      className="p-3 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground">
                          {startTime}-{endTime} &middot;{' '}
                          {MODALITY_LABELS[modality] || modality} &middot;{' '}
                          {maxCap} vagas
                          {instructor && ` · ${instructor}`}
                          {location && ` · ${location}`}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {classes.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma turma cadastrada. Clique em &quot;Nova turma&quot; para
            começar.
          </p>
        )}
      </div>
    </main>
  );
}
