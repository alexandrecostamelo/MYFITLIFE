'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OBJECTIVE_LABELS, DIFFICULTY_LABELS } from '@myfitlife/core/workout-sharing';
import { ArrowLeft, Loader2, Globe, Lock, Plus, Trash2, Dumbbell, Copy } from 'lucide-react';

export default function WorkoutTemplatePage() {
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const res = await fetch(`/api/discover/workouts/${id}`);
    const d = await res.json();
    if (d.template) {
      setTemplate(d.template);
      setExercises(d.exercises || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function savePublishSettings(updates: Record<string, unknown>) {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/workout-templates/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await load();
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!template) return <div className="p-6 text-sm text-muted-foreground">Template não encontrado.</div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/workout/templates" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-xl font-bold">{template.name}</h1>
          {template.copy_count > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Copy className="h-3 w-3" /> copiado {template.copy_count} vezes
            </p>
          )}
        </div>
      </header>

      {/* Exercícios */}
      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-medium flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
          Exercícios ({exercises.length})
        </h2>
        {exercises.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhum exercício adicionado ainda. Use a API para adicionar exercícios a este template.
          </p>
        ) : (
          <div className="space-y-2">
            {exercises.map((e: any, idx: number) => (
              <div key={e.id} className="flex items-center gap-3 rounded border p-2">
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {e.exercise?.name_pt || 'Exercício'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {e.sets && e.reps ? `${e.sets} × ${e.reps}` : e.sets ? `${e.sets} séries` : ''}
                    {e.weight_kg ? ` · ${e.weight_kg}kg` : ''}
                    {e.rest_sec ? ` · ${e.rest_sec}s descanso` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Bloco de publicação */}
      <PublishBlock
        template={template}
        saving={saving}
        saved={saved}
        onSave={savePublishSettings}
      />
    </main>
  );
}

function PublishBlock({
  template,
  saving,
  saved,
  onSave,
}: {
  template: any;
  saving: boolean;
  saved: boolean;
  onSave: (updates: Record<string, unknown>) => void;
}) {
  const [isPublic, setIsPublic] = useState(template.is_public);
  const [desc, setDesc] = useState(template.public_description || '');
  const [objective, setObjective] = useState(template.objective || '');
  const [difficulty, setDifficulty] = useState(template.difficulty || '');

  function handleSave() {
    onSave({
      is_public: isPublic,
      public_description: desc || undefined,
      objective: objective || undefined,
      difficulty: difficulty || undefined,
    });
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        {isPublic
          ? <Globe className="h-5 w-5 text-primary" />
          : <Lock className="h-5 w-5 text-muted-foreground" />}
        <h3 className="font-medium text-sm">Compartilhar publicamente</h3>
      </div>

      <label className="mb-3 flex cursor-pointer items-center justify-between rounded border p-3">
        <div>
          <div className="text-sm font-medium">Deixar este treino público</div>
          <p className="text-xs text-muted-foreground">Outros usuários poderão ver e copiar.</p>
        </div>
        <div className="relative ml-3 flex-shrink-0">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary" />
          <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </div>
      </label>

      {isPublic && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Descrição pública</Label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Como funciona este treino? Para quem é indicado?"
              maxLength={500}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Objetivo</Label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
              >
                <option value="">--</option>
                {Object.entries(OBJECTIVE_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Nível</Label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
              >
                <option value="">--</option>
                {Object.entries(DIFFICULTY_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="mt-4 w-full" size="sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar configurações'}
      </Button>

      {saved && (
        <p className="mt-2 text-center text-xs text-green-600">Salvo!</p>
      )}

      {template.copy_count > 0 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Este treino foi copiado {template.copy_count} {template.copy_count === 1 ? 'vez' : 'vezes'}.
        </p>
      )}
    </Card>
  );
}
