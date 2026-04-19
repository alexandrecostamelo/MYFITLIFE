import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { MonthlyReportData } from './monthly-report';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#3b82f6', paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666666' },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, backgroundColor: '#f3f4f6', padding: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  kpiBox: { width: '32%', padding: 8, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 6, marginRight: '1%' },
  kpiLabel: { fontSize: 8, color: '#6b7280', marginBottom: 2 },
  kpiValue: { fontSize: 14, fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', paddingVertical: 3 },
  cell: { flex: 1, fontSize: 9, paddingHorizontal: 2 },
  cellSm: { width: 52, fontSize: 9, paddingHorizontal: 2 },
  cellXs: { width: 40, fontSize: 9, paddingHorizontal: 2 },
  badgeNormal: { fontSize: 8, padding: 2, backgroundColor: '#d1fae5', color: '#065f46' },
  badgeHigh: { fontSize: 8, padding: 2, backgroundColor: '#fee2e2', color: '#991b1b' },
  badgeLow: { fontSize: 8, padding: 2, backgroundColor: '#dbeafe', color: '#1e40af' },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, fontSize: 8, color: '#9ca3af', textAlign: 'center', borderTopWidth: 0.5, borderTopColor: '#e5e7eb', paddingTop: 6 },
});

function getBadgeStyle(classification: string) {
  if (classification === 'high' || classification === 'critical_high') return styles.badgeHigh;
  if (classification === 'low' || classification === 'critical_low') return styles.badgeLow;
  return styles.badgeNormal;
}

export function MonthlyReportPDF({ data }: { data: MonthlyReportData }) {
  const s = data.summary;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Relatorio Mensal</Text>
          <Text style={styles.subtitle}>{data.user.full_name} · {data.period.month_label}</Text>
        </View>

        {/* KPIs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do mes</Text>
          <View style={styles.grid}>
            {[
              { label: 'Treinos', value: String(s.workouts_count) },
              { label: 'Minutos totais', value: String(s.workouts_total_minutes) },
              { label: 'Kcal queimadas (est.)', value: String(s.workouts_calories_estimate) },
              { label: 'Refeicoes', value: String(s.meals_count) },
              { label: 'Media kcal/dia', value: String(s.avg_calories_per_day) },
              { label: 'Mudanca peso', value: s.weight_change_kg !== null ? `${s.weight_change_kg > 0 ? '+' : ''}${s.weight_change_kg} kg` : '—' },
              { label: 'XP ganho', value: String(s.xp_gained) },
              { label: 'Skills dominadas', value: String(s.new_skills_mastered) },
              { label: 'Check-ins', value: String(data.checkins_summary.count) },
            ].map((kpi, i) => (
              <View key={i} style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <Text style={styles.kpiValue}>{kpi.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Treinos */}
        {data.workouts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treinos ({data.workouts.length})</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.cellXs}>Data</Text>
              <Text style={styles.cell}>Nome</Text>
              <Text style={styles.cellXs}>Min</Text>
              <Text style={styles.cellXs}>Esf.</Text>
              <Text style={styles.cellXs}>Exs.</Text>
            </View>
            {data.workouts.slice(0, 40).map((w, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.cellXs}>{w.date.slice(5)}</Text>
                <Text style={styles.cell}>{w.name}</Text>
                <Text style={styles.cellXs}>{w.duration_min}</Text>
                <Text style={styles.cellXs}>{w.effort ?? '—'}</Text>
                <Text style={styles.cellXs}>{w.exercise_count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Nutrição */}
        {data.meals_by_day.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutricao por dia</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.cellXs}>Data</Text>
              <Text style={styles.cellXs}>Ref.</Text>
              <Text style={styles.cellSm}>Kcal</Text>
              <Text style={styles.cellSm}>Prot(g)</Text>
              <Text style={styles.cellSm}>Carb(g)</Text>
              <Text style={styles.cellSm}>Gord(g)</Text>
            </View>
            {data.meals_by_day.map((m, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.cellXs}>{m.date.slice(5)}</Text>
                <Text style={styles.cellXs}>{m.meal_count}</Text>
                <Text style={styles.cellSm}>{Math.round(m.total_calories)}</Text>
                <Text style={styles.cellSm}>{Math.round(m.total_protein)}</Text>
                <Text style={styles.cellSm}>{Math.round(m.total_carbs)}</Text>
                <Text style={styles.cellSm}>{Math.round(m.total_fat)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Peso */}
        {data.weight_logs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Peso</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.cellSm}>Data</Text>
              <Text style={styles.cell}>Peso (kg)</Text>
            </View>
            {data.weight_logs.map((w, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.cellSm}>{w.date.slice(5)}</Text>
                <Text style={styles.cell}>{w.weight_kg}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Biomarcadores */}
        {data.biomarkers.length > 0 && (
          <View style={styles.section} break>
            <Text style={styles.sectionTitle}>Biomarcadores</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.cellXs}>Data</Text>
              <Text style={styles.cell}>Marcador</Text>
              <Text style={styles.cellXs}>Valor</Text>
              <Text style={styles.cellXs}>Unidade</Text>
              <Text style={styles.cellSm}>Status</Text>
            </View>
            {data.biomarkers.map((b, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.cellXs}>{b.date.slice(5)}</Text>
                <Text style={styles.cell}>{b.name}</Text>
                <Text style={styles.cellXs}>{b.value}</Text>
                <Text style={styles.cellXs}>{b.unit}</Text>
                <Text style={[styles.cellSm, getBadgeStyle(b.classification)]}>{b.classification}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>
          Gerado pelo MyFitLife · {new Date().toLocaleDateString('pt-BR')} · Dados do proprio usuario
        </Text>
      </Page>
    </Document>
  );
}

export async function generatePDFBuffer(data: MonthlyReportData): Promise<ArrayBuffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf = await renderToBuffer(React.createElement(MonthlyReportPDF, { data }) as any);
  // buf is a Node.js Buffer; extract the underlying ArrayBuffer slice
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}
