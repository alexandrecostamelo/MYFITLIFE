import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  let query = supabase
    .from('help_articles')
    .select('id, slug, title, category, summary, content, order_index')
    .eq('published', true)
    .order('order_index', { ascending: true });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;

  if (error) {
    console.error('[help/articles]', error);
    return NextResponse.json({ articles: [] });
  }

  return NextResponse.json({ articles: data || [] });
}
