import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';

const bodySchema = z.object({
  confirmation: z.literal('EXCLUIR'),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid_confirmation' }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!serviceKey) {
    return NextResponse.json({ error: 'server_not_configured' }, { status: 500 });
  }
  const admin = createServiceClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Delete user data from tables (CASCADE on profiles should handle most)
    const tables = [
      { table: 'coach_conversations', column: 'user_id' },
      { table: 'daily_plans', column: 'user_id' },
      { table: 'morning_checkins', column: 'user_id' },
      { table: 'weight_logs', column: 'user_id' },
      { table: 'meal_logs', column: 'user_id' },
      { table: 'workout_logs', column: 'user_id' },
      { table: 'user_profiles', column: 'user_id' },
      { table: 'profiles', column: 'id' },
    ];

    for (const { table, column } of tables) {
      await admin.from(table).delete().eq(column, user.id);
    }

    const { error: deleteUserErr } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserErr) {
      console.error('[account/delete] auth delete error:', deleteUserErr);
      return NextResponse.json({ error: 'failed_to_delete_auth_user' }, { status: 500 });
    }

    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[account/delete]', err);
    return NextResponse.json({ error: 'deletion_failed' }, { status: 500 });
  }
}
