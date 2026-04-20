import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const search = req.nextUrl.searchParams.get('q')?.trim().toLowerCase() || '';
  const category = req.nextUrl.searchParams.get('category') || '';

  let query = supabase
    .from('community_groups')
    .select('*')
    .eq('status', 'active')
    .order('member_count', { ascending: false });

  if (category) query = query.eq('category', category);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data: groups } = await query;

  const { data: myMemberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  const myGroupIds = new Set((myMemberships || []).map((m: any) => m.group_id));

  const enriched = (groups || []).map((g: any) => ({
    ...g,
    is_member: myGroupIds.has(g.id),
  }));

  return NextResponse.json({ groups: enriched });
}

const createGroupSchema = z.object({
  name: z.string().min(3).max(80),
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  cover_emoji: z.string().max(4).optional(),
  category: z.string().min(1).max(30),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid', details: parsed.error.flatten() }, { status: 400 });

  const { data: existing } = await supabase
    .from('community_groups')
    .select('id')
    .eq('slug', parsed.data.slug)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: 'slug_taken' }, { status: 409 });

  const { data: created, error } = await supabase
    .from('community_groups')
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      cover_emoji: parsed.data.cover_emoji || '💬',
      category: parsed.data.category,
      status: 'pending_approval',
      created_by: user.id,
    } as Record<string, unknown>)
    .select('id, slug')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ group: created, status: 'pending_approval' }, { status: 201 });
}
