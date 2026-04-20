import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: pools } = await admin
    .from('premium_pools')
    .select('*')
    .order('created_at', { ascending: false });

  // Enrich with professional info
  const profIds = [...new Set((pools || []).map((p: Record<string, unknown>) => p.professional_id as string))];
  const { data: profs } = profIds.length
    ? await admin.from('professionals').select('user_id, full_name, council_type, specialties').in('user_id', profIds)
    : { data: [] };

  const profMap = new Map((profs || []).map((p: Record<string, unknown>) => [p.user_id as string, p]));

  const enriched = (pools || []).map((p: Record<string, unknown>) => ({
    ...p,
    professional: profMap.get(p.professional_id as string) || null,
  }));

  return NextResponse.json({ pools: enriched });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { professional_id, specialty, max_clients, rate_brl } = await req.json();
  if (!professional_id || !specialty) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await admin
    .from('premium_pools')
    .upsert(
      {
        professional_id,
        specialty,
        max_clients_per_month: max_clients || 20,
        rate_brl_per_session: rate_brl,
        is_active: true,
        approved_at: new Date().toISOString(),
      } as Record<string, unknown>,
      { onConflict: 'professional_id,specialty' },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pool: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { professional_id, specialty } = await req.json();

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  await admin
    .from('premium_pools')
    .update({ is_active: false } as Record<string, unknown>)
    .eq('professional_id', professional_id)
    .eq('specialty', specialty);

  return NextResponse.json({ ok: true });
}
