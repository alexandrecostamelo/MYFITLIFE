import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('profiles')
    .select('coach_persona')
    .eq('id', user.id)
    .single();

  return NextResponse.json({ persona: String(data?.coach_persona || 'leo') });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { persona } = await req.json();
  if (!['leo', 'sofia', 'rafa'].includes(persona)) {
    return NextResponse.json({ error: 'invalid_persona' }, { status: 400 });
  }

  await supabase
    .from('profiles')
    .update({ coach_persona: persona } as Record<string, unknown>)
    .eq('id', user.id);

  return NextResponse.json({ ok: true });
}
