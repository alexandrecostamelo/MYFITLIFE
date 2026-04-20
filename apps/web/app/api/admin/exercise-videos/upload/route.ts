import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const isAdmin = await isPlatformAdmin(supabase, user.id);
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const fd = await req.formData();
  const file = fd.get('file') as File | null;
  const exerciseId = fd.get('exercise_id') as string | null;
  const videoType = fd.get('video_type') as string | null;

  if (!file || !exerciseId || !videoType) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'mp4';
  const storagePath = `${exerciseId}/${videoType}-${Date.now()}.${ext}`;

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await serviceClient.storage
    .from('exercise-videos')
    .upload(storagePath, buffer, {
      contentType: file.type || 'video/mp4',
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error: dbError } = await serviceClient
    .from('exercise_videos')
    .insert({
      exercise_id: exerciseId,
      video_type: videoType,
      storage_path: storagePath,
    } as Record<string, unknown>)
    .select()
    .single();

  if (dbError) {
    await serviceClient.storage.from('exercise-videos').remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ video: data });
}
