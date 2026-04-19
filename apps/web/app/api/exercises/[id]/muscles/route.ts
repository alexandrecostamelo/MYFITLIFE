import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { matchExerciseMuscles } from '@myfitlife/core/muscles';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabase
    .from('exercises')
    .select('name_pt')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const muscles = matchExerciseMuscles(data.name_pt);
  return NextResponse.json({ muscles });
}
