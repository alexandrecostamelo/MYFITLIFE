'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';

const COUNCIL_BY_PROFESSION: Record<string, string> = {
  nutritionist: 'CRN',
  personal_trainer: 'CREF',
  physiotherapist: 'CREFITO',
};

export default function RegisterProfessionalPage() {
  const router = useRouter();
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    profession: 'nutritionist',
    council_number: '',
    council_state: '',
    full_name: '',
    bio: '',
    specialties: '',
    formations: '',
    city: '',
    state: '',
    modalities: [] as string[],
    price_consultation: '',
    price_monthly: '',
    whatsapp: '',
    email: '',
    instagram: '',
    website: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/professionals/mine').then((r) => r.json()).then((d) => {
      setExisting(d.professional);
      setLoading(false);
    });
  }, []);

  function toggleModality(m: string) {
    setForm((prev) => ({
      ...prev,
      modalities: prev.modalities.includes(m)
        ? prev.modalities.filter((x) => x !== m)
        : [...prev.modalities, m],
    }));
  }

  async function submit() {
    if (!form.full_name || !form.council_number || !form.council_state) {
      setError('Nome, registro profissional e estado são obrigatórios');
      return;
    }
    setSaving(true);
    setError(null);

    const payload: any = {
      profession: form.profession,
      council_number: form.council_number,
      council_state: form.council_state,
      full_name: form.full_name,
      bio: form.bio || undefined,
      specialties: form.specialties ? form.specialties.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      formations: form.formations ? form.formations.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      modalities: form.modalities,
      price_consultation: form.price_consultation ? parseFloat(form.price_consultation) : undefined,
      price_monthly: form.price_monthly ? parseFloat(form.price_monthly) : undefined,
      whatsapp: form.whatsapp || undefined,
      email: form.email || undefined,
      instagram: form.instagram || undefined,
      website: form.website || undefined,
    };

    const res = await fetch('/api/professionals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      if (data.error === 'already_registered') setError('Você já tem cadastro de profissional');
      else if (data.error === 'council_already_taken') setError('Este número de registro já está cadastrado');
      else setError(data.error || 'Erro ao salvar');
      return;
    }

    router.push('/app/professionals/mine');
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (existing) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <header className="mb-4 flex items-center gap-2">
          <Link href="/app/professionals" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-xl font-bold">Seu cadastro profissional</h1>
        </header>
        <Card className="mb-4 p-4">
          <p className="text-sm">Você já tem cadastro ativo.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Status: {existing.verified ? '✅ Verificado' : '⏳ Aguardando análise'}
          </p>
        </Card>
        <Button asChild className="w-full"><Link href="/app/professionals/mine">Ir para meu painel</Link></Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/professionals" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">Cadastrar como profissional</h1>
      </header>

      <Card className="mb-4 p-4 text-xs text-muted-foreground">
        Ao se cadastrar, você declara ser profissional habilitado com registro ativo no conselho competente.
        Cadastros com dados falsos são removidos permanentemente.
      </Card>

      <Card className="mb-4 space-y-3 p-4">
        <div>
          <Label>Profissão *</Label>
          <select
            value={form.profession}
            onChange={(e) => setForm({ ...form, profession: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
          >
            <option value="nutritionist">Nutricionista (CRN)</option>
            <option value="personal_trainer">Personal Trainer (CREF)</option>
            <option value="physiotherapist">Fisioterapeuta (CREFITO)</option>
          </select>
        </div>

        <div>
          <Label>Nome completo *</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Como aparece no conselho" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>{COUNCIL_BY_PROFESSION[form.profession]} número *</Label>
            <Input value={form.council_number} onChange={(e) => setForm({ ...form, council_number: e.target.value })} placeholder="12345" />
          </div>
          <div>
            <Label>UF do registro *</Label>
            <Input maxLength={2} value={form.council_state} onChange={(e) => setForm({ ...form, council_state: e.target.value.toUpperCase() })} placeholder="SP" />
          </div>
        </div>

        <div>
          <Label>Bio</Label>
          <textarea
            className="mt-1 w-full rounded-md border border-input bg-transparent p-2 text-sm"
            rows={4}
            placeholder="Quem você é, o que oferece, abordagem..."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <div>
          <Label>Especialidades (separadas por vírgula)</Label>
          <Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Emagrecimento, Nutrição esportiva" />
        </div>

        <div>
          <Label>Formações (separadas por vírgula)</Label>
          <Input value={form.formations} onChange={(e) => setForm({ ...form, formations: e.target.value })} placeholder="USP, Pós em Nutrição Esportiva" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Label>Cidade</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label>UF</Label>
            <Input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
          </div>
        </div>

        <div>
          <Label>Modalidades de atendimento</Label>
          <div className="mt-1 flex gap-2">
            {['online', 'presencial', 'domiciliar'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleModality(m)}
                className={`rounded-md border px-3 py-1 text-xs ${form.modalities.includes(m) ? 'border-primary bg-primary/10' : 'border-input'}`}
              >
                {m === 'online' ? 'Online' : m === 'presencial' ? 'Presencial' : 'Domiciliar'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Preço consulta (R$)</Label>
            <Input type="number" value={form.price_consultation} onChange={(e) => setForm({ ...form, price_consultation: e.target.value })} />
          </div>
          <div>
            <Label>Preço mensal (R$)</Label>
            <Input type="number" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: e.target.value })} />
          </div>
        </div>
      </Card>

      <Card className="mb-4 space-y-3 p-4">
        <h3 className="text-sm font-medium">Contato</h3>
        <div>
          <Label>WhatsApp</Label>
          <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="5518999999999" />
          <p className="mt-1 text-xs text-muted-foreground">Formato: 55 + DDD + número (sem caracteres especiais)</p>
        </div>
        <div>
          <Label>E-mail profissional</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label>Instagram</Label>
          <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@nutri_exemplo" />
        </div>
        <div>
          <Label>Website</Label>
          <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
        </div>
      </Card>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <Button onClick={submit} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar cadastro para análise'}
      </Button>
    </main>
  );
}
