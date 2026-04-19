'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, CheckCircle2, Circle, ChevronRight, Star } from 'lucide-react';
import {
  SKILL_CATEGORY_LABELS,
  SKILL_CATEGORY_EMOJI,
  SKILL_STATUS_LABELS,
  statusColor,
  masteryProgressPct,
  masteryLabel,
  unlockLabel,
} from '@myfitlife/core/skills';

type SkillNode = {
  key: string;
  name_pt: string;
  category: string;
  tier: number;
  order_in_tier: number;
  description_pt: string | null;
  prereq_keys: string[];
  mastery_criteria: Record<string, number>;
  xp_on_mastery: number;
  unlock_criteria: Record<string, number>;
  user_skill: {
    status: 'locked' | 'available' | 'in_progress' | 'mastered';
    progress: Record<string, number>;
    mastered_at?: string;
    first_practice_at?: string;
  };
};

type Summary = {
  total: number;
  mastered: number;
  in_progress: number;
  available: number;
  locked: number;
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selected, setSelected] = useState<SkillNode | null>(null);

  async function load() {
    const res = await fetch('/api/skills');
    const data = await res.json();
    setSkills(data.skills || []);
    setSummary(data.summary || null);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const categories = ['all', ...Array.from(new Set(skills.map((s) => s.category)))];

  const filtered = selectedCategory === 'all'
    ? skills
    : skills.filter((s) => s.category === selectedCategory);

  const byTier = filtered.reduce<Record<number, SkillNode[]>>((acc, s) => {
    if (!acc[s.tier]) acc[s.tier] = [];
    acc[s.tier].push(s);
    return acc;
  }, {});

  const tiers = Object.keys(byTier).map(Number).sort((a, b) => a - b);

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Árvore de Habilidades</h1>
        <p className="text-muted-foreground text-sm">Progrida e domine movimentos</p>
      </header>

      {summary && (
        <Card className="mb-4 p-4">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.mastered}</div>
              <div className="text-xs text-muted-foreground">Dominados</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{summary.in_progress}</div>
              <div className="text-xs text-muted-foreground">Em progresso</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{summary.available}</div>
              <div className="text-xs text-muted-foreground">Disponíveis</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-400">{summary.locked}</div>
              <div className="text-xs text-muted-foreground">Bloqueados</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Progresso geral</span>
              <span>{summary.mastered}/{summary.total}</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
              <div className="h-full bg-primary transition-all" style={{ width: `${summary.total > 0 ? Math.round((summary.mastered / summary.total) * 100) : 0}%` }} />
            </div>
          </div>
        </Card>
      )}

      {/* Category filter */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat === 'all' ? 'Todos' : `${SKILL_CATEGORY_EMOJI[cat] ?? ''} ${SKILL_CATEGORY_LABELS[cat] ?? cat}`}
          </button>
        ))}
      </div>

      {/* Skill tree by tier */}
      <div className="space-y-6">
        {tiers.map((tier) => (
          <div key={tier}>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {tier}
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {tier === 1 ? 'Iniciante' : tier === 2 ? 'Intermediário' : tier === 3 ? 'Avançado' : `Tier ${tier}`}
              </span>
              <div className="flex-1 border-t border-dashed border-muted" />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {byTier[tier].map((skill) => (
                <SkillCard key={skill.key} skill={skill} onClick={() => setSelected(skill)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <SkillModal
          skill={selected}
          allSkills={skills}
          onClose={() => setSelected(null)}
          onPracticed={() => { load(); setSelected(null); }}
        />
      )}
    </main>
  );
}

function SkillCard({ skill, onClick }: { skill: SkillNode; onClick: () => void }) {
  const { status, progress } = skill.user_skill;
  const pct = masteryProgressPct(skill.mastery_criteria, progress);
  const isLocked = status === 'locked';

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${isLocked ? 'opacity-50' : ''}`}
    >
      <div className="mt-0.5 flex-shrink-0">
        {status === 'mastered' ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : isLocked ? (
          <Lock className="h-5 w-5 text-slate-400" />
        ) : status === 'in_progress' ? (
          <Circle className="h-5 w-5 text-amber-500" />
        ) : (
          <Circle className="h-5 w-5 text-blue-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{skill.name_pt}</span>
          <div className="flex flex-shrink-0 items-center gap-1 text-xs text-amber-600">
            <Star className="h-3 w-3 fill-current" />
            <span>{skill.xp_on_mastery}</span>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className={`inline-flex items-center rounded border px-1 py-0 text-[10px] font-medium ${statusColor(status)}`}>
            {SKILL_STATUS_LABELS[status] ?? status}
          </span>
          {!isLocked && Object.keys(skill.mastery_criteria).length > 0 && (
            <span className="text-[10px] text-muted-foreground">{pct}%</span>
          )}
        </div>
        {!isLocked && status !== 'mastered' && Object.keys(skill.mastery_criteria).length > 0 && (
          <div className="mt-1.5 h-1 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
    </button>
  );
}

function SkillModal({
  skill,
  allSkills,
  onClose,
  onPracticed,
}: {
  skill: SkillNode;
  allSkills: SkillNode[];
  onClose: () => void;
  onPracticed: () => void;
}) {
  const [practicing, setPracticing] = useState(false);
  const { status, progress } = skill.user_skill;
  const pct = masteryProgressPct(skill.mastery_criteria, progress);
  const isLocked = status === 'locked';

  const prereqs = (skill.prereq_keys || []).map(
    (k) => allSkills.find((s) => s.key === k)
  ).filter(Boolean) as SkillNode[];

  async function practice() {
    setPracticing(true);
    try {
      const res = await fetch(`/api/skills/${skill.key}/practice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ increment: { sessions_practiced: 1 } }),
      });
      const data = await res.json();
      if (data.just_mastered) {
        alert(`Parabéns! Você dominou "${skill.name_pt}" e ganhou ${data.xp_awarded} XP!`);
      }
      onPracticed();
    } finally {
      setPracticing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-background p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{skill.name_pt}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${statusColor(status)}`}>
                {SKILL_STATUS_LABELS[status] ?? status}
              </span>
              <span className="text-xs text-muted-foreground">
                {SKILL_CATEGORY_EMOJI[skill.category]} {SKILL_CATEGORY_LABELS[skill.category] ?? skill.category}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {skill.description_pt && (
          <p className="mb-4 text-sm text-muted-foreground">{skill.description_pt}</p>
        )}

        {/* Mastery criteria */}
        {Object.keys(skill.mastery_criteria).length > 0 && (
          <div className="mb-4">
            <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Meta de maestria</p>
            <p className="text-sm">{masteryLabel(skill.mastery_criteria)}</p>
            {!isLocked && (
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* XP reward */}
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950">
          <Star className="h-4 w-4 text-amber-500 fill-current" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {skill.xp_on_mastery} XP ao dominar
          </span>
        </div>

        {/* Prerequisites */}
        {prereqs.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Pré-requisitos</p>
            <div className="space-y-1">
              {prereqs.map((p) => (
                <div key={p.key} className="flex items-center gap-2 text-sm">
                  {p.user_skill.status === 'mastered' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-400" />
                  )}
                  <span className={p.user_skill.status === 'mastered' ? 'line-through text-muted-foreground' : ''}>
                    {p.name_pt}
                  </span>
                </div>
              ))}
            </div>
            {isLocked && (
              <p className="mt-2 text-xs text-muted-foreground">{unlockLabel(skill.unlock_criteria)}</p>
            )}
          </div>
        )}

        {/* Progress stats */}
        {!isLocked && progress && Object.keys(progress).length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Progresso atual</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(progress).map(([k, v]) => (
                <div key={k} className="rounded bg-muted px-2 py-1">
                  <div className="text-xs text-muted-foreground">{k.replace(/_/g, ' ')}</div>
                  <div className="text-sm font-medium">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Fechar
          </Button>
          {!isLocked && status !== 'mastered' && (
            <Button className="flex-1" onClick={practice} disabled={practicing}>
              {practicing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Registrar prática
            </Button>
          )}
          {status === 'mastered' && (
            <div className="flex flex-1 items-center justify-center gap-1 text-green-600 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Dominado!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
