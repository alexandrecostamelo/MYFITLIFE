'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { MuscleGroupGrid } from '@/components/ui/muscle-group-grid';
import { Input } from '@/components/ui/input';
import { Search, Dumbbell } from 'lucide-react';

interface Props {
  exercises: Record<string, unknown>[];
  muscleGroups: { id: string; name: string; exerciseCount: number }[];
}

const LEVELS = [
  { id: 'all', label: 'Todos' },
  { id: 'beginner', label: 'Iniciante' },
  { id: 'intermediate', label: 'Intermediário' },
  { id: 'advanced', label: 'Avançado' },
];

function highlightMatch(text: string, query: string): ReactNode {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-accent font-semibold">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

export function ExerciseLibraryClient({ exercises, muscleGroups }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const name = String(ex.name_pt || '');
      if (search) {
        if (!name.toLowerCase().includes(search.toLowerCase())) return false;
      }
      if (selectedGroup) {
        const muscles = Array.isArray(ex.primary_muscles)
          ? (ex.primary_muscles as string[])
          : [];
        const normalized = muscles.map((m) =>
          m.toLowerCase().replace(/\s+/g, '_')
        );
        if (!normalized.includes(selectedGroup)) return false;
      }
      if (selectedLevel !== 'all') {
        const level = String(ex.level || 'beginner');
        if (level !== selectedLevel) return false;
      }
      return true;
    });
  }, [exercises, selectedGroup, selectedLevel, search]);

  return (
    <main className="mx-auto max-w-lg px-4 pt-4 pb-28 space-y-5">
      <h1 className="display-title">Exercícios</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar exercício..."
          className="pl-10"
        />
      </div>

      {/* Muscle group grid */}
      {!search && (
        <MuscleGroupGrid
          groups={muscleGroups}
          onSelect={(id) =>
            setSelectedGroup(selectedGroup === id ? null : id)
          }
          selected={selectedGroup || undefined}
        />
      )}

      {/* Level filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelectedLevel(l.id)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedLevel === l.id ? 'chip-active' : 'chip'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">
          {filtered.length} exercícios
        </p>
        {filtered.slice(0, 50).map((ex) => {
          const name = String(ex.name_pt || '');
          const thumbUrl = ex.thumbnail_url ? String(ex.thumbnail_url) : null;
          const level = String(ex.level || 'beginner');
          const equipment = Array.isArray(ex.equipment)
            ? (ex.equipment as string[]).join(', ')
            : '';
          const kcal = Number(ex.estimated_kcal_per_set) || 0;

          return (
            <div key={String(ex.id)} className="glass-card p-3 flex items-center gap-3">
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">
                  {search ? highlightMatch(name, search) : name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="chip text-[10px]">{level}</span>
                  {equipment && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {equipment}
                    </span>
                  )}
                </div>
              </div>
              {kcal > 0 && (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {kcal} kcal/set
                </span>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum exercício encontrado
          </p>
        )}
      </div>
    </main>
  );
}
