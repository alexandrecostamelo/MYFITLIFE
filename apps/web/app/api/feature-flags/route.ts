import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllFlagsForUser } from '@/lib/feature-flags';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const flags = await getAllFlagsForUser(supabase, user?.id);
  return NextResponse.json({ flags });
}
