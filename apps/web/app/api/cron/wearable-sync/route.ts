import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { PROVIDERS } from '@/lib/wearables/providers';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: connections } = await admin
    .from('wearable_connections')
    .select('*')
    .eq('is_active', true)
    .limit(200);

  let synced = 0;
  let errors = 0;
  const endDate = new Date();
  const startDate = new Date(Date.now() - 2 * 24 * 3600 * 1000); // last 48h

  for (const conn of (connections || []) as Record<string, unknown>[]) {
    const providerId = String(conn.provider);
    const provider = PROVIDERS[providerId];
    if (!provider) continue;

    let token = String(conn.access_token);
    const connId = String(conn.id);
    const userId = String(conn.user_id);

    // refresh token if expired
    const expiresAt = conn.token_expires_at
      ? new Date(String(conn.token_expires_at))
      : null;
    if (expiresAt && expiresAt < new Date() && conn.refresh_token) {
      try {
        const refreshed = await provider.refreshToken(
          String(conn.refresh_token),
        );
        token = refreshed.access_token;
        await admin
          .from('wearable_connections')
          .update({
            access_token: refreshed.access_token,
            refresh_token:
              refreshed.refresh_token || String(conn.refresh_token),
            token_expires_at: refreshed.expires_in
              ? new Date(
                  Date.now() + refreshed.expires_in * 1000,
                ).toISOString()
              : String(conn.token_expires_at),
            updated_at: new Date().toISOString(),
          } as Record<string, unknown>)
          .eq('id', connId);
      } catch {
        // token revoked — deactivate connection
        await admin
          .from('wearable_connections')
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          } as Record<string, unknown>)
          .eq('id', connId);
        errors++;
        continue;
      }
    }

    try {
      const samples = await provider.fetchData(token, startDate, endDate);

      for (const s of samples) {
        await admin.from('health_samples').upsert(
          {
            user_id: userId,
            metric: s.metric,
            value: s.value,
            unit: s.unit,
            source: providerId,
            sampled_at: s.sampled_at,
          } as Record<string, unknown>,
          { onConflict: 'user_id,metric,source,sampled_at' },
        );
      }

      await admin
        .from('wearable_connections')
        .update({ last_sync_at: new Date().toISOString() } as Record<string, unknown>)
        .eq('id', connId);

      synced += samples.length;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({
    connections: connections?.length || 0,
    synced,
    errors,
  });
}
