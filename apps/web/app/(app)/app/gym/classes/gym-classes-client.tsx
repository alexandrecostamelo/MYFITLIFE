'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Clock, Users, Check, Loader2, X } from 'lucide-react';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MODALITY_LABELS: Record<string, string> = {
  spinning: 'Spinning',
  yoga: 'Yoga',
  funcional: 'Funcional',
  crossfit: 'CrossFit',
  pilates: 'Pilates',
  danca: 'Dança',
  luta: 'Luta',
  natacao: 'Natação',
  musculacao_guiada: 'Musculação Guiada',
  alongamento: 'Alongamento',
  hiit: 'HIIT',
  outro: 'Outro',
};

const MODALITY_ICONS: Record<string, string> = {
  spinning: '\u{1F6B4}',
  yoga: '\u{1F9D8}',
  funcional: '\u{1F3CB}\u{FE0F}',
  crossfit: '\u{1F4A5}',
  pilates: '\u{1F938}',
  danca: '\u{1F483}',
  luta: '\u{1F94A}',
  natacao: '\u{1F3CA}',
  musculacao_guiada: '\u{1F4AA}',
  alongamento: '\u{1F646}',
  hiit: '\u{1F525}',
  outro: '\u{26A1}',
};

interface Props {
  gymName: string;
  classes: Record<string, unknown>[];
  myBookings: Record<string, unknown>[];
  weekDates: string[];
}

export function GymClassesClient({
  gymName,
  classes,
  myBookings,
  weekDates,
}: Props) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedModality, setSelectedModality] = useState<string | null>(
    null,
  );

  const targetDate = weekDates[selectedDay];
  const targetDow = new Date(targetDate + 'T12:00:00').getDay();

  const dayClasses = classes.filter((c) => {
    if (Number(c.day_of_week) !== targetDow) return false;
    if (selectedModality && String(c.modality) !== selectedModality)
      return false;
    return true;
  });

  const modalities = [
    ...new Set(classes.map((c) => String(c.modality))),
  ].sort();

  const getBooking = (classId: string) =>
    myBookings.find(
      (b) =>
        String(b.class_id) === classId &&
        String(b.class_date) === targetDate &&
        (String(b.status) === 'confirmed' || String(b.status) === 'waitlist'),
    );

  const book = async (classId: string) => {
    setLoading(classId);
    await fetch('/api/gym-classes/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId, class_date: targetDate }),
    });
    setLoading(null);
    router.refresh();
  };

  const cancel = async (bookingId: string) => {
    setLoading(bookingId);
    await fetch('/api/gym-classes/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId }),
    });
    setLoading(null);
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-lg px-4 pt-4 pb-28 space-y-4">
      <div>
        <h1 className="display-title">Aulas</h1>
        <p className="text-sm text-muted-foreground">{gymName}</p>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {weekDates.map((d, i) => {
          const date = new Date(d + 'T12:00:00');
          const isToday = i === 0;
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(i)}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors ${
                selectedDay === i
                  ? 'bg-accent/20 border border-accent/40'
                  : 'bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-[10px] font-medium">
                {DAY_NAMES[date.getDay()]}
              </span>
              <span
                className={`text-sm font-semibold ${isToday ? 'text-accent' : ''}`}
              >
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modality filter */}
      {modalities.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedModality(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedModality
                ? 'bg-accent text-black'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
            }`}
          >
            Todas
          </button>
          {modalities.map((m) => (
            <button
              key={m}
              onClick={() =>
                setSelectedModality(selectedModality === m ? null : m)
              }
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedModality === m
                  ? 'bg-accent text-black'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              {MODALITY_LABELS[m] || m}
            </button>
          ))}
        </div>
      )}

      {/* Class cards */}
      <div className="space-y-2">
        {dayClasses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Sem aulas neste dia.
          </p>
        )}
        {dayClasses.map((cls) => {
          const classId = String(cls.id);
          const title = String(cls.title || '');
          const modality = String(cls.modality || '');
          const instructorName = String(cls.instructor_name || '');
          const startTime = String(cls.start_time || '').slice(0, 5);
          const endTime = String(cls.end_time || '').slice(0, 5);
          const maxCapacity = Number(cls.max_capacity) || 20;
          const locationDetail = String(cls.location_detail || '');

          const booking = getBooking(classId);
          const bookingStatus = booking ? String(booking.status) : null;
          const bookingId = booking ? String(booking.id) : null;
          const isBooked = bookingStatus === 'confirmed';
          const isWaitlisted = bookingStatus === 'waitlist';

          return (
            <div
              key={classId}
              className={`glass-card p-4 ${isBooked ? 'border border-accent/40' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">
                  {MODALITY_ICONS[modality] || '\u{26A1}'}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  {instructorName && (
                    <p className="text-xs text-muted-foreground">
                      com {instructorName}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {startTime} - {endTime}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {maxCapacity} vagas
                    </span>
                  </div>
                  {locationDetail && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {locationDetail}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isBooked ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-medium">
                        <Check className="h-3 w-3" />
                        Reservado
                      </span>
                      <button
                        onClick={() => bookingId && cancel(bookingId)}
                        disabled={loading === bookingId}
                        className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5"
                      >
                        <X className="h-3 w-3" />
                        Cancelar
                      </button>
                    </>
                  ) : isWaitlisted ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-medium">
                        Fila de espera
                      </span>
                      <button
                        onClick={() => bookingId && cancel(bookingId)}
                        disabled={loading === bookingId}
                        className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5"
                      >
                        <X className="h-3 w-3" />
                        Sair da fila
                      </button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => book(classId)}
                      disabled={loading === classId}
                    >
                      {loading === classId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Reservar'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
