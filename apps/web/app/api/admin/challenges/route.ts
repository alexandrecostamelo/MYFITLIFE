import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';

const createSchema = z.object({
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(120),
  description: z.string().max(1000).optional(),
  category: z.enum(['strength', 'cardio', 'consistency', 'nutrition', 'flexibility', 'mindset']),
  challenge_type: z.enum(['daily_reps', 'total_reps', 'daily_streak', 'accumulated_minutes', 'photo_habit']),
  target_value: z.number().int().positive(),
  target_unit: z.string().max(40),
  exercise_hint: z.string().max(120).optional(),
  duration_days: z.number().int().min(1).max(365),
  enrollment_end: z.string().optional(),
  start_date: z.string(),
  end_date: z.string(),
  featured: z.boolean().default(false),
  cover_emoji: z.string().max(10).default('🏆'),
  xp_on_complete: z.number().int().min(0).default(500),
  max_participants: z.number().int().positive().optional(),
  status: z.enum(['draft', 'enrollment', 'active', 'completed', 'cancelled']).default('enrollment'),
  rules: z.string().max(2000).optional(),
  tips: z.array(z.string().max(200)).max(10).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(supabase, user.id))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data } = await supabase
    .from('community_challenges')
    .select('*')
    .order('created_at', { ascending: false });
  return NextResponse.json({ challenges: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(supabase, user.id))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 });

  const { data, error } = await supabase
    .from('community_challenges')
    .insert({ ...parsed.data, created_by: user.id })
    .select('id, slug')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, slug: data.slug });
}
