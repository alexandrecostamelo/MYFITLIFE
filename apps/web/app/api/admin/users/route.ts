import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(supabase, user.id)))
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = 30;
  const offset = (page - 1) * perPage;
  const search = searchParams.get('q') || '';
  const tierFilter = searchParams.get('tier') || '';
  const format = searchParams.get('format') || 'json';

  let query = admin
    .from('profiles')
    .select(
      'id, full_name, email, username, role, subscription_tier, subscription_status, created_at, avatar_url',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`);
  }
  if (tierFilter) {
    query = query.eq('subscription_tier', tierFilter);
  }

  if (format === 'csv') {
    query = query.limit(10000);
    const { data: allUsers } = await query;
    const rows = (allUsers || []) as Record<string, unknown>[];
    const csv = [
      'id,nome,email,username,role,tier,status,criado_em',
      ...rows.map((u) =>
        [u.id, u.full_name, u.email, u.username, u.role, u.subscription_tier, u.subscription_status, u.created_at]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  query = query.range(offset, offset + perPage - 1);
  const { data: users, count } = await query;

  return NextResponse.json({
    users: users || [],
    total: count || 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count || 0) / perPage),
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(supabase, user.id)))
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const body = await req.json();
  const { user_id, action, value } = body as {
    user_id: string;
    action: 'block' | 'unblock' | 'change_tier';
    value?: string;
  };

  if (!user_id || !action)
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  // Log admin action
  await admin.from('admin_audit_log').insert({
    admin_id: user.id,
    action,
    target_user_id: user_id,
    details: { value },
  } as Record<string, unknown>);

  if (action === 'block') {
    await admin
      .from('profiles')
      .update({ blocked: true } as Record<string, unknown>)
      .eq('id', user_id);
    return NextResponse.json({ ok: true });
  }

  if (action === 'unblock') {
    await admin
      .from('profiles')
      .update({ blocked: false } as Record<string, unknown>)
      .eq('id', user_id);
    return NextResponse.json({ ok: true });
  }

  if (action === 'change_tier' && value) {
    await admin
      .from('profiles')
      .update({ subscription_tier: value } as Record<string, unknown>)
      .eq('id', user_id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
}
