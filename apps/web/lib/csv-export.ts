import type { MonthlyReportData } from './monthly-report';

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCSV(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCSV).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCSV).join(','));
  }
  return lines.join('\n');
}

export function buildMonthlyCSV(data: MonthlyReportData): string {
  const sections: string[] = [];

  sections.push(`Relatorio Mensal MyFitLife - ${data.period.month_label}`);
  sections.push(`Usuario: ${data.user.full_name}`);
  sections.push(`Periodo: ${data.period.start.slice(0, 10)} a ${data.period.end.slice(0, 10)}`);
  sections.push('');

  sections.push('RESUMO');
  sections.push(rowsToCSV(
    ['Metrica', 'Valor'],
    [
      ['Treinos completados', data.summary.workouts_count],
      ['Minutos totais', data.summary.workouts_total_minutes],
      ['Calorias queimadas (estimativa)', data.summary.workouts_calories_estimate],
      ['Refeicoes registradas', data.summary.meals_count],
      ['Media kcal/dia', data.summary.avg_calories_per_day],
      ['Mudanca de peso (kg)', data.summary.weight_change_kg ?? 'N/A'],
      ['XP ganho', data.summary.xp_gained],
      ['Habilidades dominadas', data.summary.new_skills_mastered],
      ['Check-ins matinais', data.checkins_summary.count],
      ['Media sono (0-10)', data.checkins_summary.avg_sleep],
      ['Media energia (0-10)', data.checkins_summary.avg_energy],
      ['Media humor (0-10)', data.checkins_summary.avg_mood],
    ]
  ));
  sections.push('');

  if (data.workouts.length > 0) {
    sections.push('TREINOS');
    sections.push(rowsToCSV(
      ['Data', 'Nome', 'Duracao (min)', 'Esforcoo (1-10)', 'Exercicios'],
      data.workouts.map((w) => [w.date, w.name, w.duration_min, w.effort ?? '', w.exercise_count])
    ));
    sections.push('');
  }

  if (data.meals_by_day.length > 0) {
    sections.push('NUTRICAO (AGRUPADO POR DIA)');
    sections.push(rowsToCSV(
      ['Data', 'Refeicoes', 'Calorias', 'Proteina (g)', 'Carboidratos (g)', 'Gordura (g)'],
      data.meals_by_day.map((m) => [
        m.date,
        m.meal_count,
        Math.round(m.total_calories),
        Math.round(m.total_protein),
        Math.round(m.total_carbs),
        Math.round(m.total_fat),
      ])
    ));
    sections.push('');
  }

  if (data.weight_logs.length > 0) {
    sections.push('PESO');
    sections.push(rowsToCSV(
      ['Data', 'Peso (kg)'],
      data.weight_logs.map((w) => [w.date, w.weight_kg])
    ));
    sections.push('');
  }

  if (data.biomarkers.length > 0) {
    sections.push('BIOMARCADORES');
    sections.push(rowsToCSV(
      ['Data', 'Marcador', 'Valor', 'Unidade', 'Status'],
      data.biomarkers.map((b) => [b.date, b.name, b.value, b.unit, b.classification])
    ));
    sections.push('');
  }

  return sections.join('\n');
}
