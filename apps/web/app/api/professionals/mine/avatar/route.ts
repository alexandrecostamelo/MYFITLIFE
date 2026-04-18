import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('avatar') as File | null;
  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'file_too_large' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Try sharp compression, fall back to raw upload if sharp not available
  let uploadBuffer: Buffer = buffer;
  let contentType = file.type || 'image/jpeg';
  try {
    const sharp = (await import('sharp')).default;
    uploadBuffer = await sharp(buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();
    contentType = 'image/jpeg';
  } catch {
    // sharp not available, upload as-is
  }

  const fileName = `${user.id}/avatar.jpg`;
  const { error: uploadErr } = await supabase.storage
    .from('professional-avatars')
    .upload(fileName, uploadBuffer, { contentType, upsert: true });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: urlData } = supabase.storage
    .from('professional-avatars')
    .getPublicUrl(fileName);

  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  await supabase
    .from('professionals')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  return NextResponse.json({ avatar_url: publicUrl });
}
