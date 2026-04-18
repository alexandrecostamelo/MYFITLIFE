type TrailDay = {
  day: number;
  title: string;
  theme: 'workout' | 'nutrition' | 'recovery' | 'mindset' | 'cardio';
  focus: string;
  workout_hint?: string;
  nutrition_hint?: string;
  tip: string;
};

type TrailSeed = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  duration_days: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  goal: string;
  cover_emoji: string;
  is_premium: boolean;
  days_config: TrailDay[];
};

function buildEmagrecimento21(): TrailDay[] {
  const days: TrailDay[] = [];
  const workouts = [
    'Treino A: peito, ombro e tríceps (3x8-12)',
    'Cardio leve 30 min + core',
    'Treino B: costas e bíceps (3x8-12)',
    'HIIT 20 min + alongamento',
    'Treino C: pernas completo (3x10-15)',
    'Descanso ativo: caminhada 40 min',
    'Dia livre — mobilidade e recuperação',
  ];
  const tips = [
    'Beba 35ml de água por kg de peso hoje.',
    'Pratique mindful eating: coma sem distrações.',
    'Reduza o álcool: cada dose tem ~100 kcal "vazias".',
    'Durma 7-9h — sono ruim sabota a dieta.',
    'Use pratos menores para controle visual de porções.',
    'Proteína em toda refeição dá saciedade.',
    'Fibra: 25g/dia reduz fome e melhora intestino.',
    'Evite bebidas açucaradas — preferência pela água.',
    'Caminhe após cada refeição principal.',
    'Meça-se com fita, não só balança.',
    'Adicione uma porção de vegetais em cada refeição.',
    'Registre tudo que come hoje — sem julgamento.',
    'Prepare suas refeições da semana no domingo.',
    'Tente jejum de 12h entre jantar e café.',
    'Mastigue cada garfada 20 vezes.',
    'Pesar-se 1x/semana no mesmo horário.',
    'Evite petiscar em frente à TV.',
    'Cozinhe mais em casa.',
    'Substitua sobremesas por fruta.',
    'Celebre o progresso com algo não-alimentar.',
    'Hoje é o último dia: faça fotos e meça-se!',
  ];
  for (let i = 0; i < 21; i++) {
    const day = i + 1;
    const isRest = day % 7 === 0;
    days.push({
      day,
      title: `Dia ${day}: ${isRest ? 'Recuperação' : workouts[i % workouts.length].split(':')[0]}`,
      theme: isRest ? 'recovery' : 'workout',
      focus: isRest ? 'Descanso e recuperação' : workouts[i % workouts.length],
      workout_hint: isRest ? 'Alongamento ou caminhada leve' : workouts[i % workouts.length],
      nutrition_hint: 'Déficit calórico leve (-400 kcal do TDEE). Proteína alta.',
      tip: tips[i],
    });
  }
  return days;
}

function buildDefinicao30(): TrailDay[] {
  const days: TrailDay[] = [];
  const split = [
    { name: 'Peito + Tríceps', theme: 'workout' as const },
    { name: 'Costas + Bíceps', theme: 'workout' as const },
    { name: 'Pernas + Glúteos', theme: 'workout' as const },
    { name: 'Ombros + Abdômen', theme: 'workout' as const },
    { name: 'Cardio HIIT + Core', theme: 'cardio' as const },
    { name: 'Recuperação ativa', theme: 'recovery' as const },
  ];
  const tips = [
    'Defina seu TDEE e corte 300-500 kcal.', 'Proteína: 2-2.2g por kg de peso corporal.',
    'Treine com intensidade (RIR 1-2 na maioria das séries).', 'Cardio em jejum funciona, mas não é obrigatório.',
    'Cuide da creatina (3-5g/dia) para reter massa.', 'Controle carbos em dias de descanso.',
    'Durma — cortisol alto atrapalha definição.', 'Hidratação é chave pra aparência muscular.',
    'Evite líquidos em refeições grandes.', 'Foque em compostos: agachamento, supino, levantamento.',
    'Progressão de carga toda semana quando possível.', 'Massagem com rolo espuma 10min/dia.',
    'Reduza sódio em excesso nos últimos dias.', 'Pré-treino: 1-2h antes, carb+proteína.',
    'Pós-treino: proteína rápida em até 1h.', 'Evite álcool — reduz síntese proteica.',
    'Foto semanal no mesmo horário e luz.', 'Não corte gordura demais (mínimo 0.8g/kg).',
    'Superséries aumentam EPOC.', 'Respiração diafragmática reduz stress.',
    'Teste jejum intermitente 14-16h se adaptar.', 'Café preto pré-treino é ergogênico seguro.',
    'Não confunda fome com sede.', 'Chá verde após refeições ajuda digestão.',
    'Alongar só após o treino (não antes).', 'Medir cintura, coxa e braço a cada 10 dias.',
    'Refeição livre 1x semana — sem culpa, sem exagero.', 'Mobilidade articular 10min/dia.',
    'Visualize o objetivo antes de dormir.', 'Você chegou ao fim — faça seu balanço!',
  ];
  for (let i = 0; i < 30; i++) {
    const day = i + 1;
    const wt = split[i % split.length];
    days.push({
      day,
      title: `Dia ${day}: ${wt.name}`,
      theme: wt.theme,
      focus: wt.name,
      workout_hint: wt.theme === 'recovery' ? 'Caminhada 30-40 min, alongamento' : `Foco em ${wt.name}`,
      nutrition_hint: 'Proteína 2g/kg, déficit de 300-500 kcal.',
      tip: tips[i],
    });
  }
  return days;
}

function buildHipertrofia60(): TrailDay[] {
  const days: TrailDay[] = [];
  const plan = ['Peito + Tríceps', 'Costas + Bíceps', 'Pernas', 'Ombros', 'Full body leve', 'Descanso ativo', 'Descanso total'];
  const tips = [
    'Superávit calórico de 200-300 kcal acima do TDEE.', 'Proteína 1.6-2.0g/kg é suficiente.',
    'Volume: 12-20 séries por grupo/semana.', 'Progressão: aumente peso ou reps toda semana.',
    'Descanso entre séries: 90-180s para compostos.', 'Conexão mente-músculo é treinável.',
    'Carboidratos são aliados da hipertrofia.', 'Músculo cresce fora da academia — descanse.',
    'Creatina 5g/dia tem evidência forte.', 'Dormir <7h reduz síntese proteica em 18%.',
    'Evite falha sempre — 1-2 RIR otimiza.', 'Compostos antes de isoladores.',
    'Desidratação de 2% prejudica força.', 'Proteína distribuída em 4-5 refeições.',
    'Carboidrato peri-treino melhora volume.', 'RIR 0-1 nas últimas séries de cada exercício.',
    'Alongamento passivo prejudica força — faça só após.', 'Um dia "sujo" não atrapalha se 6/7 ok.',
    'Medidas em fita > balança para hipertrofia.', 'Descanse 1 semana a cada 8-12 de treino pesado.',
    'Não treine dorido — não recuperou.', 'Braços crescem indiretamente com compostos.',
    'Agachamento e terra = testosterona natural.', 'Periodização linear e ondulada.',
    'Técnica > peso, sempre.', 'Ego-lifting = lesões.',
    'Treino curto e intenso > longo e disperso.', 'Estagnado? Mude o estímulo.',
    'Caseína pré-sono ajuda recuperação.', 'Ômega-3 reduz inflamação pós-treino.',
    'Vitamina D baixa = menos força. Pegue sol.', 'Camomila antes de dormir.',
    'Evite treinar com sono.', 'Foto a cada 15 dias no mesmo ângulo.',
    'Dieta monótona reduz variáveis.', 'Marcadores: peso, medidas, espelho, força.',
    'Meta: 200-250g massa magra/mês.', 'Gengibre reduz DOMS.',
    'Refeição pré-treino 1-2h antes.', 'Ciclos de 8 semanas: 6 intenso + 2 leves.',
    'Panturrilha merece mais atenção.', 'Abdominal cresce com peso, não 200 reps.',
    'Variação de ângulos > variação de exercícios.', 'Metade dos exercícios devem ser livres.',
    'Barra fixa > puxador.', 'Pressão no pescoço = postura errada.',
    'Valsalva em cargas pesadas.', 'Lesão: 48-72h gelo, depois calor.',
    'Aquecimento específico > genérico.', 'Forma ruim = menos estímulo.',
    'Consistência 8 semanas > perfeição 1 semana.', 'Saudades do treino? 3 dias de folga.',
    'Progressão lenta é progressão real.', 'Evite comparar com outros.',
    'Mede braço frio pela manhã.', 'Stretching após treino não ajuda hipertrofia.',
    'Semana 9-10: deload para recuperar.', 'Volta aos poucos após deload.',
    'Revise seu progresso!', 'Último dia: compare fotos, medidas e PRs.',
  ];
  for (let i = 0; i < 60; i++) {
    const day = i + 1;
    const idx = i % 7;
    const wt = plan[idx];
    const isRest = idx === 5 || idx === 6;
    days.push({
      day,
      title: `Dia ${day}: ${wt}`,
      theme: isRest ? 'recovery' : 'workout',
      focus: wt,
      workout_hint: isRest ? 'Alongamento, mobilidade, caminhada' : wt,
      nutrition_hint: 'Superávit +200-300 kcal, proteína 1.8g/kg.',
      tip: tips[i] || 'Mantenha o foco na progressão.',
    });
  }
  return days;
}

export const trails: TrailSeed[] = [
  {
    slug: 'emagrecimento-21',
    title: 'Emagrecimento 21 dias',
    subtitle: 'Criar hábito em 3 semanas',
    description: 'Trilha de 21 dias focada em criar hábitos sustentáveis de alimentação e treino para perder gordura.',
    duration_days: 21,
    level: 'beginner',
    goal: 'lose_fat',
    cover_emoji: '🔥',
    is_premium: false,
    days_config: buildEmagrecimento21(),
  },
  {
    slug: 'definicao-30',
    title: 'Definição 30 dias',
    subtitle: 'Seca com preservação de massa',
    description: 'Programa de 30 dias para definição muscular com déficit controlado e treino de força.',
    duration_days: 30,
    level: 'intermediate',
    goal: 'lose_fat',
    cover_emoji: '⚡',
    is_premium: false,
    days_config: buildDefinicao30(),
  },
  {
    slug: 'hipertrofia-60',
    title: 'Hipertrofia 60 dias',
    subtitle: 'Ganho muscular iniciante/intermediário',
    description: 'Programa de 60 dias para ganhar massa muscular com superávit moderado e progressão semanal.',
    duration_days: 60,
    level: 'intermediate',
    goal: 'gain_muscle',
    cover_emoji: '💪',
    is_premium: false,
    days_config: buildHipertrofia60(),
  },
];
