import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const PROFESSION_TO_COUNCIL: Record<string, string> = {
  nutritionist: 'CRN',
  personal_trainer: 'CREF',
  physiotherapist: 'CREFITO',
};

const createSchema = z.object({
  profession: z.enum(['nutritionist', 'personal_trainer', 'physiotherapist']),
  council_number: z.string().min(3).max(30),
  council_state: z.string().length(2),
  full_name: z.string().min(3).max(120),
  bio: z.string().max(2000).optional(),
  specialties: z.array(z.string()).max(15).optional(),
  formations: z.array(z.string()).max(10).optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  modalities: z.array(z.string()).optional(),
  price_consultation: z.number().nonnegative().optional(),
  price_monthly: z.number().nonnegative().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  instagram: z.string().optional(),
  website: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const profession = req.nextUrl.searchParams.get('profession');
  const city = req.nextUrl.searchParams.get('city');
  const state = req.nextUrl.searchParams.get('state');
  const modality = req.nextUrl.searchParams.get('modality');
  const q = req.nextUrl.searchParams.get('q');
  const maxPrice = req.nextUrl.searchParams.get('max_price');

  let query = supabase
    .from('professionals')
    .select('id, profession, council_type, council_number, council_state, full_name, bio, avatar_url, specialties, city, state, modalities, price_consultation, price_monthly, verified, rating_avg, rating_count')
    .eq('active', true)
    .eq('verified', true)
    .limit(50);

  if (profession) query = query.eq('profession', profession);
  if (city) query = query.ilike('city', `%${city}%`);
  if (state) query = query.eq('state', state.toUpperCase());
  if (modality) query = query.contains('modalities', [modality]);
  if (q) query = query.or(`full_name.ilike.%${q}%,bio.ilike.%${q}%`);
  if (maxPrice) query = query.lte('price_consultation', parseFloat(maxPrice));

  const { data, error } = await query.order('rating_avg', { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ professionals: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 });

  const { data: existing } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: 'already_registered' }, { status: 409 });

  const councilType = PROFESSION_TO_COUNCIL[parsed.data.profession];

  const { data: duplicate } = await supabase
    .from('professionals')
    .select('id')
    .eq('council_type', councilType)
    .eq('council_number', parsed.data.council_number)
    .eq('council_state', parsed.data.council_state.toUpperCase())
    .maybeSingle();

  if (duplicate) return NextResponse.json({ error: 'council_already_taken' }, { status: 409 });

  const { data, error } = await supabase
    .from('professionals')
    .insert({
      user_id: user.id,
      profession: parsed.data.profession,
      council_type: councilType,
      council_number: parsed.data.council_number,
      council_state: parsed.data.council_state.toUpperCase(),
      full_name: parsed.data.full_name,
      bio: parsed.data.bio,
      specialties: parsed.data.specialties || [],
      formations: parsed.data.formations || [],
      city: parsed.data.city,
      state: parsed.data.state?.toUpperCase(),
      modalities: parsed.data.modalities || [],
      price_consultation: parsed.data.price_consultation,
      price_monthly: parsed.data.price_monthly,
      whatsapp: parsed.data.whatsapp,
      email: parsed.data.email,
      instagram: parsed.data.instagram,
      website: parsed.data.website,
      verified: false,
      active: true,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('profiles').update({ role: 'professional' }).eq('id', user.id);

  return NextResponse.json({ id: data.id });
}
