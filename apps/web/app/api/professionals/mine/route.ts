import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSchema = z.object({
  bio: z.string().max(2000).optional(),
  full_name: z.string().min(3).max(120).optional(),
  avatar_url: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  formations: z.array(z.string()).optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  modalities: z.array(z.string()).optional(),
  price_consultation: z.number().nonnegative().nullable().optional(),
  price_monthly: z.number().nonnegative().nullable().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  instagram: z.string().optional(),
  website: z.string().url().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ professional: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { error } = await supabase
    .from('professionals')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
