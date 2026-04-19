import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: exam } = await supabase.from('lab_exams').select('*').eq('id', id).eq('user_id', user.id).single();
  if (!exam) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: biomarkers } = await supabase
    .from('biomarkers')
    .select('*')
    .eq('lab_exam_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  let fileUrl: string | null = null;
  if (exam.file_path) {
    const { data } = await supabase.storage.from('lab-exams').createSignedUrl(exam.file_path, 3600);
    fileUrl = data?.signedUrl || null;
  }

  return NextResponse.json({ exam, biomarkers: biomarkers || [], file_url: fileUrl });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: exam } = await supabase.from('lab_exams').select('file_path').eq('id', id).eq('user_id', user.id).single();
  if (exam?.file_path) await supabase.storage.from('lab-exams').remove([exam.file_path]);

  await supabase.from('lab_exams').delete().eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
