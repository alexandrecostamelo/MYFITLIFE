import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const patchSchema = z.object({
  action: z.enum(['confirm', 'cancel', 'complete', 'no_show', 'update_notes', 'update_meeting_url']),
  meeting_url: z.string().url().optional(),
  professional_notes: z.string().max(2000).optional(),
  cancel_reason: z.string().max(500).optional(),
});

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: appt } = await supabase.from('appointments').select('*').eq('id', id).single();
  if (!appt) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const [profRes, clientRes] = await Promise.all([
    supabase.from('professionals').select('id, full_name, avatar_url, profession, whatsapp, user_id').eq('id', appt.professional_id).single(),
    supabase.from('profiles').select('id, full_name, username, avatar_url').eq('id', appt.client_id).single(),
  ]);

  return NextResponse.json({ appointment: appt, professional: profRes.data, client: clientRes.data });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data: appt } = await supabase.from('appointments').select('*, professionals(user_id)').eq('id', id).single();
  if (!appt) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const isProfessional = (appt.professionals as any)?.user_id === user.id;
  const isClient = appt.client_id === user.id;

  if (!isProfessional && !isClient) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const updates: any = { updated_at: new Date().toISOString() };

  if (parsed.data.action === 'confirm') {
    if (!isProfessional) return NextResponse.json({ error: 'only_professional' }, { status: 403 });
    updates.status = 'confirmed';
    if (parsed.data.meeting_url) updates.meeting_url = parsed.data.meeting_url;
  } else if (parsed.data.action === 'cancel') {
    updates.status = 'cancelled';
    updates.cancelled_by = user.id;
    updates.cancelled_at = new Date().toISOString();
    updates.cancel_reason = parsed.data.cancel_reason;
  } else if (parsed.data.action === 'complete') {
    if (!isProfessional) return NextResponse.json({ error: 'only_professional' }, { status: 403 });
    updates.status = 'completed';
  } else if (parsed.data.action === 'no_show') {
    if (!isProfessional) return NextResponse.json({ error: 'only_professional' }, { status: 403 });
    updates.status = 'no_show';
  } else if (parsed.data.action === 'update_notes') {
    if (!isProfessional) return NextResponse.json({ error: 'only_professional' }, { status: 403 });
    updates.professional_notes = parsed.data.professional_notes;
  } else if (parsed.data.action === 'update_meeting_url') {
    if (!isProfessional) return NextResponse.json({ error: 'only_professional' }, { status: 403 });
    updates.meeting_url = parsed.data.meeting_url;
  }

  const { error } = await supabase.from('appointments').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
