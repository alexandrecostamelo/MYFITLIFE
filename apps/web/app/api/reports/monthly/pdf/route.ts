import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildMonthlyReport } from '@/lib/monthly-report';
import { generatePDFBuffer } from '@/lib/pdf-report';
// generatePDFBuffer returns Uint8Array which is valid BodyInit

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const year = parseInt(req.nextUrl.searchParams.get('year') || String(new Date().getFullYear()));
  const month = parseInt(req.nextUrl.searchParams.get('month') || String(new Date().getMonth() + 1));

  if (month < 1 || month > 12) return NextResponse.json({ error: 'invalid_month' }, { status: 400 });

  const data = await buildMonthlyReport(supabase, user.id, user.email || '', year, month);
  const buffer = await generatePDFBuffer(data);
  const filename = `myfitlife-${year}-${String(month).padStart(2, '0')}.pdf`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
