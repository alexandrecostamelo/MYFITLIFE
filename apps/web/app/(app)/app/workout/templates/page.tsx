'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OBJECTIVE_LABELS, DIFFICULTY_LABELS } from '@myfitlife/core/workout-sharing';
import { ArrowLeft, Loader2, Plus, Globe, Lock, Copy, Dumbbell } from 'lucide-react';

export default function WorkoutTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch('/api/workout-templates');
    const d = await res.json();
    setTemplates(d.templates || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch('/api/workout-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const d = await res.json();
    setCreating(false);
    if (res.ok) {
      setNewName('');
      setShowForm(false);
      await load();
    } else {
      alert(d.error || 'Erro ao criar');
    }
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Meus treinos</h1>
        <div className="ml-auto flex gap-2">
          <Link href="/app/discover/workouts">
            <Button variant="outline" size="sm">Descobrir</Button>
          </Link>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="mr-1 h-3 w-3" /> Novo
          </Button>
        </div>
      </header>

      {showForm && (
        <Card className="mb-4 p-4">
          <h2 className="mb-2 text-sm font-medium">Novo template</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do treino"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
            />
            <Button onClick={create} disabled={creating || !newName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
            </Button>
          </div>
        </Card>
      )}

      {templates.length === 0 ? (
        <Card className="p-6 text-center">
          <Dumbbell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum template ainda.</p>
          <Button size="sm" className="mt-3" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-3 w-3" /> Criar primeiro template
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <Link key={t.id} href={`/app/workout/templates/${t.id}`}>
              <Card className="p-4 transition-colors hover:bg-muted">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {t.is_public
                        ? <Globe className="h-3 w-3 flex-shrink-0 text-primary" />
                        : <Lock className="h-3 w-3 flex-shrink-0 text-muted-foreground" />}
                      <span className="truncate text-sm font-medium">{t.name}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {t.objective && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{OBJECTIVE_LABELS[t.objective]}</span>
                      )}
                      {t.difficulty && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{DIFFICULTY_LABELS[t.difficulty]}</span>
                      )}
                    </div>
                  </div>
                  {t.copy_count > 0 && (
                    <span className="flex flex-shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Copy className="h-3 w-3" /> {t.copy_count}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
