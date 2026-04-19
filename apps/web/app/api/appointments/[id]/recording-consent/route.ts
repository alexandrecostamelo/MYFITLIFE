import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const professionalSchema = z.object({ recording_enabled: z.boolean() });
const clientSchema = z.object({ client_recording_consent: z.boolean() });

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: appointment } = await supabase
    .from('appointments')
    .select('client_id, professional_id')
    .eq('id', id)
    .single();

  if (!appointment) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const appt = appointment as Record<string, unknown>;
  const isProfessional = user.id === appt.professional_id;
  const isClient = user.id === appt.client_id;

  if (!isProfessional && !isClient) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json();

  if (isProfessional) {
    const parsed = professionalSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    await supabase.from('appointments').update({ recording_enabled: parsed.data.recording_enabled }).eq('id', id);
  } else {
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    await supabase.from('appointments').update({ client_recording_consent: parsed.data.client_recording_consent }).eq('id', id);
  }

  return NextResponse.json({ ok: true });
}
