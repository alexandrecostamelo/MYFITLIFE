import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDailyRoom, createDailyToken } from '@/lib/daily';

export const maxDuration = 20;

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: appointment } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .single();

  if (!appointment) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const appt = appointment as Record<string, unknown>;

  if (appt.client_id !== user.id && appt.professional_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  if (appt.status !== 'confirmed') {
    return NextResponse.json({ error: 'not_confirmed' }, { status: 400 });
  }

  const startTime = new Date(appt.scheduled_at as string);
  const now = new Date();
  const diffMinutes = (startTime.getTime() - now.getTime()) / 60000;

  if (diffMinutes > 15) {
    return NextResponse.json({
      error: 'too_early',
      message: 'A sala abre 15 minutos antes do horário marcado',
      opens_in_minutes: Math.round(diffMinutes - 15),
    }, { status: 400 });
  }

  if (diffMinutes < -60) {
    return NextResponse.json({ error: 'expired' }, { status: 400 });
  }

  const durationMin = (appt.duration_min as number) || 60;
  const expiresAt = new Date(startTime.getTime() + (durationMin + 30) * 60000);

  let roomUrl = appt.video_room_url as string | null;
  let roomName = appt.video_room_name as string | null;

  if (!roomUrl || !roomName) {
    roomName = `appt-${id}`;
    const recordingReady =
      (appt.recording_enabled as boolean) &&
      (appt.client_recording_consent as boolean | null) === true;

    try {
      const room = await createDailyRoom({
        name: roomName,
        expiresAt,
        enableRecording: recordingReady,
      });
      roomUrl = room.url;
      roomName = room.name;

      await supabase.from('appointments').update({
        video_room_name: roomName,
        video_room_url: roomUrl,
        video_room_expires_at: expiresAt.toISOString(),
      }).eq('id', id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: 'room_creation_failed', message: msg }, { status: 500 });
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const isProfessional = user.id === appt.professional_id;

  let token: string;
  try {
    token = await createDailyToken({
      roomName: roomName!,
      userName: (profile as Record<string, unknown> | null)?.full_name as string || 'Usuário',
      userId: user.id,
      isOwner: isProfessional,
      expiresAt,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'token_creation_failed', message: msg }, { status: 500 });
  }

  void supabase.from('video_session_events').insert({
    appointment_id: id,
    user_id: user.id,
    event_type: 'joined',
    metadata: { is_owner: isProfessional },
  });

  return NextResponse.json({
    room_url: roomUrl,
    room_name: roomName,
    token,
    is_owner: isProfessional,
    expires_at: expiresAt.toISOString(),
  });
}
