import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteDailyRoom } from '@/lib/daily';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Rooms expired more than 2 hours ago
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: expired } = await supabase
    .from('appointments')
    .select('id, video_room_name')
    .lt('video_room_expires_at', cutoff)
    .not('video_room_name', 'is', null);

  let deleted = 0;
  for (const appt of (expired ?? [])) {
    const a = appt as Record<string, unknown>;
    if (!a.video_room_name) continue;
    try {
      await deleteDailyRoom(a.video_room_name as string);
      await supabase.from('appointments').update({
        video_room_name: null,
        video_room_url: null,
      }).eq('id', a.id as string);
      deleted++;
    } catch (e) {
      console.error('[video-rooms-cleanup]', a.id, e);
    }
  }

  return NextResponse.json({ ok: true, deleted, ran_at: new Date().toISOString() });
}
