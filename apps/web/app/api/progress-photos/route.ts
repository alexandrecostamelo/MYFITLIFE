import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const uploadSchema = z.object({
  pose: z.enum(['front', 'back', 'side_left', 'side_right']),
  weight_kg: z.number().positive().optional(),
  body_fat_percent: z.number().min(3).max(70).optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('photo') as File | null;
  const pose = formData.get('pose') as string | null;
  const weightStr = formData.get('weight_kg') as string | null;
  const bfStr = formData.get('body_fat_percent') as string | null;
  const notes = formData.get('notes') as string | null;

  if (!file) return NextResponse.json({ error: 'no_photo' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'file_too_large' }, { status: 400 });

  const parsed = uploadSchema.safeParse({
    pose,
    weight_kg: weightStr ? parseFloat(weightStr) : undefined,
    body_fat_percent: bfStr ? parseFloat(bfStr) : undefined,
    notes: notes || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const compressed = await sharp(buffer)
    .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const fileName = `${user.id}/${Date.now()}-${parsed.data.pose}.jpg`;
  const { data: uploaded, error: uploadErr } = await supabase.storage
    .from('progress-photos')
    .upload(fileName, compressed, { contentType: 'image/jpeg' });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: inserted, error } = await supabase
    .from('progress_photos')
    .insert({
      user_id: user.id,
      photo_path: uploaded.path,
      pose: parsed.data.pose,
      weight_kg: parsed.data.weight_kg,
      body_fat_percent: parsed.data.body_fat_percent,
      notes: parsed.data.notes,
    })
    .select('id')
    .single();

  if (error) {
    await supabase.storage.from('progress-photos').remove([uploaded.path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { awardXp, checkAchievements } = await import('@/lib/gamification');
  await awardXp(supabase, user.id, 'PROGRESS_PHOTO');
  await checkAchievements(supabase, user.id);

  return NextResponse.json({ id: inserted.id });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: photos } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', user.id)
    .order('taken_at', { ascending: false });

  const withUrls = await Promise.all(
    (photos || []).map(async (p: any) => {
      const { data } = await supabase.storage
        .from('progress-photos')
        .createSignedUrl(p.photo_path, 3600);
      return { ...p, signed_url: data?.signedUrl || null };
    })
  );

  return NextResponse.json({ photos: withUrls });
}
