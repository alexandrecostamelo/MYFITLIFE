import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const isAdmin = await isPlatformAdmin(supabase, user.id);
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: video } = await serviceClient
    .from('exercise_videos')
    .select('id, storage_path')
    .eq('id', id)
    .single();

  if (!video) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (video.storage_path) {
    await serviceClient.storage
      .from('exercise-videos')
      .remove([video.storage_path]);
  }

  const { error } = await serviceClient
    .from('exercise_videos')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
