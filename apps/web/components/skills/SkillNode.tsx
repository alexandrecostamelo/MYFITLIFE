'use client';

import { Handle, Position } from '@xyflow/react';
import { Lock, Unlock, TrendingUp, Trophy } from 'lucide-react';

export type SkillStatus = 'locked' | 'available' | 'in_progress' | 'mastered';

export interface SkillNodeData {
  name: string;
  tier: number;
  status: SkillStatus;
  progress: number; // 0-100
  category: string;
  onClick: () => void;
  [key: string]: unknown; // satisfies ReactFlow NodeData constraint
}

const STYLES: Record<SkillStatus, { bg: string; border: string; text: string; Icon: React.ElementType }> = {
  locked: {
    bg: 'bg-muted',
    border: 'border-muted-foreground/30',
    text: 'text-muted-foreground',
    Icon: Lock,
  },
  available: {
    bg: 'bg-card',
    border: 'border-primary/50',
    text: 'text-foreground',
    Icon: Unlock,
  },
  in_progress: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    Icon: TrendingUp,
  },
  mastered: {
    bg: 'bg-green-500/10 dark:bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-700 dark:text-green-300',
    Icon: Trophy,
  },
};

export function SkillNode({ data }: { data: SkillNodeData }) {
  const style = STYLES[data.status];
  const { Icon } = style;

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground/50" />
      <button
        onClick={data.onClick}
        className={`
          h-[80px] w-[180px] cursor-pointer rounded-xl border-2 px-3 py-2
          flex flex-col items-start justify-center gap-1
          transition-all hover:scale-105 hover:shadow-lg
          ${style.bg} ${style.border} ${style.text}
          ${data.status === 'locked' ? 'opacity-60' : ''}
        `}
        aria-label={`${data.name}, tier ${data.tier}, ${data.status}`}
      >
        <div className="flex w-full items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
            Tier {data.tier}
          </span>
        </div>
        <p className="line-clamp-2 w-full text-left text-sm font-semibold leading-tight">
          {data.name}
        </p>
        {data.status === 'in_progress' && (
          <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-blue-500/20">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(100, data.progress)}%` }}
            />
          </div>
        )}
      </button>
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground/50" />
    </div>
  );
}
