import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string; eqId: string }> }) {
  const { id, eqId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('gym_equipment')
    .delete()
    .eq('id', eqId)
    .eq('gym_id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
