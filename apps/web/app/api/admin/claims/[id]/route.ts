import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const isAdmin = await isPlatformAdmin(supabase, user.id);
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const { action, admin_notes } = body;
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  }

  const status = action === 'approve' ? 'approved' : 'rejected';

  // Fetch claim to get gym_place_id and user_id
  const { data: claim } = await supabase
    .from('gym_claims')
    .select('*')
    .eq('id', id)
    .single();

  if (!claim) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { error: updateError } = await supabase
    .from('gym_claims')
    .update({
      status,
      admin_notes: admin_notes ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  if (action === 'approve') {
    await Promise.all([
      supabase
        .from('gym_places')
        .update({ claimed_by: claim.user_id, verified: true })
        .eq('id', claim.gym_place_id),
      supabase
        .from('profiles')
        .update({ role: 'gym_admin' })
        .eq('id', claim.user_id),
    ]);
  }

  return NextResponse.json({ ok: true });
}
