import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processTransformationImage, type FaceCoord } from '@/lib/transformation-image';
import { moderateTransformation } from '@myfitlife/ai/prompts/transformation-moderation';
import { z } from 'zod';

export const maxDuration = 60;

const faceCoordSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  confidence: z.number().optional(),
});

const schema = z.object({
  before_photo_id: z.string().uuid(),
  after_photo_id: z.string().uuid(),
  category: z.enum(['weight_loss', 'hypertrophy', 'recomposition', 'health', 'mobility', 'other']),
  title: z.string().max(120).optional(),
  story: z.string().max(2000).optional(),
  anonymized: z.boolean().default(false),
  display_name_override: z.string().max(60).optional(),
  accept_terms: z.literal(true),
  // Face detection results from client
  faces_before: z.array(faceCoordSchema).optional(),
  faces_after: z.array(faceCoordSchema).optional(),
  img_width_before: z.number().optional(),
  img_height_before: z.number().optional(),
  img_width_after: z.number().optional(),
  img_height_after: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 });

  const [beforeRes, afterRes] = await Promise.all([
    supabase.from('progress_photos').select('*').eq('id', parsed.data.before_photo_id).eq('user_id', user.id).maybeSingle(),
    supabase.from('progress_photos').select('*').eq('id', parsed.data.after_photo_id).eq('user_id', user.id).maybeSingle(),
  ]);

  if (!beforeRes.data || !afterRes.data) {
    return NextResponse.json({ error: 'photo_not_found' }, { status: 404 });
  }

  const beforeDate = new Date((beforeRes.data as Record<string, unknown>).taken_at as string);
  const afterDate = new Date((afterRes.data as Record<string, unknown>).taken_at as string);
  if (beforeDate >= afterDate) {
    return NextResponse.json({ error: 'before_must_be_earlier' }, { status: 400 });
  }
  const periodDays = Math.floor((afterDate.getTime() - beforeDate.getTime()) / 86400000);

  let beforeProcessed: string;
  let afterProcessed: string;
  try {
    [beforeProcessed, afterProcessed] = await Promise.all([
      processTransformationImage(
        supabase, 'progress-photos',
        (beforeRes.data as Record<string, unknown>).photo_path as string,
        user.id, 'before',
        {
          anonymize: parsed.data.anonymized,
          watermarkText: 'myfitlife.app',
          faces: (parsed.data.faces_before || []) as FaceCoord[],
          origWidth: parsed.data.img_width_before,
          origHeight: parsed.data.img_height_before,
        }
      ),
      processTransformationImage(
        supabase, 'progress-photos',
        (afterRes.data as Record<string, unknown>).photo_path as string,
        user.id, 'after',
        {
          anonymize: parsed.data.anonymized,
          watermarkText: 'myfitlife.app',
          faces: (parsed.data.faces_after || []) as FaceCoord[],
          origWidth: parsed.data.img_width_after,
          origHeight: parsed.data.img_height_after,
        }
      ),
    ]);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: 'image_processing_failed', detail: msg }, { status: 500 });
  }

  const { data, error } = await supabase.from('transformation_posts').insert({
    user_id: user.id,
    before_photo_path: beforeProcessed,
    after_photo_path: afterProcessed,
    before_date: (beforeRes.data as Record<string, unknown>).taken_at as string,
    after_date: (afterRes.data as Record<string, unknown>).taken_at as string,
    period_days: periodDays,
    category: parsed.data.category,
    title: parsed.data.title,
    story: parsed.data.story,
    anonymized: parsed.data.anonymized,
    display_name_override: parsed.data.display_name_override,
    status: 'pending',
    faces_detected_before: (parsed.data.faces_before || []).length,
    faces_detected_after: (parsed.data.faces_after || []).length,
    ai_moderation_status: 'pending',
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const postId = (data as Record<string, unknown>).id as string;
  const caption = parsed.data.story || parsed.data.title || null;

  // Fire-and-forget background moderation (does not block the response)
  moderateInBackground(supabase, postId, beforeProcessed, afterProcessed, caption).catch((err) => {
    console.error('[transformation-moderation] background task failed:', err);
  });

  return NextResponse.json({ id: postId, status: 'pending' });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const scope = req.nextUrl.searchParams.get('scope') || 'public';
  const category = req.nextUrl.searchParams.get('category');

  if (scope === 'mine') {
    const { data } = await supabase
      .from('transformation_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const posts = (data || []).map((p: Record<string, unknown>) => ({
      ...p,
      before_url: supabase.storage.from('transformations-public').getPublicUrl(p.before_photo_path as string).data.publicUrl,
      after_url: supabase.storage.from('transformations-public').getPublicUrl(p.after_photo_path as string).data.publicUrl,
    }));
    return NextResponse.json({ posts });
  }

  const { data } = await supabase.rpc('trending_transformations', { p_limit: 50 });
  let posts = (data || []) as Record<string, unknown>[];

  if (category) posts = posts.filter((p) => p.category === category);

  const ids = posts.map((p) => p.id as string);
  const { data: myInspires } = ids.length > 0
    ? await supabase.from('transformation_inspires').select('post_id').eq('user_id', user.id).in('post_id', ids)
    : { data: [] };
  const inspiredSet = new Set((myInspires || []).map((i: Record<string, unknown>) => i.post_id as string));

  const enriched = posts.map((p) => ({
    ...p,
    before_url: supabase.storage.from('transformations-public').getPublicUrl(p.before_photo_path as string).data.publicUrl,
    after_url: supabase.storage.from('transformations-public').getPublicUrl(p.after_photo_path as string).data.publicUrl,
    i_inspired: inspiredSet.has(p.id as string),
  }));

  return NextResponse.json({ posts: enriched });
}

// ---------------------------------------------------------------------------
// Background moderation — called after POST, does not block the response
// ---------------------------------------------------------------------------
async function moderateInBackground(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  postId: string,
  beforePath: string,
  afterPath: string,
  caption: string | null
) {
  try {
    const [beforeRes, afterRes] = await Promise.all([
      supabase.storage.from('transformations-public').download(beforePath),
      supabase.storage.from('transformations-public').download(afterPath),
    ]);
    if (!beforeRes.data || !afterRes.data) throw new Error('Failed to download processed photos');

    const beforeBuf = Buffer.from(await beforeRes.data.arrayBuffer());
    const afterBuf  = Buffer.from(await afterRes.data.arrayBuffer());

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');

    const result = await moderateTransformation(
      apiKey,
      beforeBuf.toString('base64'),
      afterBuf.toString('base64'),
      'image/jpeg',
      'image/jpeg',
      caption
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      ai_moderation_status:     result.status,
      ai_moderation_reasoning:  result.reasoning,
      ai_moderation_flags:      result.flags,
      ai_moderation_confidence: result.confidence,
      ai_moderated_at:          new Date().toISOString(),
    };

    if (result.status === 'auto_rejected') {
      updates.status = 'rejected';
      updates.reject_reason = `IA: ${result.flags.join(', ')}. ${result.reasoning}`;
    }

    await supabase.from('transformation_posts').update(updates).eq('id', postId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[transformation-moderation]', msg);
    await supabase
      .from('transformation_posts')
      .update({
        ai_moderation_status:    'error',
        ai_moderation_reasoning: `Erro técnico: ${msg}`,
        ai_moderated_at:         new Date().toISOString(),
      })
      .eq('id', postId);
  }
}
