import { http, HttpResponse } from 'msw';

const BASE = 'https://test.supabase.co';

export const mockUser = {
  id: 'user-123',
  email: 'test@myfitlife.app',
  user_metadata: { full_name: 'Alex Teste' },
  app_metadata: { provider: 'email' },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
};

const mockProfile = {
  id: 'user-123',
  email: 'test@myfitlife.app',
  full_name: 'Alex Teste',
  username: 'alex',
  avatar_url: null,
  city: 'Presidente Prudente',
  state: 'SP',
  subscription_tier: 'pro',
  subscription_status: 'active',
};

export const supabaseDbState: Record<string, unknown[]> = {
  profiles: [mockProfile],
  user_profiles: [{ user_id: 'user-123', goal: 'gain_muscle', experience_level: 'intermediate' }],
  daily_plans: [],
  meal_logs: [],
  workout_logs: [],
  morning_checkins: [],
  foods: [
    { id: 'food-1', name: 'Frango grelhado', kcal_per_100g: 165, protein: 31, carbs: 0, fat: 3.6 },
    { id: 'food-2', name: 'Arroz branco cozido', kcal_per_100g: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  ],
};

export function resetSupabaseState() {
  supabaseDbState.daily_plans = [];
  supabaseDbState.meal_logs = [];
  supabaseDbState.workout_logs = [];
  supabaseDbState.morning_checkins = [];
}

export const supabaseHandlers = [
  http.get(`${BASE}/auth/v1/user`, () => HttpResponse.json(mockUser)),

  http.post(`${BASE}/auth/v1/token`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (body?.email === 'bad@test.com') {
      return HttpResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid login credentials' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      access_token: 'mock-access',
      refresh_token: 'mock-refresh',
      token_type: 'bearer',
      expires_in: 3600,
      user: mockUser,
    });
  }),

  http.post(`${BASE}/auth/v1/logout`, () => new HttpResponse(null, { status: 204 })),

  http.get(`${BASE}/rest/v1/:table`, ({ request, params }) => {
    const table = params.table as string;
    const url = new URL(request.url);
    const data = supabaseDbState[table] || [];
    let filtered = [...data] as Record<string, unknown>[];

    for (const [key, value] of url.searchParams.entries()) {
      if (['select', 'order', 'limit', 'offset'].includes(key)) continue;
      const dotIdx = value.indexOf('.');
      if (dotIdx === -1) continue;
      const op = value.slice(0, dotIdx);
      const v = value.slice(dotIdx + 1);
      if (op === 'eq') {
        filtered = filtered.filter((row) => String(row[key]) === v);
      }
    }

    const limit = Number(url.searchParams.get('limit') || 0);
    if (limit > 0) filtered = filtered.slice(0, limit);

    return HttpResponse.json(filtered);
  }),

  http.post(`${BASE}/rest/v1/:table`, async ({ request, params }) => {
    const table = params.table as string;
    const body = (await request.json()) as Record<string, unknown>;
    const record = {
      id: `mock-${table}-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
    };
    if (!supabaseDbState[table]) supabaseDbState[table] = [];
    supabaseDbState[table].push(record);
    return HttpResponse.json([record], { status: 201 });
  }),

  http.patch(`${BASE}/rest/v1/:table`, async ({ request, params }) => {
    const table = params.table as string;
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json([{ table, ...body, updated_at: new Date().toISOString() }]);
  }),

  http.delete(`${BASE}/rest/v1/:table`, () => HttpResponse.json([], { status: 200 })),

  http.get(`${BASE}/storage/v1/object/:bucket/*`, () =>
    new HttpResponse(new Blob(['mock-image'], { type: 'image/jpeg' }), { status: 200 })
  ),

  http.post(`${BASE}/storage/v1/object/:bucket/*`, () =>
    HttpResponse.json({ Key: 'mock-path' }, { status: 200 })
  ),
];
