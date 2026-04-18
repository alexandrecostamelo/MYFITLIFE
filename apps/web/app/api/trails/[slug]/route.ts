import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: trail } = await supabase
    .from('trails')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!trail) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: userTrail } = await supabase
    .from('user_trails')
    .select('*')
    .eq('user_id', user.id)
    .eq('trail_id', trail.id)
    .maybeSingle();

  return NextResponse.json({ trail, user_trail: userTrail });
}
