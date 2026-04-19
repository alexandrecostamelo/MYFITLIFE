import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { FOOD_VISION_SYSTEM_PROMPT, buildFoodVisionUserPrompt } from '@myfitlife/ai/prompts/food-vision';
import { logUsage } from '@/lib/rate-limit';
import { enforceRateLimit } from '@/lib/rate-limit/with-rate-limit';
import sharp from 'sharp';

export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const gate = await enforceRateLimit(req, 'recognize_food');
  if (gate instanceof NextResponse) return gate;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('photo') as File | null;
  const mealType = formData.get('meal_type') as string | null;

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

  const hour = new Date().getHours();
  const timeOfDay = hour < 10 ? 'manhã' : hour < 15 ? 'almoço' : hour < 18 ? 'tarde' : 'noite';

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: FOOD_VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64,
              },
            },
            {
              type: 'text',
              text: buildFoodVisionUserPrompt({ mealType: mealType || undefined, timeOfDay }),
            },
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
      return NextResponse.json({ error: 'ai_no_json', raw: text }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);

    if (!result.is_food_photo) {
      await logUsage(user.id, 'food_vision', 1);
      return NextResponse.json({
        error: 'not_food_photo',
        message: 'Não consegui identificar alimentos nessa foto. Tente outra foto mais clara do prato.',
      }, { status: 400 });
    }

    const items = result.items || [];

    const matchedItems = [];
    for (const item of items) {
      const normalized = item.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const { data: matches } = await supabase
        .from('foods')
        .select('id, name, calories_kcal, protein_g, carbs_g, fats_g')
        .ilike('name', `%${normalized}%`)
        .limit(1);

      const match = matches?.[0];
      const factor = (item.estimated_grams || 0) / 100;

      if (match) {
        matchedItems.push({
          food_id: match.id,
          food_name: match.name,
          detected_name: item.name,
          amount_g: item.estimated_grams,
          confidence: item.confidence,
          notes: item.notes,
          matched: true,
          calories_kcal: Math.round(match.calories_kcal * factor * 100) / 100,
          protein_g: Math.round(match.protein_g * factor * 100) / 100,
          carbs_g: Math.round(match.carbs_g * factor * 100) / 100,
          fats_g: Math.round(match.fats_g * factor * 100) / 100,
        });
      } else {
        matchedItems.push({
          food_id: null,
          food_name: null,
          detected_name: item.name,
          amount_g: item.estimated_grams,
          confidence: item.confidence,
          notes: item.notes,
          matched: false,
          calories_kcal: null,
          protein_g: null,
          carbs_g: null,
          fats_g: null,
        });
      }
    }

    let photoUrl: string | null = null;
    try {
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { data: uploaded } = await supabase.storage
        .from('meal-photos')
        .upload(fileName, compressed, { contentType: 'image/jpeg' });
      if (uploaded) photoUrl = uploaded.path;
    } catch (e) {
      console.error('[analyze-photo] storage error', e);
    }

    await logUsage(user.id, 'food_vision', 1);

    return NextResponse.json({
      meal_description: result.meal_description,
      confidence_overall: result.confidence_overall,
      items: matchedItems,
      warnings: result.warnings || [],
      photo_path: photoUrl,
    });
  } catch (err) {
    console.error('[analyze-photo]', err);
    return NextResponse.json({ error: 'ai_error' }, { status: 500 });
  }
}
