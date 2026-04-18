'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Navigation } from 'lucide-react';

export default function NewGymPlacePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    website: '',
    instagram: '',
    latitude: '',
    longitude: '',
  });
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(k: string, v: string) { setForm({ ...form, [k]: v }); }

  function useCurrentLocation() {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada');
      setGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGettingLocation(false);
      },
      (err) => {
        alert('Não consegui pegar: ' + err.message);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function save() {
    if (!form.name || !form.latitude || !form.longitude) {
      setError('Nome e localização são obrigatórios');
      return;
    }
    setSaving(true);
    setError(null);

    const res = await fetch('/api/gym-places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        phone: form.phone || undefined,
        website: form.website || undefined,
        instagram: form.instagram || undefined,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Erro ao salvar');
      return;
    }

    router.push(`/app/explore/${data.id}`);
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/explore" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Cadastrar academia</h1>
      </header>

      <p className="mb-4 text-xs text-muted-foreground">
        Toda academia cadastrada fica disponível pra todos os usuários do MyFitLife. Você ganha XP por contribuir.
      </p>

      <Card className="mb-4 space-y-3 p-4">
        <div>
          <Label>Nome *</Label>
          <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Smart Fit Centro" />
        </div>

        <div>
          <Label>Endereço</Label>
          <Input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Av. Brasil, 1234" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Cidade</Label>
            <Input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Presidente Prudente" />
          </div>
          <div>
            <Label>Estado</Label>
            <Input value={form.state} onChange={(e) => update('state', e.target.value)} placeholder="SP" />
          </div>
        </div>

        <div>
          <Label>Telefone</Label>
          <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(18) 3322-0000" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Website</Label>
            <Input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input value={form.instagram} onChange={(e) => update('instagram', e.target.value)} placeholder="@academia" />
          </div>
        </div>
      </Card>

      <Card className="mb-4 space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium">Localização *</h3>
            <p className="text-xs text-muted-foreground">Obrigatório para outros usuários encontrarem</p>
          </div>
          <Button variant="outline" size="sm" onClick={useCurrentLocation} disabled={gettingLocation}>
            {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Navigation className="mr-1 h-3 w-3" /> Usar GPS</>
            )}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Latitude</Label>
            <Input value={form.latitude} onChange={(e) => update('latitude', e.target.value)} placeholder="-22.1256" />
          </div>
          <div>
            <Label>Longitude</Label>
            <Input value={form.longitude} onChange={(e) => update('longitude', e.target.value)} placeholder="-51.3889" />
          </div>
        </div>
      </Card>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <Button onClick={save} disabled={saving || !form.name || !form.latitude || !form.longitude} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cadastrar academia'}
      </Button>
    </main>
  );
}
