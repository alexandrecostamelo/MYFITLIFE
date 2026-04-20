import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();

  // Verify ownership via claimed_by
  const { data: gym } = await supabase
    .from('gym_places')
    .select('id')
    .eq('id', body.gym_id)
    .eq('claimed_by', user.id)
    .maybeSingle();

  if (!gym)
    return NextResponse.json({ error: 'not_owner' }, { status: 403 });

  const { data, error } = await supabase
    .from('gym_classes')
    .insert({
      gym_id: body.gym_id,
      title: body.title,
      description: body.description || null,
      modality: body.modality,
      instructor_name: body.instructor_name || null,
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      end_time: body.end_time,
      max_capacity: body.max_capacity || 20,
      location_detail: body.location_detail || null,
    } as Record<string, unknown>)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ class: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { class_id } = await req.json();

  const { data: cls } = await supabase
    .from('gym_classes')
    .select('gym_id')
    .eq('id', class_id)
    .single();

  if (!cls)
    return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const gymId = String((cls as Record<string, unknown>).gym_id);

  const { data: gym } = await supabase
    .from('gym_places')
    .select('id')
    .eq('id', gymId)
    .eq('claimed_by', user.id)
    .maybeSingle();

  if (!gym)
    return NextResponse.json({ error: 'not_owner' }, { status: 403 });

  await supabase
    .from('gym_classes')
    .update({ is_active: false } as Record<string, unknown>)
    .eq('id', class_id);

  return NextResponse.json({ ok: true });
}
