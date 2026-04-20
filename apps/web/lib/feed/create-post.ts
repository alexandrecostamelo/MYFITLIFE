import { createClient } from '@supabase/supabase-js';

type PostType =
  | 'manual'
  | 'workout_completed'
  | 'skill_mastered'
  | 'trail_completed'
  | 'personal_record'
  | 'streak_milestone'
  | 'achievement_unlocked'
  | 'transformation_published'
  | 'check_in'
  | 'joined_challenge';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface FeedPostInput {
  userId: string;
  type: PostType;
  content?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  isMilestone?: boolean;
}

export async function createFeedPost(input: FeedPostInput): Promise<string | null> {
  const supabase = admin();
  const { data, error } = await supabase
    .from('feed_posts')
    .insert({
      user_id: input.userId,
      type: input.type,
      content: input.content || null,
      image_url: input.imageUrl || null,
      metadata: input.metadata || {},
      is_milestone: input.isMilestone || false,
    } as Record<string, unknown>)
    .select('id')
    .single();

  if (error) {
    console.error('createFeedPost failed:', error);
    return null;
  }
  return data.id;
}

export async function postWorkoutCompleted(
  userId: string,
  workoutName: string,
  durationMin: number,
  exercises: number,
  totalVolume?: number
): Promise<string | null> {
  return createFeedPost({
    userId,
    type: 'workout_completed',
    metadata: {
      workout_name: workoutName,
      duration_min: durationMin,
      exercises,
      total_volume_kg: totalVolume,
    },
  });
}

export async function postSkillMastered(
  userId: string,
  skillName: string,
  skillTier: number,
  xpGained: number
): Promise<string | null> {
  return createFeedPost({
    userId,
    type: 'skill_mastered',
    metadata: { skill_name: skillName, skill_tier: skillTier, xp_gained: xpGained },
    isMilestone: skillTier >= 4,
  });
}

export async function postPersonalRecord(
  userId: string,
  exercise: string,
  value: number,
  unit: string,
  previousValue?: number
): Promise<string | null> {
  return createFeedPost({
    userId,
    type: 'personal_record',
    metadata: { exercise, value, unit, previous_value: previousValue },
    isMilestone: true,
  });
}

export async function postStreakMilestone(
  userId: string,
  streakDays: number
): Promise<string | null> {
  return createFeedPost({
    userId,
    type: 'streak_milestone',
    metadata: { streak_days: streakDays },
    isMilestone: streakDays >= 30,
  });
}

export async function postAchievementUnlocked(
  userId: string,
  achievementName: string,
  achievementIcon?: string
): Promise<string | null> {
  return createFeedPost({
    userId,
    type: 'achievement_unlocked',
    metadata: { achievement_name: achievementName, icon: achievementIcon },
  });
}

export async function postTrailCompleted(
  userId: string,
  trailName: string,
  durationDays: number
): Promise<string | null> {
  return createFeedPost({
    userId,
    type: 'trail_completed',
    metadata: { trail_name: trailName, duration_days: durationDays },
    isMilestone: true,
  });
}
