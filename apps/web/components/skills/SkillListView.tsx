'use client';

import { Lock, TrendingUp, Trophy, Unlock, ChevronRight, Star } from 'lucide-react';
import {
  SKILL_CATEGORY_EMOJI,
  SKILL_STATUS_LABELS,
  statusColor,
  masteryProgressPct,
} from '@myfitlife/core/skills';
import type { SkillNodeShape } from './SkillGraph';

interface Props {
  skills: SkillNodeShape[];
  onSelect: (skill: SkillNodeShape) => void;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'mastered')    return <Trophy className="h-5 w-5 text-green-500" />;
  if (status === 'in_progress') return <TrendingUp className="h-5 w-5 text-blue-500" />;
  if (status === 'available')   return <Unlock className="h-5 w-5 text-primary" />;
  return <Lock className="h-5 w-5 text-slate-400" />;
}

export function SkillListView({ skills, onSelect }: Props) {
  const byTier = skills.reduce<Record<number, SkillNodeShape[]>>((acc, s) => {
    (acc[s.tier] ??= []).push(s);
    return acc;
  }, {});
  const tiers = Object.keys(byTier).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {tiers.map((tier) => (
        <section key={tier}>
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
            {byTier[tier].map((s) => {
              const { status, progress } = s.user_skill;
              const pct = masteryProgressPct(s.mastery_criteria, progress);
              const isLocked = status === 'locked';
              return (
                <button
                  key={s.key}
                  onClick={() => onSelect(s)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${isLocked ? 'opacity-50' : ''}`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <StatusIcon status={status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{s.name_pt}</span>
                      <div className="flex flex-shrink-0 items-center gap-1 text-xs text-amber-600">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{s.xp_on_mastery}</span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`inline-flex items-center rounded border px-1 py-0 text-[10px] font-medium ${statusColor(status)}`}>
                        {SKILL_STATUS_LABELS[status] ?? status}
                      </span>
                      {!isLocked && Object.keys(s.mastery_criteria).length > 0 && (
                        <span className="text-[10px] text-muted-foreground">{pct}%</span>
                      )}
                      {s.category && (
                        <span className="text-[10px] text-muted-foreground">
                          {SKILL_CATEGORY_EMOJI[s.category]}
                        </span>
                      )}
                    </div>
                    {!isLocked && status !== 'mastered' && Object.keys(s.mastery_criteria).length > 0 && (
                      <div className="mt-1.5 h-1 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
                        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
