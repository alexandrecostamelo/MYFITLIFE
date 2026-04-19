import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';

const schema = z.object({
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  category: z.enum(['strength', 'endurance', 'flexibility', 'nutrition', 'mindset', 'consistency', 'other']),
  challenge_type: z.enum(['reps', 'duration_sec', 'sessions', 'distance_m', 'custom']),
  target_value: z.number().int().positive(),
  target_unit: z.string().max(30),
  exercise_hint: z.string().max(120).optional(),
  duration_days: z.number().int().min(1).max(365),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  enrollment_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  enrollment_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cover_emoji: z.string().max(8).default('🏆'),
  xp_on_complete: z.number().int().min(0).default(100),
  min_participants: z.number().int().min(1).default(1),
  max_participants: z.number().int().positive().optional(),
  featured: z.boolean().default(false),
  rules: z.string().max(5000).optional(),
  tips: z.array(z.string().max(200)).max(20).default([]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;

  // Derive status from start_date
  const today = new Date().toISOString().slice(0, 10);
  let status = 'draft';
  if (d.start_date <= today) {
    status = 'active';
  } else if (d.enrollment_start && d.enrollment_start <= today) {
    status = 'enrollment';
  }

  const { data: challenge, error } = await supabase
    .from('community_challenges')
    .insert({
      slug: d.slug,
      title: d.title,
      description: d.description ?? null,
      category: d.category,
      challenge_type: d.challenge_type,
      target_value: d.target_value,
      target_unit: d.target_unit,
      exercise_hint: d.exercise_hint ?? null,
      duration_days: d.duration_days,
      start_date: d.start_date,
      end_date: d.end_date,
      enrollment_start: d.enrollment_start ?? null,
      enrollment_end: d.enrollment_end ?? null,
      cover_emoji: d.cover_emoji,
      xp_on_complete: d.xp_on_complete,
      min_participants: d.min_participants,
      max_participants: d.max_participants ?? null,
      featured: d.featured,
      rules: d.rules ?? null,
      tips: d.tips,
      status,
      created_by: user.id,
    })
    .select('id, slug')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ challenge }, { status: 201 });
}
