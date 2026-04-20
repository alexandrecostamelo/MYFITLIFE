import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF || 'ntohdhtvyjplcwfwfopd';

  // Strategy: use Supabase Management API if access token is available
  // This triggers a native backup on the Supabase side (works on all plans)
  if (accessToken) {
    try {
      const res = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/backups`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (res.ok) {
        return NextResponse.json({
          ok: true,
          method: 'supabase_api',
          status: res.status,
        });
      }

      // Fallback to SQL-based backup
      const errorText = await res.text().catch(() => 'unknown');
      console.error('Supabase backup API failed:', errorText);
    } catch (err) {
      console.error('Supabase backup API error:', err);
    }
  }

  // Fallback: export critical tables as JSON to Storage
  const admin = createAdmin(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19);

  const tables = [
    'profiles',
    'user_profiles',
    'user_stats',
    'workout_logs',
    'set_logs',
    'meal_logs',
    'morning_checkins',
    'weight_logs',
    'biomarkers',
    'lab_exams',
    'body_compositions',
    'goals',
    'subscriptions',
  ];

  const backup: Record<string, unknown[]> = {};
  let totalRows = 0;

  for (const table of tables) {
    try {
      const { data, error } = await admin
        .from(table)
        .select('*')
        .limit(50000);
      if (!error && data) {
        backup[table] = data;
        totalRows += data.length;
      }
    } catch {
      // table may not exist, skip
    }
  }

  const jsonStr = JSON.stringify(backup);
  const encoder = new TextEncoder();
  const content = encoder.encode(jsonStr);

  const filename = `backup-${timestamp}.json`;
  const storagePath = `db-backups/${filename}`;

  const { error: uploadError } = await admin.storage
    .from('backups')
    .upload(storagePath, content, {
      contentType: 'application/json',
      upsert: false,
    });

  if (uploadError) {
    // Bucket may not exist, try creating it
    if (uploadError.message.includes('not found')) {
      await admin.storage.createBucket('backups', { public: false });
      const { error: retryError } = await admin.storage
        .from('backups')
        .upload(storagePath, content, {
          contentType: 'application/json',
          upsert: false,
        });
      if (retryError) {
        return NextResponse.json(
          { error: retryError.message },
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 },
      );
    }
  }

  // Retention: keep only last 30 backups
  const { data: oldBackups } = await admin.storage
    .from('backups')
    .list('db-backups', {
      sortBy: { column: 'created_at', order: 'asc' },
    });

  if (oldBackups && oldBackups.length > 30) {
    const toDelete = oldBackups
      .slice(0, oldBackups.length - 30)
      .map((f) => `db-backups/${f.name}`);
    await admin.storage.from('backups').remove(toDelete);
  }

  return NextResponse.json({
    ok: true,
    method: 'json_export',
    file: storagePath,
    tables: Object.keys(backup).length,
    total_rows: totalRows,
    size_kb: Math.round(content.length / 1024),
  });
}
