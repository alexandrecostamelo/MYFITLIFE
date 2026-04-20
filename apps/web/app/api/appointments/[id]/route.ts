import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { requestNfseIssuance } from '@/lib/nfse/issue';
import { refundSession, type Specialty } from '@/lib/premium/quota';

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

    // Refund premium quota if applicable
    if (appt.is_premium_included && appt.premium_quota_id) {
      const { data: assignment } = await supabase
        .from('premium_assignments')
        .select('specialty')
        .eq('user_id', appt.client_id)
        .eq('professional_id', (appt.professionals as any)?.user_id)
        .eq('is_active', true)
        .maybeSingle();
      if (assignment) {
        const spec = (assignment as Record<string, unknown>).specialty as Specialty;
        await refundSession(appt.client_id, spec);
      }
    }
  } else if (parsed.data.action === 'complete') {
    if (!isProfessional) return NextResponse.json({ error: 'only_professional' }, { status: 403 });
    updates.status = 'completed';
    // Trigger NFSe issuance asynchronously
    requestNfseIssuance(id).catch((err) =>
      console.error('NFSe trigger failed for appointment', id, err),
    );
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
