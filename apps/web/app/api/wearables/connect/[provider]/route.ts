import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PROVIDERS } from '@/lib/wearables/providers';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const provider = PROVIDERS[providerId];
  if (!provider)
    return NextResponse.json({ error: 'unknown_provider' }, { status: 400 });

  // state = random nonce + userId so the callback knows who authorized
  const state =
    crypto.randomBytes(16).toString('hex') + ':' + user.id;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/wearables/callback/${providerId}`;

  const url = provider.authUrl(state, redirectUri);
  return NextResponse.redirect(url);
}
