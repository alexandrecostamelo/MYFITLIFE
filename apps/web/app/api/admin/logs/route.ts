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
  const perPage = 50;
  const offset = (page - 1) * perPage;

  // Admin audit log
  const { data: auditLogs, count: auditCount } = await admin
    .from('admin_audit_log')
    .select('id, admin_id, action, target_user_id, details, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  // Get admin names
  const adminIds = [...new Set((auditLogs || []).map((l: any) => l.admin_id))];
  const { data: adminProfiles } = adminIds.length > 0
    ? await admin.from('profiles').select('id, full_name').in('id', adminIds)
    : { data: [] };
  const adminMap = new Map((adminProfiles || []).map((p: any) => [p.id, p.full_name]));

  const enriched = (auditLogs || []).map((l: any) => ({
    ...l,
    admin_name: adminMap.get(l.admin_id) || 'Admin',
  }));

  return NextResponse.json({
    logs: enriched,
    total: auditCount || 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((auditCount || 0) / perPage),
  });
}
