import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { enabled } = await req.json();

  await supabase
    .from('profiles')
    .update({
      health_sync_enabled: !!enabled,
      health_source: enabled ? 'auto' : null,
    } as Record<string, unknown>)
    .eq('id', user.id);

  return NextResponse.json({ ok: true });
}
