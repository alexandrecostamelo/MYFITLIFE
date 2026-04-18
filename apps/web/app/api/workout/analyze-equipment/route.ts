import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { EQUIPMENT_VISION_SYSTEM_PROMPT, EQUIPMENT_VISION_USER_PROMPT } from '@myfitlife/ai/prompts/equipment-vision';
import { checkDailyLimit, logUsage } from '@/lib/rate-limit';
import sharp from 'sharp';

export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DAILY_LIMIT = 50;

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const limit = await checkDailyLimit(user.id, 'equipment_vision', DAILY_LIMIT);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'daily_limit_reached', message: `Limite diário de ${DAILY_LIMIT} análises atingido.` },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const file = formData.get('photo') as File | null;

  if (!file) return NextResponse.json({ error: 'no_photo' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'file_too_large' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'invalid_file_type' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const compressed = await sharp(buffer)
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const base64 = compressed.toString('base64');

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: EQUIPMENT_VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            { type: 'text', text: EQUIPMENT_VISION_USER_PROMPT },
          ],
        },
      ],
    });

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))
      .join('\n');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await logUsage(user.id, 'equipment_vision', 1);
      return NextResponse.json({ error: 'ai_no_json' }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);

    if (!result.is_gym_equipment) {
      await logUsage(user.id, 'equipment_vision', 1);
      return NextResponse.json({
        error: 'not_equipment',
        message: 'Não identifiquei aparelho de academia na foto. Tente outra foto mais clara.',
        notes: result.notes,
      }, { status: 400 });
    }

    const detectedName = result.equipment_name_pt || 'Aparelho desconhecido';
    const muscles: string[] = result.primary_muscles || [];

    const { data: byName } = await supabase
      .from('exercises')
      .select('id, slug, name_pt, category, primary_muscles, secondary_muscles, equipment, difficulty, instructions, common_mistakes, breathing_notes')
      .ilike('name_pt', `%${detectedName.split(' ')[0]}%`)
      .limit(10);

    let byMuscles: any[] = [];
    if (muscles.length > 0) {
      const { data } = await supabase
        .from('exercises')
        .select('id, slug, name_pt, category, primary_muscles, secondary_muscles, equipment, difficulty, instructions, common_mistakes, breathing_notes')
        .overlaps('primary_muscles', muscles)
        .limit(15);
      byMuscles = data || [];
    }

    const allCandidates = [...(byName || []), ...byMuscles];
    const seen = new Set<string>();
    const unique = allCandidates.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    const normalizedDetected = normalize(detectedName);
    const scored = unique.map((ex) => {
      let score = 0;
      const nameNorm = normalize(ex.name_pt);
      if (nameNorm.includes(normalizedDetected) || normalizedDetected.includes(nameNorm.split(' ')[0])) score += 10;

      const muscleOverlap = (ex.primary_muscles || []).filter((m: string) =>
        muscles.some((dm: string) => normalize(m).includes(normalize(dm)) || normalize(dm).includes(normalize(m)))
      ).length;
      score += muscleOverlap * 3;

      if (result.category === ex.category) score += 2;

      return { ...ex, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topSuggestions = scored.slice(0, 5);

    let photoPath: string | null = null;
    try {
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { data: uploaded } = await supabase.storage
        .from('equipment-photos')
        .upload(fileName, compressed, { contentType: 'image/jpeg' });
      if (uploaded) photoPath = uploaded.path;
    } catch (e) {
      console.error('[analyze-equipment] storage error', e);
    }

    const { data: recognition } = await supabase
      .from('equipment_recognitions')
      .insert({
        user_id: user.id,
        photo_path: photoPath,
        detected_name: detectedName,
        detected_name_en: result.equipment_name_en,
        category: result.category,
        primary_muscles: muscles,
        confidence: result.confidence,
        suggested_exercises: topSuggestions.map((e) => ({ id: e.id, name_pt: e.name_pt, score: e.score })),
      })
      .select('id')
      .single();

    await logUsage(user.id, 'equipment_vision', 1);

    const { awardXp: axp, checkAchievements: cka } = await import('@/lib/gamification');
    await axp(supabase, user.id, 'EQUIPMENT_SCAN');
    await cka(supabase, user.id);

    return NextResponse.json({
      recognition_id: recognition?.id,
      equipment: {
        name_pt: detectedName,
        name_en: result.equipment_name_en,
        category: result.category,
        primary_muscles: muscles,
        confidence: result.confidence,
        possible_alternatives: result.possible_alternatives || [],
        how_to_use: result.how_to_use,
        common_mistakes: result.common_mistakes || [],
        notes: result.notes,
      },
      suggestions: topSuggestions,
      photo_path: photoPath,
      usage: {
        used_today: limit.usedToday + 1,
        remaining: limit.remaining - 1,
        daily_limit: DAILY_LIMIT,
      },
    });
  } catch (err) {
    console.error('[analyze-equipment]', err);
    return NextResponse.json({ error: 'ai_error' }, { status: 500 });
  }
}
