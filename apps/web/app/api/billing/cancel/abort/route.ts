import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { attempt_id } = await req.json();

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  await admin
    .from('cancellation_attempts')
    .update({
      final_status: 'retained',
      completed_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', attempt_id)
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}
