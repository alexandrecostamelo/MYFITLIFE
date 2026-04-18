import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: gyms } = await supabase
    .from('user_gyms')
    .select('id, name, city, state, is_primary, created_at')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  const gymIds = (gyms || []).map((g: any) => g.id);
  let counts: Record<string, number> = {};
  if (gymIds.length > 0) {
    const { data: eq } = await supabase
      .from('gym_equipment')
      .select('gym_id')
      .in('gym_id', gymIds);
    counts = (eq || []).reduce((acc: any, e: any) => {
      acc[e.gym_id] = (acc[e.gym_id] || 0) + 1;
      return acc;
    }, {});
  }

  return NextResponse.json({
    gyms: (gyms || []).map((g: any) => ({ ...g, equipment_count: counts[g.id] || 0 })),
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { count } = await supabase
    .from('user_gyms')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const isPrimary = (count ?? 0) === 0;

  const { data, error } = await supabase
    .from('user_gyms')
    .insert({ ...parsed.data, user_id: user.id, is_primary: isPrimary })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
