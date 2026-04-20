import { parseStrongCSV, type ParsedWorkout } from './strong-parser';
import { parseHevyCSV } from './hevy-parser';
import { parseStravaGPX } from './strava-parser';

export type ImportSource = 'strong' | 'hevy' | 'strava' | 'csv';

export function detectAndParse(
  content: string,
  filename: string,
): { source: ImportSource; workouts: ParsedWorkout[] } {
  const lower = filename.toLowerCase();

  // GPX files → Strava
  if (lower.endsWith('.gpx')) {
    return { source: 'strava', workouts: parseStravaGPX(content) };
  }

  // Detect by header keywords
  const firstLine = content.split('\n')[0]?.toLowerCase() || '';

  if (
    firstLine.includes('exercise_title') ||
    firstLine.includes('hevy') ||
    firstLine.includes('set_index')
  ) {
    return { source: 'hevy', workouts: parseHevyCSV(content) };
  }

  if (
    firstLine.includes('workout name') ||
    firstLine.includes('exercise name') ||
    firstLine.includes('set order')
  ) {
    return { source: 'strong', workouts: parseStrongCSV(content) };
  }

  // Fallback: try each parser
  const strongResult = parseStrongCSV(content);
  if (strongResult.length > 0)
    return { source: 'strong', workouts: strongResult };

  const hevyResult = parseHevyCSV(content);
  if (hevyResult.length > 0) return { source: 'hevy', workouts: hevyResult };

  return { source: 'csv', workouts: [] };
}
