import { http, HttpResponse } from 'msw';

const BASE = 'https://api.anthropic.com';

export const anthropicHandlers = [
  http.post(`${BASE}/v1/messages`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const messages = body.messages as { role: string; content: unknown }[] | undefined;
    const firstContent = messages?.[0]?.content;
    const isImageRequest =
      Array.isArray(firstContent) &&
      (firstContent as { type: string }[]).some((c) => c.type === 'image');

    const systemPrompt = body.system as string | undefined;

    if (isImageRequest && systemPrompt?.includes('moderador')) {
      return HttpResponse.json({
        id: 'msg_mock_mod',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'auto_approved',
              confidence: 0.92,
              flags: [],
              reasoning: 'Fotos de fitness apropriadas, sem problemas detectados.',
            }),
          },
        ],
        model: body.model,
        stop_reason: 'end_turn',
        usage: { input_tokens: 500, output_tokens: 60 },
      });
    }

    if (isImageRequest) {
      return HttpResponse.json({
        id: 'msg_mock_vision',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              items: [
                { name: 'Frango grelhado', quantity_g: 150, confidence: 0.85 },
                { name: 'Arroz', quantity_g: 100, confidence: 0.9 },
              ],
              estimated_calories: 378,
              reasoning: 'Vejo peito de frango e porção de arroz.',
            }),
          },
        ],
        model: body.model,
        stop_reason: 'end_turn',
        usage: { input_tokens: 300, output_tokens: 80 },
      });
    }

    return HttpResponse.json({
      id: 'msg_mock',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Resposta mock do coach pro teste.' }],
      model: body.model || 'claude-sonnet-4-6',
      stop_reason: 'end_turn',
      usage: { input_tokens: 100, output_tokens: 50 },
    });
  }),
];
