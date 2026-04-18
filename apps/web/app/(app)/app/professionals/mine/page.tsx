'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CheckCircle, Clock, Camera, Eye } from 'lucide-react';

export default function MyProfessionalPage() {
  const [pro, setPro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch('/api/professionals/mine');
    const data = await res.json();
    setPro(data.professional);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function update(field: string, value: any) {
    setSaving(true);
    await fetch('/api/professionals/mine', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    await load();
    setSaving(false);
  }

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);
    await fetch('/api/professionals/mine/avatar', { method: 'POST', body: formData });
    await load();
    setUploadingAvatar(false);
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (!pro) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <Card className="p-6 text-center">
          <p className="mb-3 text-sm">Você ainda não tem cadastro profissional.</p>
          <Button asChild><Link href="/app/professionals/register">Cadastrar agora</Link></Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/professionals" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">Meu perfil profissional</h1>
      </header>

      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-200">
              {pro.avatar_url ? (
                <img src={pro.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl text-slate-500">
                  {pro.full_name.charAt(0)}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-white"
            >
              {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
            />
          </div>
          <div>
            <div className="font-medium">{pro.full_name}</div>
            <div className="text-xs text-muted-foreground">
              {pro.council_type} {pro.council_number}/{pro.council_state}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {pro.verified ? (
                <span className="flex items-center gap-1 text-green-700">
                  <CheckCircle className="h-3 w-3" /> Verificado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-700">
                  <Clock className="h-3 w-3" /> Aguardando análise
                </span>
              )}
            </div>
          </div>
        </div>

        {pro.verified && (
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link href={`/app/professionals/${pro.id}`}>
              <Eye className="mr-2 h-4 w-4" /> Ver perfil público
            </Link>
          </Button>
        )}
      </Card>

      <Card className="mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Status no marketplace</h3>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={pro.active}
              onChange={(e) => update('active', e.target.checked)}
              disabled={saving}
            />
            <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5" />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          {pro.active ? 'Aparecendo nas buscas (se verificado)' : 'Oculto das buscas'}
        </p>
      </Card>

      <Card className="mb-4 space-y-3 p-4">
        <h3 className="text-sm font-medium">Editar informações</h3>
        <EditField label="Bio" value={pro.bio || ''} onSave={(v) => update('bio', v)} multiline />
        <EditField
          label="Especialidades (separe por vírgula)"
          value={(pro.specialties || []).join(', ')}
          onSave={(v) => update('specialties', v.split(',').map((s: string) => s.trim()).filter(Boolean))}
        />
        <EditField label="Cidade" value={pro.city || ''} onSave={(v) => update('city', v)} />
        <EditField
          label="Preço consulta (R$)"
          value={pro.price_consultation?.toString() || ''}
          onSave={(v) => update('price_consultation', v ? parseFloat(v) : null)}
          type="number"
        />
        <EditField
          label="Preço mensal (R$)"
          value={pro.price_monthly?.toString() || ''}
          onSave={(v) => update('price_monthly', v ? parseFloat(v) : null)}
          type="number"
        />
        <EditField label="WhatsApp" value={pro.whatsapp || ''} onSave={(v) => update('whatsapp', v)} />
        <EditField label="E-mail" value={pro.email || ''} onSave={(v) => update('email', v)} />
      </Card>
    </main>
  );
}

function EditField({ label, value, onSave, multiline = false, type = 'text' }: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} className="cursor-pointer rounded border border-transparent p-2 hover:border-input">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm">{value || <span className="italic text-muted-foreground">vazio</span>}</div>
      </div>
    );
  }

  return (
    <div className="rounded border border-primary p-2">
      <Label>{label}</Label>
      {multiline ? (
        <textarea
          className="mt-1 w-full rounded-md border border-input bg-transparent p-2 text-sm"
          rows={4}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          autoFocus
        />
      ) : (
        <Input type={type} value={local} onChange={(e) => setLocal(e.target.value)} autoFocus />
      )}
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={() => { onSave(local); setEditing(false); }}>Salvar</Button>
        <Button size="sm" variant="outline" onClick={() => { setLocal(value); setEditing(false); }}>Cancelar</Button>
      </div>
    </div>
  );
}
