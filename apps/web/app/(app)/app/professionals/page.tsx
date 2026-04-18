'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Star, MapPin, Loader2, CheckCircle, Heart } from 'lucide-react';

const PROFESSIONS = [
  { value: '', label: 'Todos' },
  { value: 'nutritionist', label: 'Nutricionista' },
  { value: 'personal_trainer', label: 'Personal' },
  { value: 'physiotherapist', label: 'Fisioterapeuta' },
];

const PROFESSION_LABELS: Record<string, string> = {
  nutritionist: 'Nutricionista',
  personal_trainer: 'Personal',
  physiotherapist: 'Fisioterapeuta',
};

const MODALITIES = [
  { value: '', label: 'Todas' },
  { value: 'online', label: 'Online' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'domiciliar', label: 'Domicílio' },
];

export default function ProfessionalsPage() {
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profession, setProfession] = useState('');
  const [modality, setModality] = useState('');
  const [city, setCity] = useState('');
  const [q, setQ] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (profession) params.set('profession', profession);
    if (modality) params.set('modality', modality);
    if (city) params.set('city', city);
    if (q) params.set('q', q);
    if (maxPrice) params.set('max_price', maxPrice);

    const res = await fetch(`/api/professionals?${params}`);
    const data = await res.json();
    setPros(data.professionals || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [profession, modality]);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Profissionais</h1>
      </header>

      <Card className="mb-4 space-y-3 p-4">
        <div className="grid grid-cols-4 gap-1">
          {PROFESSIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setProfession(p.value)}
              className={`rounded-md border px-2 py-1.5 text-xs ${profession === p.value ? 'border-primary bg-primary/10' : 'border-input'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Nome ou especialidade"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Cidade"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
          <Input
            type="number"
            placeholder="Preço máx. consulta"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>

        <div className="flex gap-1">
          {MODALITIES.map((m) => (
            <button
              key={m.value}
              onClick={() => setModality(m.value)}
              className={`flex-1 rounded-md border px-2 py-1 text-xs ${modality === m.value ? 'border-primary bg-primary/10' : 'border-input'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Button onClick={load} variant="outline" size="sm" className="w-full">Buscar</Button>
      </Card>

      <div className="mb-3 flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href="/app/professionals/favorites"><Heart className="mr-1 h-3 w-3" /> Favoritos</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href="/app/professionals/register">Sou profissional</Link>
        </Button>
      </div>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : pros.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum profissional encontrado com esses filtros.
        </Card>
      ) : (
        <div className="space-y-2">
          {pros.map((p) => (
            <Link key={p.id} href={`/app/professionals/${p.id}`}>
              <Card className="p-3 hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-medium text-slate-500">
                        {p.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{p.full_name}</span>
                      {p.verified && <CheckCircle className="h-3 w-3 fill-blue-500 text-white" />}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {PROFESSION_LABELS[p.profession]} · {p.council_type} {p.council_number}/{p.council_state}
                    </div>
                    {(p.city || p.state) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[p.city, p.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {p.specialties?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.specialties.slice(0, 3).map((s: string, i: number) => (
                          <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{s}</span>
                        ))}
                        {p.specialties.length > 3 && <span className="text-xs text-muted-foreground">+{p.specialties.length - 3}</span>}
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      {p.rating_count > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-700">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {Number(p.rating_avg).toFixed(1)} ({p.rating_count})
                        </span>
                      )}
                      {p.price_consultation && (
                        <span className="text-muted-foreground">
                          R$ {Number(p.price_consultation).toFixed(0)}/consulta
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
