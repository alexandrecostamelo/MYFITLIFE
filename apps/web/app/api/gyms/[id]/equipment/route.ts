import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

const addSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().optional(),
  primary_muscles: z.array(z.string()).optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  recognition_id: z.string().uuid().optional(),
  added_manually: z.boolean().optional(),
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = addSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data: gym } = await supabase.from('user_gyms').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!gym) return NextResponse.json({ error: 'gym_not_found' }, { status: 404 });

  const nameNormalized = normalize(parsed.data.name);

  const { data, error } = await supabase
    .from('gym_equipment')
    .upsert({
      gym_id: id,
      user_id: user.id,
      name: parsed.data.name,
      name_normalized: nameNormalized,
      category: parsed.data.category,
      primary_muscles: parsed.data.primary_muscles,
      confidence: parsed.data.confidence ?? (parsed.data.added_manually ? 'high' : 'medium'),
      recognition_id: parsed.data.recognition_id,
      added_manually: parsed.data.added_manually ?? false,
    }, { onConflict: 'gym_id,name_normalized' })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
