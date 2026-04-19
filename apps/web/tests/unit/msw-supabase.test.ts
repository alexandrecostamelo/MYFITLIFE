import { describe, it, expect, beforeEach } from 'vitest';
import { resetSupabaseState, supabaseDbState } from '../msw/supabase-handlers';

const BASE = 'https://test.supabase.co';
const HEADERS = {
  'Content-Type': 'application/json',
  apikey: 'test-anon-key',
  Authorization: 'Bearer mock-access',
};

describe('MSW — Supabase REST mock', () => {
  beforeEach(() => resetSupabaseState());

  it('GET /rest/v1/profiles retorna perfil mockado', async () => {
    const res = await fetch(`${BASE}/rest/v1/profiles?select=*&id=eq.user-123`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const data = await res.json() as { id: string; full_name: string }[];
    expect(data[0].id).toBe('user-123');
    expect(data[0].full_name).toBe('Alex Teste');
  });

  it('GET /rest/v1/foods retorna alimentos mockados', async () => {
    const res = await fetch(`${BASE}/rest/v1/foods?select=*`, { headers: HEADERS });
    const data = await res.json() as unknown[];
    expect(data).toHaveLength(2);
  });

  it('POST /rest/v1/meal_logs insere e retorna registro', async () => {
    const res = await fetch(`${BASE}/rest/v1/meal_logs`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ user_id: 'user-123', food_id: 'food-1', quantity_g: 200 }),
    });
    expect(res.status).toBe(201);
    const data = await res.json() as { id: string }[];
    expect(data[0].id).toMatch(/^mock-meal_logs-/);
    expect(supabaseDbState.meal_logs).toHaveLength(1);
  });

  it('GET /rest/v1/daily_plans retorna lista vazia inicialmente', async () => {
    const res = await fetch(`${BASE}/rest/v1/daily_plans?select=*&user_id=eq.user-123`, { headers: HEADERS });
    const data = await res.json() as unknown[];
    expect(data).toHaveLength(0);
  });

  it('PATCH /rest/v1/profiles atualiza e retorna dados', async () => {
    const res = await fetch(`${BASE}/rest/v1/profiles?id=eq.user-123`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ city: 'São Paulo' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { city: string }[];
    expect(data[0].city).toBe('São Paulo');
  });

  it('POST /auth/v1/token aceita credenciais válidas', async () => {
    const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ email: 'test@myfitlife.app', password: 'any-password' }),
    });
    const data = await res.json() as { access_token: string };
    expect(data.access_token).toBe('mock-access');
  });

  it('POST /auth/v1/token rejeita credenciais bad@test.com', async () => {
    const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ email: 'bad@test.com', password: 'wrong' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toBe('invalid_grant');
  });
});
