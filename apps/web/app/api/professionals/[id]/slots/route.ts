import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSlotsForDay, getNext14Days } from '@myfitlife/core/scheduling';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [availability, blocked, booked] = await Promise.all([
    supabase.from('professional_availability').select('weekday, start_time, end_time, slot_duration_min').eq('professional_id', id).eq('active', true),
    supabase.from('professional_blocked_dates').select('blocked_date').eq('professional_id', id).gte('blocked_date', new Date().toISOString().slice(0, 10)),
    supabase.from('appointments').select('scheduled_at').eq('professional_id', id).in('status', ['requested', 'confirmed']).gte('scheduled_at', new Date().toISOString()),
  ]);

  const days = getNext14Days();
  const blockedDates = (blocked.data || []).map((b: any) => b.blocked_date);
  const bookedAt = (booked.data || []).map((b: any) => b.scheduled_at);

  const result = days.map((d) => ({
    date: d.toISOString().slice(0, 10),
    slots: generateSlotsForDay(d, (availability.data || []) as any, blockedDates, bookedAt),
  })).filter((d) => d.slots.length > 0);

  return NextResponse.json({ days: result });
}
