import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { PROVIDERS } from '@/lib/wearables/providers';
import { withHeartbeat } from '@/lib/monitoring/heartbeat';
import { decrypt, encrypt } from '@/lib/crypto/envelope';

export const runtime = 'nodejs';
export const maxDuration = 120;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchWithRetry(
  fn: () => Promise<{ metric: string; value: number; unit: string; sampled_at: string }[]>,
  maxRetries = 3,
): Promise<{ metric: string; value: number; unit: string; sampled_at: string }[]> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      if (attempt === maxRetries - 1) throw err;
      const msg = err instanceof Error ? err.message : '';
      const isRateLimit = msg.includes('429');
      const delay = isRateLimit ? (attempt + 1) * 5000 : (attempt + 1) * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return [];
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return withHeartbeat('wearable_sync', async () => {
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

      let token = decrypt(String(conn.access_token));
      const connId = String(conn.id);
      const userId = String(conn.user_id);

      // refresh token if expired
      const expiresAt = conn.token_expires_at
        ? new Date(String(conn.token_expires_at))
        : null;
      if (expiresAt && expiresAt < new Date() && conn.refresh_token) {
        try {
          const refreshed = await provider.refreshToken(
            decrypt(String(conn.refresh_token)),
          );
          token = refreshed.access_token;
          await admin
            .from('wearable_connections')
            .update({
              access_token: encrypt(refreshed.access_token),
              refresh_token: refreshed.refresh_token
                ? encrypt(refreshed.refresh_token)
                : conn.refresh_token,
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
              last_sync_error: 'token_revoked',
              updated_at: new Date().toISOString(),
            } as Record<string, unknown>)
            .eq('id', connId);
          errors++;
          continue;
        }
      }

      try {
        const samples = await fetchWithRetry(() =>
          provider.fetchData(token, startDate, endDate),
        );

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
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_error: null,
            consecutive_failures: 0,
          } as Record<string, unknown>)
          .eq('id', connId);

        synced += samples.length;
      } catch (err: unknown) {
        const failures = (Number(conn.consecutive_failures) || 0) + 1;
        const errMsg =
          err instanceof Error ? err.message.slice(0, 200) : 'unknown';
        await admin
          .from('wearable_connections')
          .update({
            last_sync_error: errMsg,
            consecutive_failures: failures,
            is_active: failures < 5, // deactivate after 5 consecutive failures
            updated_at: new Date().toISOString(),
          } as Record<string, unknown>)
          .eq('id', connId);
        errors++;
      }
    }

    return NextResponse.json({
      connections: connections?.length || 0,
      synced,
      errors,
    });
  });
}
