import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const isAdmin = await isPlatformAdmin(supabase, user.id);
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { exercise_id, video_type, youtube_id } = await req.json();
  if (!exercise_id || !video_type || !youtube_id) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('exercise_videos')
    .insert({ exercise_id, video_type, youtube_id } as Record<string, unknown>)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ video: data });
}
