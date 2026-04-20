'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface FiscalConfig {
  document_type?: string;
  document_number?: string;
  legal_name?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_city_code?: string;
  municipal_registration?: string;
  service_code?: string;
  cnae?: string;
  tax_rate?: number;
  tax_regime?: string;
  is_active?: boolean;
}

export default function FiscalClient({ initialConfig }: { initialConfig: FiscalConfig | null }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    document_type: initialConfig?.document_type || 'cpf',
    document_number: initialConfig?.document_number || '',
    legal_name: initialConfig?.legal_name || '',
    address_street: initialConfig?.address_street || '',
    address_number: initialConfig?.address_number || '',
    address_complement: initialConfig?.address_complement || '',
    address_neighborhood: initialConfig?.address_neighborhood || '',
    address_city: initialConfig?.address_city || '',
    address_state: initialConfig?.address_state || '',
    address_zip: initialConfig?.address_zip || '',
    address_city_code: initialConfig?.address_city_code || '',
    municipal_registration: initialConfig?.municipal_registration || '',
    service_code: initialConfig?.service_code || '',
    cnae: initialConfig?.cnae || '',
    tax_rate: initialConfig?.tax_rate ?? 0.05,
    tax_regime: initialConfig?.tax_regime || 'simples_nacional',
    is_active: initialConfig?.is_active !== false,
  });

  function updateField(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/professional/fiscal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Erro: ${data.error || 'Falha ao salvar'}`);
      } else {
        setMessage('Configuração fiscal salva com sucesso!');
      }
    } catch {
      setMessage('Erro de rede ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary';
  const labelClass = 'block text-sm font-medium text-muted-foreground mb-1';

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/app/professional">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Configuração Fiscal</h1>
          <p className="text-sm text-muted-foreground">Dados para emissão de NFSe</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Dados do Prestador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo de Documento</label>
              <select
                className={inputClass}
                value={form.document_type}
                onChange={(e) => updateField('document_type', e.target.value)}
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                {form.document_type === 'cpf' ? 'CPF' : 'CNPJ'}
              </label>
              <input
                className={inputClass}
                value={form.document_number}
                onChange={(e) => updateField('document_number', e.target.value)}
                placeholder={form.document_type === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Razão Social / Nome Completo</label>
            <input
              className={inputClass}
              value={form.legal_name}
              onChange={(e) => updateField('legal_name', e.target.value)}
              placeholder="Nome conforme registro fiscal"
            />
          </div>

          <div>
            <label className={labelClass}>Inscrição Municipal</label>
            <input
              className={inputClass}
              value={form.municipal_registration}
              onChange={(e) => updateField('municipal_registration', e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Logradouro</label>
              <input
                className={inputClass}
                value={form.address_street}
                onChange={(e) => updateField('address_street', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Número</label>
              <input
                className={inputClass}
                value={form.address_number}
                onChange={(e) => updateField('address_number', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Complemento</label>
            <input
              className={inputClass}
              value={form.address_complement}
              onChange={(e) => updateField('address_complement', e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Bairro</label>
              <input
                className={inputClass}
                value={form.address_neighborhood}
                onChange={(e) => updateField('address_neighborhood', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Cidade</label>
              <input
                className={inputClass}
                value={form.address_city}
                onChange={(e) => updateField('address_city', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Estado</label>
              <select
                className={inputClass}
                value={form.address_state}
                onChange={(e) => updateField('address_state', e.target.value)}
              >
                <option value="">UF</option>
                {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(
                  (uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className={labelClass}>CEP</label>
              <input
                className={inputClass}
                value={form.address_zip}
                onChange={(e) => updateField('address_zip', e.target.value)}
                placeholder="00000-000"
              />
            </div>
            <div>
              <label className={labelClass}>Cód. Município (IBGE)</label>
              <input
                className={inputClass}
                value={form.address_city_code}
                onChange={(e) => updateField('address_city_code', e.target.value)}
                placeholder="Ex: 3550308"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tributação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Código de Serviço (LC 116)</label>
              <input
                className={inputClass}
                value={form.service_code}
                onChange={(e) => updateField('service_code', e.target.value)}
                placeholder="Ex: 06.01"
              />
            </div>
            <div>
              <label className={labelClass}>CNAE</label>
              <input
                className={inputClass}
                value={form.cnae}
                onChange={(e) => updateField('cnae', e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Alíquota ISS (%)</label>
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={form.tax_rate}
                onChange={(e) => updateField('tax_rate', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Valor decimal (ex: 0.05 = 5%)
              </p>
            </div>
            <div>
              <label className={labelClass}>Regime Tributário</label>
              <select
                className={inputClass}
                value={form.tax_regime}
                onChange={(e) => updateField('tax_regime', e.target.value)}
              >
                <option value="simples_nacional">Simples Nacional</option>
                <option value="lucro_presumido">Lucro Presumido</option>
                <option value="lucro_real">Lucro Real</option>
                <option value="mei">MEI</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => updateField('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="is_active" className="text-sm">
              Emissão automática de NFSe ativa
            </label>
          </div>
        </CardContent>
      </Card>

      {message && (
        <p className={`text-sm ${message.startsWith('Erro') ? 'text-destructive' : 'text-green-600'}`}>
          {message}
        </p>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Configuração Fiscal
      </Button>
    </div>
  );
}
