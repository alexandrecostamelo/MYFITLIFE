'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check, Trash2, Loader2, Plus } from 'lucide-react';

type Item = {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  notes?: string;
  checked: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  hortifruti: 'Hortifruti',
  acougue: 'Açougue',
  'açougue': 'Açougue',
  peixaria: 'Peixaria',
  laticinios: 'Laticínios',
  'laticínios': 'Laticínios',
  mercearia: 'Mercearia',
  padaria: 'Padaria',
  bebidas: 'Bebidas',
  congelados: 'Congelados',
  limpeza: 'Limpeza',
  outros: 'Outros',
};

export default function ShoppingListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [title, setTitle] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  async function load() {
    const res = await fetch(`/api/shopping-list/${id}`);
    const data = await res.json();
    if (data.list) {
      setTitle(data.list.title);
      setItems(data.list.items || []);
      setCompleted(data.list.completed);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function persist(newItems: Item[], newCompleted?: boolean) {
    setSaving(true);
    await fetch(`/api/shopping-list/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: newItems,
        ...(newCompleted !== undefined ? { completed: newCompleted } : {}),
      }),
    });
    setSaving(false);
  }

  function toggleItem(index: number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], checked: !newItems[index].checked };
    setItems(newItems);
    persist(newItems);
  }

  function removeItem(index: number) {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    persist(newItems);
  }

  function addManual() {
    if (!newItemName.trim()) return;
    const newItems = [...items, {
      name: newItemName.trim(),
      quantity: 1,
      unit: 'unid',
      category: 'outros',
      checked: false,
    }];
    setItems(newItems);
    setNewItemName('');
    persist(newItems);
  }

  async function toggleComplete() {
    const newCompleted = !completed;
    setCompleted(newCompleted);
    await persist(items, newCompleted);
  }

  async function deleteList() {
    if (!confirm('Excluir esta lista?')) return;
    await fetch(`/api/shopping-list/${id}`, { method: 'DELETE' });
    router.push('/app/shopping-list');
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const grouped: Record<string, Array<{ item: Item; index: number }>> = {};
  items.forEach((item, index) => {
    const cat = item.category.toLowerCase();
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ item, index });
  });

  const totalItems = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/shopping-list" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-xs text-muted-foreground">{checkedCount}/{totalItems} itens · {progress}%</p>
        </div>
      </header>

      <Card className="mb-4 p-3">
        <div className="h-2 overflow-hidden rounded bg-slate-200">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      <Card className="mb-4 p-3">
        <div className="flex gap-2">
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Adicionar item manualmente"
            onKeyDown={(e) => e.key === 'Enter' && addManual()}
          />
          <Button onClick={addManual} disabled={!newItemName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {Object.entries(grouped).map(([cat, entries]) => (
          <Card key={cat} className="p-3">
            <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              {CATEGORY_LABELS[cat] || cat}
            </h3>
            <div className="space-y-1">
              {entries.map(({ item, index }) => (
                <div
                  key={index}
                  className={`flex items-center justify-between gap-2 rounded p-2 transition-colors ${
                    item.checked ? 'bg-slate-100 opacity-60' : 'hover:bg-slate-50'
                  }`}
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                      item.checked ? 'border-primary bg-primary' : 'border-slate-300'
                    }`}>
                      {item.checked && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm ${item.checked ? 'line-through' : ''}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.quantity} {item.unit}
                        {item.notes && ` · ${item.notes}`}
                      </div>
                    </div>
                  </button>
                  <button onClick={() => removeItem(index)} className="p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant={completed ? 'outline' : 'default'}
          onClick={toggleComplete}
          disabled={saving}
          className="flex-1"
        >
          {completed ? 'Marcar como pendente' : 'Marcar concluída'}
        </Button>
        <Button variant="outline" onClick={deleteList}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}
