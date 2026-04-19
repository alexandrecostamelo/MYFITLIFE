export type WeeklyAvailability = {
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_min: number;
};

export type Slot = {
  start: string;
  end: string;
  iso: string;
};

function parseTime(t: string): { hours: number; minutes: number } {
  const [h, m] = t.split(':').map(Number);
  return { hours: h, minutes: m || 0 };
}

export function generateSlotsForDay(
  date: Date,
  availability: WeeklyAvailability[],
  blockedDates: string[],
  bookedAt: string[]
): Slot[] {
  const weekday = date.getDay();
  const dateStr = date.toISOString().slice(0, 10);

  if (blockedDates.includes(dateStr)) return [];

  const rules = availability.filter((a) => a.weekday === weekday);
  if (rules.length === 0) return [];

  const bookedSet = new Set(bookedAt.map((d) => new Date(d).toISOString()));
  const slots: Slot[] = [];

  for (const rule of rules) {
    const { hours: sh, minutes: sm } = parseTime(rule.start_time);
    const { hours: eh, minutes: em } = parseTime(rule.end_time);

    const start = new Date(date);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(date);
    end.setHours(eh, em, 0, 0);

    let cursor = new Date(start);
    while (cursor.getTime() + rule.slot_duration_min * 60000 <= end.getTime()) {
      const slotEnd = new Date(cursor.getTime() + rule.slot_duration_min * 60000);
      const iso = cursor.toISOString();

      if (!bookedSet.has(iso) && cursor.getTime() > Date.now()) {
        slots.push({
          start: cursor.toTimeString().slice(0, 5),
          end: slotEnd.toTimeString().slice(0, 5),
          iso,
        });
      }

      cursor = new Date(cursor.getTime() + rule.slot_duration_min * 60000);
    }
  }

  return slots.sort((a, b) => a.iso.localeCompare(b.iso));
}

export function getNext14Days(): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAY_LABELS_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
