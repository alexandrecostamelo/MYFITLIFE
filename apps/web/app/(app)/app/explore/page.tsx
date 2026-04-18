'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GymMap } from '@/components/gym-map';
import { ArrowLeft, MapPin, Plus, Search, Loader2, Star, Navigation } from 'lucide-react';

type Gym = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  rating_avg: number | null;
  rating_count: number;
  checkins_total: number;
  distance_km?: number;
};

export default function ExplorePage() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingPosition, setGettingPosition] = useState(false);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function getLocation() {
    setGettingPosition(true);
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada');
      setGettingPosition(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingPosition(false);
      },
      (err) => {
        alert('Não consegui pegar sua localização: ' + err.message);
        setGettingPosition(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function loadNearby(lat: number, lng: number) {
    setLoading(true);
    const res = await fetch(`/api/gym-places?lat=${lat}&lng=${lng}&radius=10`);
    const data = await res.json();
    setGyms(data.gyms || []);
    setLoading(false);
  }

  async function searchByText() {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (city) params.set('city', city);
    const res = await fetch(`/api/gym-places?${params}`);
    const data = await res.json();
    setGyms(data.gyms || []);
    setLoading(false);
  }

  useEffect(() => {
    if (position) loadNearby(position.lat, position.lng);
  }, [position]);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Explorar academias</h1>
      </header>

      <Card className="mb-4 p-4">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Button onClick={getLocation} disabled={gettingPosition} variant="outline">
            {gettingPosition ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Navigation className="mr-2 h-4 w-4" /> Perto de mim</>
            )}
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/explore/new">
              <Plus className="mr-2 h-4 w-4" /> Cadastrar
            </Link>
          </Button>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Nome da academia"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchByText()}
          />
        </div>
        <Input
          className="mb-2"
          placeholder="Cidade (opcional)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchByText()}
        />
        <Button variant="outline" size="sm" onClick={searchByText} disabled={loading} className="w-full">
          Buscar
        </Button>
      </Card>

      {gyms.length > 0 && (
        <Card className="mb-4 overflow-hidden">
          <GymMap
            userLat={position?.lat}
            userLng={position?.lng}
            gyms={gyms}
            selectedId={selectedId}
            onSelect={setSelectedId}
            height={280}
          />
        </Card>
      )}

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : gyms.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {position ? 'Nenhuma academia na sua região ainda. Cadastre a primeira!' : 'Use "Perto de mim" ou busque por nome/cidade.'}
        </Card>
      ) : (
        <div className="space-y-2">
          {gyms.map((g) => (
            <Link key={g.id} href={`/app/explore/${g.id}`}>
              <Card
                className={`p-3 hover:bg-slate-50 ${selectedId === g.id ? 'border-primary' : ''}`}
                onMouseEnter={() => setSelectedId(g.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{g.name}</div>
                    {g.address && <div className="text-xs text-muted-foreground">{g.address}</div>}
                    {(g.city || g.state) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[g.city, g.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                    <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                      {g.rating_avg && g.rating_count > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {Number(g.rating_avg).toFixed(1)} ({g.rating_count})
                        </span>
                      )}
                      {g.checkins_total > 0 && <span>{g.checkins_total} check-ins</span>}
                    </div>
                  </div>
                  {g.distance_km !== undefined && (
                    <div className="text-right">
                      <div className="text-xs font-medium">{g.distance_km.toFixed(1)} km</div>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
