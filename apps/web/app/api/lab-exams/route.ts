import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { LAB_EXTRACTION_SYSTEM } from '@myfitlife/ai/prompts/lab-extraction';
import { matchMarkerKey, findReferenceByKey, classifyValue } from '@myfitlife/core/biomarkers';
import { checkDailyLimit, logUsage } from '@/lib/rate-limit';

export const maxDuration = 120;

const DAILY_LIMIT = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('lab_exams')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ exams: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const limit = await checkDailyLimit(user.id, 'lab_extraction', DAILY_LIMIT);
  if (!limit.allowed) return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'file_too_large' }, { status: 400 });

  const isPdf = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  if (!isPdf && !isImage) return NextResponse.json({ error: 'invalid_type' }, { status: 400 });

  const arrayBuf = await file.arrayBuffer();
  const buffer = Buffer.from(new Uint8Array(arrayBuf));
  const ext = isPdf ? 'pdf' : (file.name.split('.').pop() || 'jpg');
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('lab-exams')
    .upload(fileName, buffer, { contentType: file.type });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: inserted, error: insertErr } = await supabase
    .from('lab_exams')
    .insert({
      user_id: user.id,
      file_path: fileName,
      title: file.name,
      processed: false,
    })
    .select('id')
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  const examId = inserted.id;

  try {
    const anthropic = getAnthropicClient();
    const base64 = buffer.toString('base64');
    const mediaType = isPdf ? 'application/pdf' : (file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp');

    const content: any[] = [
      isPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
        : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
      { type: 'text', text: 'Extraia todos os biomarcadores deste exame laboratorial em JSON conforme o sistema solicita.' },
    ];

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: LAB_EXTRACTION_SYSTEM,
      messages: [{ role: 'user', content }],
    });

    const text = response.content.filter((c) => c.type === 'text').map((c) => ('text' in c ? c.text : '')).join('\n');
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      await supabase.from('lab_exams').update({ processed: true, processing_error: 'no_json' }).eq('id', examId);
      await logUsage(user.id, 'lab_extraction', 1);
      return NextResponse.json({ id: examId, error: 'no_json_extracted' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const results = parsed.results || [];

    const biomarkerInserts = results.map((r: any) => {
      const key = matchMarkerKey(r.name);
      const ref = key ? findReferenceByKey(key) : null;

      let status: string | null = null;
      if (ref && typeof r.value === 'number') {
        status = classifyValue(r.value, ref);
      } else if (typeof r.reference_min === 'number' && typeof r.reference_max === 'number' && typeof r.value === 'number') {
        if (r.value < r.reference_min) status = 'low';
        else if (r.value > r.reference_max) status = 'high';
        else status = 'normal';
      }

      return {
        user_id: user.id,
        lab_exam_id: examId,
        marker_key: key || `raw_${r.name.toLowerCase().replace(/\s+/g, '_').slice(0, 40)}`,
        marker_name: r.name,
        value: r.value,
        unit: r.unit || 'unit',
        reference_min: r.reference_min ?? ref?.min ?? null,
        reference_max: r.reference_max ?? ref?.max ?? null,
        status,
        measured_at: parsed.exam_date || new Date().toISOString().slice(0, 10),
      };
    }).filter((b: any) => typeof b.value === 'number' && !isNaN(b.value));

    if (biomarkerInserts.length > 0) {
      await supabase.from('biomarkers').insert(biomarkerInserts);
    }

    await supabase.from('lab_exams').update({
      processed: true,
      exam_date: parsed.exam_date || null,
      lab_name: parsed.lab_name || null,
      raw_extraction: parsed,
    }).eq('id', examId);

    await logUsage(user.id, 'lab_extraction', 1);
    return NextResponse.json({ id: examId, markers_extracted: biomarkerInserts.length });
  } catch (err: any) {
    console.error('[lab-exams]', err);
    await supabase.from('lab_exams').update({ processed: true, processing_error: err.message || 'unknown' }).eq('id', examId);
    return NextResponse.json({ id: examId, error: 'ai_error' });
  }
}
