import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { VideosAdminClient } from './videos-admin-client';

export const dynamic = 'force-dynamic';

export default async function VideosAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const isAdmin = await isPlatformAdmin(supabase, user.id);
  if (!isAdmin) redirect('/app/dashboard');

  const [{ data: exercises }, { data: videos }] = await Promise.all([
    supabase.from('exercises').select('id, name_pt, slug').order('name_pt').limit(500),
    supabase
      .from('exercise_videos')
      .select('id, exercise_id, video_type, storage_path, youtube_id, duration_seconds, created_at')
      .order('created_at', { ascending: false }),
  ]);

  // Enrich videos with exercise names
  const exMap = new Map((exercises || []).map((e: any) => [e.id, e]));
  const enrichedVideos = (videos || []).map((v: any) => ({
    ...v,
    exercise: exMap.get(v.exercise_id) || null,
  }));

  return <VideosAdminClient exercises={exercises || []} videos={enrichedVideos} />;
}
