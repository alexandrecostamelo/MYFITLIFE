import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { PROVIDERS } from '@/lib/wearables/providers';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/app/settings/health?error=missing_code', req.url),
    );
  }

  const userId = state.split(':')[1];
  if (!userId) {
    return NextResponse.redirect(
      new URL('/app/settings/health?error=invalid_state', req.url),
    );
  }

  const provider = PROVIDERS[providerId];
  if (!provider) {
    return NextResponse.redirect(
      new URL('/app/settings/health?error=unknown_provider', req.url),
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/wearables/callback/${providerId}`;

  try {
    const tokens = await provider.exchangeCode(code, redirectUri);

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    await admin.from('wearable_connections').upsert(
      {
        user_id: userId,
        provider: providerId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
        external_user_id: tokens.user_id || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>,
      { onConflict: 'user_id,provider' },
    );

    return NextResponse.redirect(
      new URL(`/app/settings/health?connected=${providerId}`, req.url),
    );
  } catch (err) {
    console.error('wearable oauth error:', err);
    return NextResponse.redirect(
      new URL('/app/settings/health?error=oauth_failed', req.url),
    );
  }
}
