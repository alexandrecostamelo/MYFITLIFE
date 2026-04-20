import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Use service role to update (RLS only allows SELECT for user)
  const { createClient: createAdmin } = await import('@supabase/supabase-js');
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  await admin
    .from('wearable_connections')
    .update({ is_active: false, updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('user_id', user.id)
    .eq('provider', providerId);

  return NextResponse.json({ ok: true });
}
