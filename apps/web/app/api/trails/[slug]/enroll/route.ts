import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: trail } = await supabase.from('trails').select('id').eq('slug', slug).single();
  if (!trail) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { error } = await supabase
    .from('user_trails')
    .upsert({
      user_id: user.id,
      trail_id: trail.id,
      current_day: 1,
      days_completed: [],
      started_at: new Date().toISOString(),
      completed_at: null,
      abandoned: false,
    }, { onConflict: 'user_id,trail_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
