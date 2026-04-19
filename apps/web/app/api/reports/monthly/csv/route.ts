import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildMonthlyReport } from '@/lib/monthly-report';
import { buildMonthlyCSV } from '@/lib/csv-export';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const year = parseInt(req.nextUrl.searchParams.get('year') || String(new Date().getFullYear()));
  const month = parseInt(req.nextUrl.searchParams.get('month') || String(new Date().getMonth() + 1));

  if (month < 1 || month > 12) return NextResponse.json({ error: 'invalid_month' }, { status: 400 });

  const data = await buildMonthlyReport(supabase, user.id, user.email || '', year, month);
  const csv = buildMonthlyCSV(data);
  const bom = '\uFEFF';
  const filename = `myfitlife-${year}-${String(month).padStart(2, '0')}.csv`;

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
