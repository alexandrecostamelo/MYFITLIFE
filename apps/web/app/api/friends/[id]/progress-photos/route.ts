import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase.rpc('friend_progress_photos', { p_friend_id: id });

  if (error) {
    if (error.message.includes('not_friends')) return NextResponse.json({ error: 'not_friends' }, { status: 403 });
    if (error.message.includes('not_shared')) return NextResponse.json({ error: 'not_shared' }, { status: 403 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const friendPhotos = (data || []).map((p: Record<string, unknown>) => {
    const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(p.photo_path as string);
    return { ...p, photo_url: urlData.publicUrl };
  });

  const { data: myPhotos } = await supabase
    .from('progress_photos')
    .select('id, photo_path, pose, taken_at')
    .eq('user_id', user.id)
    .order('taken_at', { ascending: false })
    .limit(20);

  const myPhotosEnriched = (myPhotos || []).map((p: Record<string, unknown>) => {
    const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(p.photo_path as string);
    return { ...p, photo_url: urlData.publicUrl };
  });

  return NextResponse.json({ friend_photos: friendPhotos, my_photos: myPhotosEnriched });
}
