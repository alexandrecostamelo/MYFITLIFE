import { type ParsedWorkout } from './strong-parser';

export function parseStravaGPX(content: string): ParsedWorkout[] {
  const nameMatch = content.match(/<name>(.*?)<\/name>/);
  const trkpts =
    content.match(/<trkpt[^>]*>[\s\S]*?<\/trkpt>/g) || [];

  const points: {
    lat: number;
    lon: number;
    time: string;
    hr?: number;
  }[] = [];

  for (const pt of trkpts) {
    const latM = pt.match(/lat="([^"]+)"/);
    const lonM = pt.match(/lon="([^"]+)"/);
    const timeM = pt.match(/<time>(.*?)<\/time>/);
    const hrM =
      pt.match(/<ns3:hr>(.*?)<\/ns3:hr>/) ||
      pt.match(/<gpxtpx:hr>(.*?)<\/gpxtpx:hr>/);

    if (latM && lonM && timeM) {
      points.push({
        lat: parseFloat(latM[1]),
        lon: parseFloat(lonM[1]),
        time: timeM[1],
        hr: hrM ? parseInt(hrM[1]) : undefined,
      });
    }
  }

  if (points.length < 2) return [];

  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += haversine(
      points[i - 1].lat,
      points[i - 1].lon,
      points[i].lat,
      points[i].lon,
    );
  }

  const startTime = new Date(points[0].time);
  const endTime = new Date(points[points.length - 1].time);
  const durationMin = Math.round(
    (endTime.getTime() - startTime.getTime()) / 60000,
  );

  const hrPoints = points.filter((p) => p.hr);
  const avgHR =
    hrPoints.length > 0
      ? hrPoints.reduce((s, p) => s + (p.hr || 0), 0) / hrPoints.length
      : 0;

  const distKm = totalDistance / 1000;
  const pace = distKm > 0 ? durationMin / distKm : 0;

  const workout: ParsedWorkout = {
    date: startTime.toISOString().slice(0, 10),
    name: nameMatch?.[1] || 'Corrida Strava',
    exercises: [
      {
        name: 'Corrida',
        sets: [
          {
            order: 1,
            weight_kg: 0,
            reps: 0,
            duration_sec: durationMin * 60,
            distance_m: Math.round(totalDistance),
          },
        ],
      },
    ],
    duration_minutes: durationMin,
    notes: `Distância: ${distKm.toFixed(2)}km · Pace: ${pace.toFixed(1)} min/km${avgHR > 0 ? ` · FC média: ${Math.round(avgHR)} bpm` : ''}`,
  };

  return [workout];
}

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
