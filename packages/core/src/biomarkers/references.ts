type BiomarkerRef = {
  key: string;
  name: string;
  unit: string;
  min?: number;
  max?: number;
  critical_min?: number;
  critical_max?: number;
  info?: string;
  aliases?: string[];
};

export const BIOMARKER_REFERENCES: BiomarkerRef[] = [
  { key: 'glucose_fasting', name: 'Glicemia de jejum', unit: 'mg/dL', min: 70, max: 99, critical_min: 50, critical_max: 200, aliases: ['glicose', 'glicemia'] },
  { key: 'hba1c', name: 'Hemoglobina glicada', unit: '%', max: 5.7, critical_max: 7, aliases: ['hba1c', 'hemoglobina glicada', 'a1c'] },
  { key: 'total_cholesterol', name: 'Colesterol total', unit: 'mg/dL', max: 190, critical_max: 300, aliases: ['colesterol total'] },
  { key: 'ldl', name: 'LDL (ruim)', unit: 'mg/dL', max: 130, critical_max: 190, aliases: ['ldl', 'colesterol ldl'] },
  { key: 'hdl', name: 'HDL (bom)', unit: 'mg/dL', min: 40, aliases: ['hdl', 'colesterol hdl'] },
  { key: 'triglycerides', name: 'Triglicerídeos', unit: 'mg/dL', max: 150, critical_max: 500, aliases: ['triglicerides', 'tg', 'triglicerideos'] },
  { key: 'vitamin_d', name: 'Vitamina D', unit: 'ng/mL', min: 30, max: 100, critical_min: 10, aliases: ['25(oh)d', 'vitamina d', '25-hidroxivitamina d', 'vitamina d 25-oh'] },
  { key: 'vitamin_b12', name: 'Vitamina B12', unit: 'pg/mL', min: 200, max: 900, aliases: ['b12', 'vitamina b12', 'cobalamina'] },
  { key: 'ferritin', name: 'Ferritina', unit: 'ng/mL', min: 15, max: 300, aliases: ['ferritina'] },
  { key: 'iron', name: 'Ferro sérico', unit: 'µg/dL', min: 60, max: 170, aliases: ['ferro', 'ferro serico', 'ferro total'] },
  { key: 'tsh', name: 'TSH', unit: 'µUI/mL', min: 0.4, max: 4.5, critical_max: 10, aliases: ['tsh', 'hormonio tireoestimulante', 'tireotrofina'] },
  { key: 't4_livre', name: 'T4 livre', unit: 'ng/dL', min: 0.7, max: 1.8, aliases: ['t4 livre', 't4l', 't4l'] },
  { key: 'testosterone', name: 'Testosterona total', unit: 'ng/dL', aliases: ['testosterona total', 'testosterona'] },
  { key: 'cortisol', name: 'Cortisol', unit: 'µg/dL', min: 5, max: 23, aliases: ['cortisol'] },
  { key: 'creatinine', name: 'Creatinina', unit: 'mg/dL', min: 0.6, max: 1.3, aliases: ['creatinina'] },
  { key: 'urea', name: 'Uréia', unit: 'mg/dL', min: 15, max: 45, aliases: ['ureia', 'ureia'] },
  { key: 'ast', name: 'TGO (AST)', unit: 'U/L', max: 40, aliases: ['ast', 'tgo', 'aspartato aminotransferase'] },
  { key: 'alt', name: 'TGP (ALT)', unit: 'U/L', max: 40, aliases: ['alt', 'tgp', 'alanina aminotransferase'] },
  { key: 'uric_acid', name: 'Ácido úrico', unit: 'mg/dL', min: 3, max: 7, aliases: ['acido urico', 'acido urico'] },
  { key: 'crp', name: 'Proteína C reativa', unit: 'mg/L', max: 3, critical_max: 10, aliases: ['pcr', 'proteina c reativa', 'prot c reativa'] },
  { key: 'hemoglobin', name: 'Hemoglobina', unit: 'g/dL', min: 12, max: 17, aliases: ['hemoglobina', 'hb', 'hemoglobina total'] },
  { key: 'hematocrit', name: 'Hematócrito', unit: '%', min: 36, max: 52, aliases: ['hematocrito', 'htc'] },
  { key: 'platelets', name: 'Plaquetas', unit: 'mil/µL', min: 150, max: 400, aliases: ['plaquetas', 'contagem de plaquetas'] },
  { key: 'leukocytes', name: 'Leucócitos', unit: 'mil/µL', min: 4, max: 11, aliases: ['leucocitos', 'leucocitos totais', 'globulos brancos'] },
];

export function findReferenceByKey(key: string): BiomarkerRef | null {
  return BIOMARKER_REFERENCES.find((r) => r.key === key) || null;
}

export function classifyValue(value: number, ref: BiomarkerRef): 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' {
  if (ref.critical_min !== undefined && value < ref.critical_min) return 'critical_low';
  if (ref.critical_max !== undefined && value > ref.critical_max) return 'critical_high';
  if (ref.min !== undefined && value < ref.min) return 'low';
  if (ref.max !== undefined && value > ref.max) return 'high';
  return 'normal';
}

export function matchMarkerKey(rawName: string): string | null {
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const n = normalize(rawName);
  for (const ref of BIOMARKER_REFERENCES) {
    if (ref.aliases) {
      for (const alias of ref.aliases) {
        if (n.includes(normalize(alias))) return ref.key;
      }
    }
    if (n.includes(normalize(ref.name))) return ref.key;
  }
  return null;
}
