import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateWeightPrediction } from '@/lib/predictions/weight';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const prediction = await calculateWeightPrediction(user.id);
  if (!prediction) {
    return NextResponse.json(
      { error: 'not_enough_data', min_entries: 3 },
      { status: 404 }
    );
  }

  return NextResponse.json(prediction);
}
