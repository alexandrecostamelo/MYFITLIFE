'use client';

import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SkillNode, type SkillNodeData, type SkillStatus } from './SkillNode';
import { layoutSkillGraph } from '@/lib/skill-graph/layout';
import { masteryProgressPct } from '@myfitlife/core/skills';

export type SkillNodeShape = {
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
    status: SkillStatus;
    progress: Record<string, number>;
    mastered_at?: string;
    first_practice_at?: string;
  };
};

interface Props {
  skills: SkillNodeShape[];
  category: string;
  onSelect: (skill: SkillNodeShape) => void;
}

const nodeTypes = { skill: SkillNode };

export function SkillGraph({ skills, category, onSelect }: Props) {
  const filtered = useMemo(
    () => (category === 'all' ? skills : skills.filter((s) => s.category === category)),
    [skills, category]
  );

  const { nodes, edges } = useMemo(() => {
    const rawNodes: Node[] = filtered.map((s) => {
      const status = s.user_skill.status;
      const progress = masteryProgressPct(s.mastery_criteria, s.user_skill.progress);
      return {
        id: s.key,
        type: 'skill',
        position: { x: 0, y: 0 },
        data: {
          name: s.name_pt,
          tier: s.tier,
          status,
          progress,
          category: s.category,
          onClick: () => onSelect(s),
        } satisfies SkillNodeData,
      };
    });

    const keySet = new Set(filtered.map((s) => s.key));
    const rawEdges: Edge[] = [];
    for (const s of filtered) {
      for (const prereq of s.prereq_keys ?? []) {
        if (keySet.has(prereq)) {
          rawEdges.push({
            id: `${prereq}->${s.key}`,
            source: prereq,
            target: s.key,
            animated: s.user_skill.status === 'available',
            style: {
              stroke:
                s.user_skill.status === 'mastered'
                  ? 'rgb(34 197 94)'
                  : 'rgb(148 163 184)',
              strokeWidth: s.user_skill.status === 'mastered' ? 2 : 1,
            },
          });
        }
      }
    }

    return layoutSkillGraph(rawNodes, rawEdges, 'TB');
  }, [filtered, onSelect]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const skill = filtered.find((s) => s.key === node.id);
      if (skill) onSelect(skill);
    },
    [filtered, onSelect]
  );

  if (filtered.length === 0) {
    return (
      <div className="flex h-[500px] items-center justify-center text-muted-foreground">
        Nenhuma habilidade nessa categoria ainda.
      </div>
    );
  }

  return (
    <div className="h-[70vh] min-h-[500px] w-full overflow-hidden rounded-lg border bg-background/50">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} className="opacity-50" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => {
              const data = n.data as SkillNodeData;
              switch (data.status) {
                case 'mastered':    return 'rgb(34 197 94)';
                case 'in_progress': return 'rgb(59 130 246)';
                case 'available':   return 'rgb(148 163 184)';
                default:            return 'rgba(100 116 139 / 0.3)';
              }
            }}
            maskColor="rgba(0 0 0 / 0.1)"
            pannable
            zoomable
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
