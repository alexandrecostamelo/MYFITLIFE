import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!professional) {
    return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 403 });
  }

  const body = await request.json();

  const record: Record<string, unknown> = {
    professional_id: user.id,
    document_type: body.document_type || 'cpf',
    document_number: String(body.document_number || '').replace(/\D/g, ''),
    legal_name: body.legal_name || '',
    address_street: body.address_street || '',
    address_number: body.address_number || '',
    address_complement: body.address_complement || null,
    address_neighborhood: body.address_neighborhood || '',
    address_city: body.address_city || '',
    address_state: body.address_state || '',
    address_zip: String(body.address_zip || '').replace(/\D/g, ''),
    address_city_code: body.address_city_code || '',
    municipal_registration: body.municipal_registration || null,
    service_code: body.service_code || '',
    cnae: body.cnae || null,
    tax_rate: Number(body.tax_rate) || 0,
    tax_regime: body.tax_regime || 'simples_nacional',
    is_active: body.is_active !== false,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('professional_fiscal_config')
    .select('id')
    .eq('professional_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('professional_fiscal_config')
      .update(record as Record<string, unknown>)
      .eq('professional_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('professional_fiscal_config')
      .insert(record as Record<string, unknown>);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { data } = await supabase
    .from('professional_fiscal_config')
    .select('*')
    .eq('professional_id', user.id)
    .maybeSingle();

  return NextResponse.json({ config: data || null });
}
