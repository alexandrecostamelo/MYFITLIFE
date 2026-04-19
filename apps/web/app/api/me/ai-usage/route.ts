import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LIMITS, getUsageFor } from '@/lib/rate-limit-v2';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const usage = await Promise.all(
    Object.keys(LIMITS).map(async (bucket) => ({
      bucket,
      ...(await getUsageFor(supabase, user.id, bucket)),
    }))
  );

  return NextResponse.json({ usage });
}
