import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { tooltip_id } = await req.json();
  if (!tooltip_id || typeof tooltip_id !== 'string') {
    return NextResponse.json({ error: 'invalid tooltip_id' }, { status: 400 });
  }

  await supabase
    .from('user_help_seen')
    .upsert(
      { user_id: user.id, tooltip_id, seen_at: new Date().toISOString() } as Record<string, unknown>,
      { onConflict: 'user_id,tooltip_id' },
    );

  return NextResponse.json({ ok: true });
}
