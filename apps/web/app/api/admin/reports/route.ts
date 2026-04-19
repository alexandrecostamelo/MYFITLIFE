import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = await isPlatformAdmin(supabase, user.id);
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: reports } = await supabase
    .from('content_reports')
    .select('*')
    .order('created_at', { ascending: false });

  const reporterIds = Array.from(new Set((reports || []).map((r: any) => r.reporter_id)));
  const { data: profiles } = reporterIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, username').in('id', reporterIds)
    : { data: [] };

  const profMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const enriched = (reports || []).map((r: any) => ({
    ...r,
    reporter: profMap.get(r.reporter_id) || { full_name: 'Usuário' },
  }));

  return NextResponse.json({ reports: enriched });
}
