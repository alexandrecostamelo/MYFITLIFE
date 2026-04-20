'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: 'treino', label: 'Treino' },
  { value: 'esporte', label: 'Esporte' },
  { value: 'nutrição', label: 'Nutrição' },
  { value: 'bem-estar', label: 'Bem-estar' },
  { value: 'saúde', label: 'Saúde' },
  { value: 'comunidade', label: 'Comunidade' },
];

const EMOJIS = ['💪', '🏃', '🧘', '🥗', '🏋️', '⚡', '🎯', '🔥', '🌟', '🏆', '🧠', '❤️'];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('treino');
  const [emoji, setEmoji] = useState('💪');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    setSlug(slugify(value));
  }

  async function submit() {
    if (!name.trim() || !slug.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    setSaving(true);
    setError(null);

    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
        cover_emoji: emoji,
        category,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      if (data.error === 'slug_taken') {
        setError('Já existe um grupo com este slug. Tente outro nome.');
      } else {
        setError(data.error || 'Erro ao criar grupo');
      }
      return;
    }

    router.push('/app/community/groups');
  }

  return (
    <main className="mx-auto max-w-lg p-4 pb-24">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/community/groups" className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Criar grupo</h1>
      </header>

      <Card className="space-y-4 p-4">
        <div>
          <Label>Nome do grupo</Label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Treino de Força"
            maxLength={80}
            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="mt-1 text-xs text-muted-foreground">Slug: {slug || '...'}</p>
        </div>

        <div>
          <Label>Descrição (opcional)</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Sobre o que é este grupo?"
            rows={3}
            maxLength={500}
            className="mt-1 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <Label>Categoria</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Emoji</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`rounded-lg p-2 text-xl transition ${
                  emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <p className="mt-3 text-xs text-muted-foreground">
        Grupos criados por usuários precisam de aprovação de um administrador antes de ficarem visíveis para todos.
      </p>

      <Button onClick={submit} disabled={saving || !name.trim()} className="mt-4 w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar grupo (aguardar aprovação)'}
      </Button>
    </main>
  );
}
