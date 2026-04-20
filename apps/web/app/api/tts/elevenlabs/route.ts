import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', user.id)
    .maybeSingle();

  const isPro =
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing') &&
    (profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'premium');

  if (!isPro) return NextResponse.json({ error: 'pro_only' }, { status: 402 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'not_configured' }, { status: 501 });

  const { text } = await req.json();
  if (!text || text.length > 200) {
    return NextResponse.json({ error: 'invalid_text' }, { status: 400 });
  }

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.7 },
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'tts_failed' }, { status: 500 });

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
