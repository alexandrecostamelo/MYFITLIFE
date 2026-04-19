import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moderateText } from '@/lib/moderation';
import { z } from 'zod';

export const maxDuration = 20;

const schema = z.object({ content: z.string().min(1).max(500) });

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: comments } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', id)
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: true });

  const authorIds = Array.from(new Set((comments || []).map((c: any) => c.author_id)));
  const { data: profiles } = authorIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', authorIds)
    : { data: [] };

  const profMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const enriched = (comments || []).map((c: any) => ({
    ...c,
    author: profMap.get(c.author_id) || { full_name: 'Usuário' },
  }));

  return NextResponse.json({ comments: enriched });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const moderation = await moderateText(parsed.data.content);

  const { data: created, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: id,
      author_id: user.id,
      content: parsed.data.content,
      moderation_status: moderation.decision,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: created.id, moderation_status: moderation.decision });
}
