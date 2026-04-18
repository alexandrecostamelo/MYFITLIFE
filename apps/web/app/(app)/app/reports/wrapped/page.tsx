'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';

const SLIDES = [
  'intro', 'workouts', 'sets', 'nutrition', 'consistency', 'special', 'achievements', 'closing',
] as const;

export default function WrappedPage() {
  const currentYear = new Date().getFullYear();
  const [data, setData] = useState<any>(null);
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports/wrapped?year=${currentYear}`).then((r) => r.json()).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [currentYear]);

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data) return <div className="p-6">Erro ao carregar.</div>;

  const currentSlide = SLIDES[slide];

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Wrapped {data.year}</h1>
      </header>

      <div className="mb-4 flex gap-1">
        {SLIDES.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded ${i <= slide ? 'bg-primary' : 'bg-slate-200'}`} />
        ))}
      </div>

      <Card className="mb-4 min-h-[400px] bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        {currentSlide === 'intro' && <SlideIntro name={data.user_name} year={data.year} />}
        {currentSlide === 'workouts' && <SlideWorkouts data={data.workouts} />}
        {currentSlide === 'sets' && <SlideSets data={data.workouts} />}
        {currentSlide === 'nutrition' && <SlideNutrition data={data.nutrition} />}
        {currentSlide === 'consistency' && <SlideConsistency data={data.consistency} level={data.level} total_xp={data.total_xp} longest_streak={data.longest_streak} />}
        {currentSlide === 'special' && <SlideSpecial data={data.special} />}
        {currentSlide === 'achievements' && <SlideAchievements unlocked={data.consistency.achievements_unlocked} />}
        {currentSlide === 'closing' && <SlideClosing name={data.user_name} level={data.level} />}
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button className="flex-1" onClick={() => setSlide(Math.min(SLIDES.length - 1, slide + 1))} disabled={slide === SLIDES.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}

function SlideIntro({ name, year }: any) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <Sparkles className="mb-4 h-12 w-12 text-primary" />
      <h2 className="mb-2 text-3xl font-bold">Olá, {name}</h2>
      <p className="text-lg text-muted-foreground">Aqui está seu {year} no MyFitLife</p>
    </div>
  );
}

function SlideWorkouts({ data }: any) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="mb-2 text-sm text-muted-foreground">Você completou</p>
      <p className="mb-2 text-6xl font-bold text-primary">{data.total}</p>
      <p className="mb-6 text-lg">treinos esse ano</p>
      <p className="text-sm text-muted-foreground">Isso são <strong>{data.total_hours}h</strong> de suor.</p>
    </div>
  );
}

function SlideSets({ data }: any) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="mb-2 text-sm text-muted-foreground">E registrou</p>
      <p className="mb-2 text-6xl font-bold text-primary">{data.total_sets.toLocaleString('pt-BR')}</p>
      <p className="mb-6 text-lg">séries</p>
      {data.total_weight_moved_kg > 0 && (
        <p className="text-sm text-muted-foreground">
          Carga total movida: <strong>{data.total_weight_moved_kg.toLocaleString('pt-BR')} kg</strong>
        </p>
      )}
      {data.favorite_exercise && (
        <p className="mt-4 text-sm">
          Exercício favorito: <strong>{data.favorite_exercise}</strong>
        </p>
      )}
    </div>
  );
}

function SlideNutrition({ data }: any) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="mb-2 text-sm text-muted-foreground">Na cozinha</p>
      <p className="mb-2 text-6xl font-bold text-primary">{data.meals_total.toLocaleString('pt-BR')}</p>
      <p className="mb-6 text-lg">refeições registradas</p>
      {data.photo_meals > 0 && (
        <p className="text-sm">
          Tirou <strong>{data.photo_meals}</strong> fotos de comida pra IA analisar 📸
        </p>
      )}
      {data.favorite_food && (
        <p className="mt-4 text-sm">
          Alimento mais registrado: <strong>{data.favorite_food}</strong> ({data.favorite_food_times}x)
        </p>
      )}
    </div>
  );
}

function SlideConsistency({ data, level, longest_streak }: any) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="mb-2 text-sm text-muted-foreground">Seu recorde de streak foi</p>
      <p className="mb-2 text-6xl font-bold text-primary">{longest_streak}</p>
      <p className="mb-6 text-lg">dias consecutivos 🔥</p>
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>Check-ins matinais: <strong>{data.checkins}</strong></p>
        <p>XP ganho em {new Date().getFullYear()}: <strong>{data.xp_earned.toLocaleString('pt-BR')}</strong></p>
        <p>Nível atual: <strong>{level}</strong></p>
      </div>
    </div>
  );
}

function SlideSpecial({ data }: any) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="mb-4 text-sm text-muted-foreground">Momentos especiais</p>
      <div className="space-y-3">
        {data.gyms_added > 0 && <p>🏢 <strong>{data.gyms_added}</strong> {data.gyms_added === 1 ? 'academia cadastrada' : 'academias cadastradas'}</p>}
        {data.equipment_scans > 0 && <p>📷 <strong>{data.equipment_scans}</strong> {data.equipment_scans === 1 ? 'aparelho identificado' : 'aparelhos identificados'}</p>}
        {data.trails_completed > 0 && <p>🎯 <strong>{data.trails_completed}</strong> {data.trails_completed === 1 ? 'trilha concluída' : 'trilhas concluídas'}</p>}
        {data.gyms_added === 0 && data.equipment_scans === 0 && data.trails_completed === 0 && (
          <p className="text-muted-foreground">Explore mais recursos no próximo ano!</p>
        )}
      </div>
    </div>
  );
}

function SlideAchievements({ unlocked }: any) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="mb-2 text-sm text-muted-foreground">Você desbloqueou</p>
      <p className="mb-2 text-6xl font-bold text-primary">{unlocked}</p>
      <p className="text-lg">conquistas 🏆</p>
    </div>
  );
}

function SlideClosing({ name, level }: any) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <Sparkles className="mb-4 h-12 w-12 text-primary" />
      <h2 className="mb-2 text-2xl font-bold">Obrigado, {name}</h2>
      <p className="mb-4 text-sm text-muted-foreground">Você chegou ao nível {level} e construiu uma história incrível aqui.</p>
      <p className="text-sm font-medium">Vamos pro próximo ano?</p>
    </div>
  );
}
