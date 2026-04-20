import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { isPremium } from '@/lib/premium/quota';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if (!(await isPremium(user.id))) {
    return NextResponse.json({ error: 'not_premium' }, { status: 402 });
  }

  const { professional_id, specialty } = await req.json();
  if (!professional_id || !specialty) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // Check professional is in active pool
  const { data: pool } = await admin
    .from('premium_pools')
    .select('*')
    .eq('professional_id', professional_id)
    .eq('specialty', specialty)
    .eq('is_active', true)
    .maybeSingle();

  if (!pool) return NextResponse.json({ error: 'professional_not_available' }, { status: 404 });

  // Check existing assignment
  const { data: existing } = await admin
    .from('premium_assignments')
    .select('id, assigned_at, professional_id')
    .eq('user_id', user.id)
    .eq('specialty', specialty)
    .eq('is_active', true)
    .maybeSingle();

  const existingRec = existing as Record<string, unknown> | null;

  if (existingRec) {
    // Already assigned to same professional
    if (existingRec.professional_id === professional_id) {
      return NextResponse.json({ ok: true });
    }

    // Check 30-day lock
    const daysSince =
      (Date.now() - new Date(existingRec.assigned_at as string).getTime()) / (24 * 3600 * 1000);
    if (daysSince < 30) {
      return NextResponse.json(
        {
          error: 'change_too_soon',
          message: `Você pode trocar após ${Math.ceil(30 - daysSince)} dias`,
        },
        { status: 429 },
      );
    }

    // End current assignment
    await admin
      .from('premium_assignments')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', existingRec.id as string);
  }

  // Create new assignment
  await admin.from('premium_assignments').insert({
    user_id: user.id,
    professional_id,
    specialty,
    is_active: true,
  } as Record<string, unknown>);

  return NextResponse.json({ ok: true });
}
