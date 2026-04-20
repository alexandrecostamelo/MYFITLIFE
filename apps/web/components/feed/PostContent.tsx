'use client';

import { Dumbbell, Trophy, Flame, Medal, Target, MapPin, Calendar, Heart } from 'lucide-react';

interface Props {
  type: string;
  content: string | null;
  metadata: Record<string, any>;
  isMilestone: boolean;
}

export function PostContent({ type, content, metadata, isMilestone }: Props) {
  const meta = metadata || {};

  if (type === 'manual') {
    return <p className="text-sm whitespace-pre-wrap break-words">{content}</p>;
  }

  const auto = (() => {
    switch (type) {
      case 'workout_completed':
        return {
          Icon: Dumbbell,
          title: `Treino concluído — ${meta.workout_name || 'Sem nome'}`,
          details: [
            meta.duration_min && `${meta.duration_min} min`,
            meta.exercises && `${meta.exercises} exercícios`,
            meta.total_volume_kg && `${Math.round(meta.total_volume_kg)}kg volume`,
          ].filter(Boolean).join(' · '),
        };
      case 'skill_mastered':
        return {
          Icon: Trophy,
          title: `Dominou: ${meta.skill_name}`,
          details: `Tier ${meta.skill_tier} · +${meta.xp_gained} XP`,
        };
      case 'personal_record':
        return {
          Icon: Medal,
          title: `Novo PR em ${meta.exercise}!`,
          details: `${meta.value}${meta.unit}${meta.previous_value ? ` (antes: ${meta.previous_value}${meta.unit})` : ''}`,
        };
      case 'streak_milestone':
        return {
          Icon: Flame,
          title: `${meta.streak_days} dias de sequência!`,
          details: 'Consistência imbatível',
        };
      case 'achievement_unlocked':
        return {
          Icon: Trophy,
          title: `Conquista: ${meta.achievement_name}`,
          details: null,
        };
      case 'trail_completed':
        return {
          Icon: Target,
          title: `Concluiu a trilha ${meta.trail_name}`,
          details: `${meta.duration_days} dias`,
        };
      case 'transformation_published':
        return {
          Icon: Heart,
          title: 'Publicou uma transformação',
          details: meta.caption || null,
        };
      case 'check_in':
        return {
          Icon: MapPin,
          title: meta.gym_name ? `Check-in em ${meta.gym_name}` : 'Check-in feito',
          details: null,
        };
      case 'joined_challenge':
        return {
          Icon: Calendar,
          title: `Entrou no desafio ${meta.challenge_name}`,
          details: null,
        };
      default:
        return { Icon: Dumbbell, title: 'Atividade', details: null };
    }
  })();

  const Icon = auto.Icon;

  return (
    <div className={`
      rounded-lg p-3 flex items-start gap-3
      ${isMilestone
        ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30'
        : 'bg-muted/40'}
    `}>
      <div className={`
        rounded-full p-2 flex-shrink-0
        ${isMilestone ? 'bg-amber-500 text-white' : 'bg-primary/10 text-primary'}
      `}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm flex items-center gap-1">
          {auto.title}
          {isMilestone && <span className="text-xs" title="Marco importante">✨</span>}
        </p>
        {auto.details && (
          <p className="text-xs text-muted-foreground mt-0.5">{auto.details}</p>
        )}
        {content && (
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">{content}</p>
        )}
      </div>
    </div>
  );
}
