import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: photo } = await supabase
    .from('progress_photos')
    .select('photo_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!photo) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await supabase.storage.from('progress-photos').remove([photo.photo_path]);

  const { error } = await supabase
    .from('progress_photos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
