type AchievementSeed = {
  slug: string; title: string; description: string; icon: string;
  category: 'workout' | 'nutrition' | 'consistency' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp_reward: number; criteria: Record<string, unknown>;
};

export const achievements: AchievementSeed[] = [
  { slug: 'first-workout', title: 'Primeira série', description: 'Complete seu primeiro treino.', icon: '🏋️', category: 'workout', rarity: 'common', xp_reward: 30, criteria: { type: 'workouts_total', count: 1 } },
  { slug: 'workouts-10', title: 'Ritmo certo', description: 'Complete 10 treinos.', icon: '💪', category: 'workout', rarity: 'common', xp_reward: 50, criteria: { type: 'workouts_total', count: 10 } },
  { slug: 'workouts-50', title: 'Dedicado', description: 'Complete 50 treinos.', icon: '🔥', category: 'workout', rarity: 'rare', xp_reward: 150, criteria: { type: 'workouts_total', count: 50 } },
  { slug: 'workouts-100', title: 'Atleta', description: 'Complete 100 treinos.', icon: '🏆', category: 'workout', rarity: 'epic', xp_reward: 300, criteria: { type: 'workouts_total', count: 100 } },
  { slug: 'workouts-365', title: 'Lenda', description: 'Complete 365 treinos.', icon: '👑', category: 'workout', rarity: 'legendary', xp_reward: 1000, criteria: { type: 'workouts_total', count: 365 } },
  { slug: 'sets-100', title: 'Cem séries', description: 'Registre 100 séries.', icon: '📊', category: 'workout', rarity: 'common', xp_reward: 50, criteria: { type: 'sets_total', count: 100 } },
  { slug: 'sets-1000', title: 'Mil séries', description: 'Registre 1000 séries.', icon: '🎯', category: 'workout', rarity: 'epic', xp_reward: 300, criteria: { type: 'sets_total', count: 1000 } },
  { slug: 'streak-7', title: 'Uma semana viva', description: '7 dias consecutivos.', icon: '🔥', category: 'consistency', rarity: 'common', xp_reward: 50, criteria: { type: 'streak', count: 7 } },
  { slug: 'streak-30', title: 'Mês de fogo', description: '30 dias consecutivos.', icon: '🔥🔥', category: 'consistency', rarity: 'rare', xp_reward: 200, criteria: { type: 'streak', count: 30 } },
  { slug: 'streak-100', title: 'Inquebrável', description: '100 dias consecutivos.', icon: '⚡', category: 'consistency', rarity: 'epic', xp_reward: 500, criteria: { type: 'streak', count: 100 } },
  { slug: 'streak-365', title: 'Um ano inteiro', description: '365 dias consecutivos.', icon: '🌟', category: 'consistency', rarity: 'legendary', xp_reward: 2000, criteria: { type: 'streak', count: 365 } },
  { slug: 'first-meal', title: 'Primeira refeição', description: 'Registre sua primeira refeição.', icon: '🍽️', category: 'nutrition', rarity: 'common', xp_reward: 20, criteria: { type: 'meals_total', count: 1 } },
  { slug: 'meals-100', title: 'Cozinha conectada', description: 'Registre 100 refeições.', icon: '🥗', category: 'nutrition', rarity: 'common', xp_reward: 80, criteria: { type: 'meals_total', count: 100 } },
  { slug: 'meals-500', title: 'Mestre da nutrição', description: 'Registre 500 refeições.', icon: '👨‍🍳', category: 'nutrition', rarity: 'epic', xp_reward: 300, criteria: { type: 'meals_total', count: 500 } },
  { slug: 'meal-photo-first', title: 'Foto da comida', description: 'Use reconhecimento por foto.', icon: '📸', category: 'nutrition', rarity: 'common', xp_reward: 30, criteria: { type: 'photo_meals', count: 1 } },
  { slug: 'checkin-7', title: 'Boas escolhas', description: '7 check-ins matinais.', icon: '🌅', category: 'consistency', rarity: 'common', xp_reward: 50, criteria: { type: 'checkins_total', count: 7 } },
  { slug: 'checkin-30', title: 'Autoconhecimento', description: '30 check-ins matinais.', icon: '🧘', category: 'consistency', rarity: 'rare', xp_reward: 150, criteria: { type: 'checkins_total', count: 30 } },
  { slug: 'level-5', title: 'Nível 5', description: 'Alcance o nível 5.', icon: '⭐', category: 'milestone', rarity: 'common', xp_reward: 50, criteria: { type: 'level', count: 5 } },
  { slug: 'level-10', title: 'Nível 10', description: 'Alcance o nível 10.', icon: '🌟', category: 'milestone', rarity: 'rare', xp_reward: 100, criteria: { type: 'level', count: 10 } },
  { slug: 'level-25', title: 'Nível 25', description: 'Alcance o nível 25.', icon: '💫', category: 'milestone', rarity: 'epic', xp_reward: 250, criteria: { type: 'level', count: 25 } },
  { slug: 'level-50', title: 'Nível 50', description: 'Alcance o nível 50.', icon: '🎖️', category: 'milestone', rarity: 'legendary', xp_reward: 1000, criteria: { type: 'level', count: 50 } },
  { slug: 'weight-logs-10', title: 'Acompanhando', description: 'Registre peso 10 vezes.', icon: '⚖️', category: 'nutrition', rarity: 'common', xp_reward: 40, criteria: { type: 'weight_logs', count: 10 } },
  { slug: 'weight-lose-5kg', title: 'Menos 5kg', description: 'Perca 5kg do início.', icon: '📉', category: 'milestone', rarity: 'rare', xp_reward: 200, criteria: { type: 'weight_diff', value: -5 } },
  { slug: 'weight-gain-5kg', title: 'Mais 5kg de massa', description: 'Ganhe 5kg do início.', icon: '📈', category: 'milestone', rarity: 'rare', xp_reward: 200, criteria: { type: 'weight_diff', value: 5 } },
  { slug: 'trail-complete-first', title: 'Primeira trilha', description: 'Complete uma trilha guiada.', icon: '🎯', category: 'milestone', rarity: 'rare', xp_reward: 200, criteria: { type: 'trails_completed', count: 1 } },
  { slug: 'trail-complete-3', title: 'Trilheiro', description: 'Complete 3 trilhas.', icon: '🏅', category: 'milestone', rarity: 'epic', xp_reward: 500, criteria: { type: 'trails_completed', count: 3 } },
  { slug: 'equipment-scan-first', title: 'Câmera na academia', description: 'Identifique aparelho por foto.', icon: '📷', category: 'special', rarity: 'common', xp_reward: 30, criteria: { type: 'equipment_scans', count: 1 } },
  { slug: 'gym-first', title: 'Academia cadastrada', description: 'Cadastre uma academia.', icon: '🏢', category: 'special', rarity: 'common', xp_reward: 30, criteria: { type: 'gyms_total', count: 1 } },
  { slug: 'quest-complete-10', title: '10 missões', description: 'Complete 10 quests diárias.', icon: '✅', category: 'consistency', rarity: 'common', xp_reward: 50, criteria: { type: 'quests_completed', count: 10 } },
];
