import { describe, it, expect } from 'vitest';
import { generateSlotsForDay, WEEKDAY_LABELS } from './index';

function makeDate(dayOffset: number, weekday: number): Date {
  // Find the next date that has the given weekday
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  // Adjust to get the desired weekday
  const diff = weekday - d.getDay();
  d.setDate(d.getDate() + diff);
  // Always at least tomorrow to avoid "past" filtering
  if (d <= new Date()) d.setDate(d.getDate() + 7);
  return d;
}

describe('generateSlotsForDay', () => {
  const availability = [
    { weekday: 1, start_time: '08:00', end_time: '10:00', slot_duration_min: 60 },
  ];

  it('returns slots for a weekday with matching availability', () => {
    const monday = makeDate(1, 1);
    const slots = generateSlotsForDay(monday, availability, [], []);
    expect(slots.length).toBeGreaterThanOrEqual(1);
    expect(slots[0]).toHaveProperty('start');
    expect(slots[0]).toHaveProperty('end');
    expect(slots[0]).toHaveProperty('iso');
  });

  it('returns empty for a blocked date', () => {
    const monday = makeDate(1, 1);
    const dateStr = monday.toISOString().slice(0, 10);
    const slots = generateSlotsForDay(monday, availability, [dateStr], []);
    expect(slots).toHaveLength(0);
  });

  it('returns empty when no matching weekday rule', () => {
    const tuesday = makeDate(2, 2);
    const slots = generateSlotsForDay(tuesday, availability, [], []);
    expect(slots).toHaveLength(0);
  });

  it('excludes already-booked slots', () => {
    const monday = makeDate(1, 1);
    const allSlots = generateSlotsForDay(monday, availability, [], []);
    expect(allSlots.length).toBeGreaterThanOrEqual(1);
    const bookedAt = [allSlots[0].iso];
    const remaining = generateSlotsForDay(monday, availability, [], bookedAt);
    expect(remaining.length).toBe(allSlots.length - 1);
  });

  it('handles multiple rules for the same weekday', () => {
    const multiAvailability = [
      { weekday: 1, start_time: '08:00', end_time: '09:00', slot_duration_min: 30 },
      { weekday: 1, start_time: '14:00', end_time: '16:00', slot_duration_min: 30 },
    ];
    const monday = makeDate(1, 1);
    const slots = generateSlotsForDay(monday, multiAvailability, [], []);
    expect(slots.length).toBeGreaterThanOrEqual(3);
  });

  it('returns slots sorted by iso time', () => {
    const monday = makeDate(1, 1);
    const slots = generateSlotsForDay(monday, availability, [], []);
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].iso >= slots[i - 1].iso).toBe(true);
    }
  });
});

describe('WEEKDAY_LABELS', () => {
  it('has 7 labels', () => {
    expect(WEEKDAY_LABELS).toHaveLength(7);
  });

  it('starts with Dom (Sunday)', () => {
    expect(WEEKDAY_LABELS[0]).toBe('Dom');
  });
});
