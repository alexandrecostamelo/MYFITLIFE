import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: prof } = await supabase.from('professionals').select('id').eq('user_id', user.id).single();
  if (!prof) return NextResponse.json({ error: 'not_professional' }, { status: 403 });

  const { error } = await supabase
    .from('professional_availability')
    .delete()
    .eq('id', id)
    .eq('professional_id', prof.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
