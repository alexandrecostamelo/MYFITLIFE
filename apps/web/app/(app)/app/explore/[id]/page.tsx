'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GymMap } from '@/components/gym-map';
import { ArrowLeft, MapPin, Phone, Globe, Instagram, Star, Users, Loader2, LogIn, LogOut, Heart, CheckCircle, AlertCircle } from 'lucide-react';

export default function GymPlaceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actingCheckin, setActingCheckin] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [activeCheckin, setActiveCheckin] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  async function load() {
    const [detailRes, checkinsRes] = await Promise.all([
      fetch(`/api/gym-places/${id}`).then((r) => r.json()),
      fetch('/api/gym-checkins').then((r) => r.json()),
    ]);
    setData(detailRes);
    setActiveCheckin(checkinsRes.active);
    if (detailRes.my_review) {
      setReviewRating(detailRes.my_review.rating);
      setReviewComment(detailRes.my_review.comment || '');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  async function checkIn(force = false) {
    setActingCheckin(true);
    const res = await fetch('/api/gym-checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gym_place_id: id,
        latitude: position?.lat,
        longitude: position?.lng,
        force,
      }),
    });
    const result = await res.json();
    setActingCheckin(false);

    if (result.error === 'too_far') {
      if (confirm(`Você está a ${result.distance_km} km da academia (máx ${result.max_radius_km * 1000}m). Fazer check-in mesmo assim?`)) {
        await checkIn(true);
      }
      return;
    }

    await load();
  }

  async function checkOut() {
    if (!activeCheckin) return;
    setActingCheckin(true);
    await fetch(`/api/gym-checkins/${activeCheckin.id}/leave`, { method: 'POST' });
    await load();
    setActingCheckin(false);
  }

  async function linkAsMyGym() {
    const res = await fetch('/api/user-gyms/link-place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gym_place_id: id, make_primary: true }),
    });
    if (res.ok) {
      await load();
      alert('Academia vinculada! Aparecerá em "Minhas academias".');
    }
  }

  async function submitReview() {
    await fetch(`/api/gym-places/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: reviewRating, comment: reviewComment || undefined }),
    });
    await load();
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.gym) return <div className="p-6">Academia não encontrada</div>;

  const gym = data.gym;
  const isCheckedInHere = activeCheckin?.gym_place_id === id;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/explore" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">{gym.name}</h1>
      </header>

      <Card className="mb-4 p-4">
        {(gym.address || gym.city) && (
          <div className="mb-2 flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div>
              {gym.address && <div>{gym.address}</div>}
              {(gym.city || gym.state) && (
                <div className="text-muted-foreground">{[gym.city, gym.state].filter(Boolean).join(', ')}</div>
              )}
            </div>
          </div>
        )}

        {gym.phone && (
          <div className="mb-1 flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${gym.phone}`} className="text-primary hover:underline">{gym.phone}</a>
          </div>
        )}

        {gym.website && (
          <div className="mb-1 flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <a href={gym.website} target="_blank" rel="noopener" className="text-primary hover:underline">Website</a>
          </div>
        )}

        {gym.instagram && (
          <div className="mb-1 flex items-center gap-2 text-sm">
            <Instagram className="h-4 w-4 text-muted-foreground" />
            <a href={`https://instagram.com/${gym.instagram.replace('@', '')}`} target="_blank" rel="noopener" className="text-primary hover:underline">{gym.instagram}</a>
          </div>
        )}

        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          {gym.rating_avg && gym.rating_count > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {Number(gym.rating_avg).toFixed(1)} ({gym.rating_count} avaliações)
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {gym.checkins_total} check-ins
          </span>
        </div>
      </Card>

      <Card className="mb-4 overflow-hidden">
        <GymMap
          userLat={position?.lat}
          userLng={position?.lng}
          gyms={[{ id: gym.id, name: gym.name, latitude: gym.latitude, longitude: gym.longitude }]}
          height={240}
        />
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {isCheckedInHere ? (
          <Button onClick={checkOut} disabled={actingCheckin}>
            {actingCheckin ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogOut className="mr-2 h-4 w-4" /> Check-out</>}
          </Button>
        ) : activeCheckin ? (
          <Button disabled variant="outline">Em outra academia</Button>
        ) : (
          <Button onClick={() => checkIn(false)} disabled={actingCheckin}>
            {actingCheckin ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="mr-2 h-4 w-4" /> Check-in</>}
          </Button>
        )}

        {data.my_linked_user_gym_id ? (
          <Button asChild variant="outline">
            <Link href={`/app/gyms/${data.my_linked_user_gym_id}`}>Minha academia</Link>
          </Button>
        ) : (
          <Button variant="outline" onClick={linkAsMyGym}>
            <Heart className="mr-2 h-4 w-4" /> Salvar como minha
          </Button>
        )}
      </div>

      <Card className="mb-4 p-4">
        <h3 className="mb-3 text-sm font-medium">Sua avaliação</h3>
        <div className="mb-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((r) => (
            <button key={r} onClick={() => setReviewRating(r)}>
              <Star className={`h-6 w-6 ${r <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
            </button>
          ))}
        </div>
        <Input
          placeholder="Comentário (opcional)"
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          className="mb-2"
        />
        <Button onClick={submitReview} size="sm" className="w-full">
          {data.my_review ? 'Atualizar avaliação' : 'Enviar avaliação'}
        </Button>
      </Card>

      {gym.claimed_by ? (
        <Card className="mb-4 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Academia verificada</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Esta academia tem um responsável cadastrado na plataforma.</p>
        </Card>
      ) : (
        <Card className="mb-4 border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Sem responsável</span>
            </div>
            <Button asChild size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100">
              <Link href={`/app/explore/${id}/claim`}>Reivindicar</Link>
            </Button>
          </div>
          <p className="mt-1 text-xs text-amber-600">Você é o dono desta academia? Reivindique e acesse o painel B2B.</p>
        </Card>
      )}

      {data.recent_reviews?.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-medium">Avaliações recentes</h3>
          <div className="space-y-3">
            {data.recent_reviews.map((r: any, i: number) => (
              <div key={i} className="border-b pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.user.full_name || r.user.username || 'Usuário'}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="mt-1 text-xs text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}
