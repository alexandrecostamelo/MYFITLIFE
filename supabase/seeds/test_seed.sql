-- =============================================================
-- MYFITLIFE — SEED DE TESTES COMPLETO
-- Usuário principal: Alexandre (aee7d333-6741-4406-aa87-7f1e79a3ebaf)
-- Gerado em: 2026-04-19
-- Executar via: Supabase MCP execute_sql (por blocos) ou Dashboard SQL Editor
-- =============================================================

-- ─── UUIDs FIXOS ────────────────────────────────────────────
-- Alexandre  : aee7d333-6741-4406-aa87-7f1e79a3ebaf
-- Marcos     : 11111111-1111-1111-1111-111111111111
-- Juliana    : 22222222-2222-2222-2222-222222222222
-- Rafael     : 33333333-3333-3333-3333-333333333333
-- Camila     : 44444444-4444-4444-4444-444444444444
-- Pedro      : 55555555-5555-5555-5555-555555555555
-- Gym SP-1   : aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- Gym SP-2   : bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
-- Gym RJ     : cccccccc-cccc-cccc-cccc-cccccccccccc


-- =============================================================
-- BLOCO 1 — PERFIL DO USUÁRIO PRINCIPAL
-- =============================================================

UPDATE profiles SET
  full_name        = 'Alexandre Costa Melo',
  username         = 'alexandrecm',
  gender           = 'male',
  birth_date       = '1993-07-15',
  city             = 'São Paulo',
  state            = 'SP',
  country          = 'BR',
  onboarding_completed = true
WHERE id = 'aee7d333-6741-4406-aa87-7f1e79a3ebaf';

UPDATE user_profiles SET
  height_cm                    = 178,
  current_weight_kg            = 82.5,
  target_weight_kg             = 78.0,
  body_fat_percent             = 18.5,
  activity_level               = 'moderate',
  sleep_hours_avg              = 7.5,
  work_schedule                = 'office',
  available_minutes_per_day    = 60,
  primary_goal                 = 'muscle_gain',
  diet_preference              = 'balanced',
  experience_level             = 'intermediate',
  preferred_training_locations = ARRAY['gym'],
  available_equipment          = ARRAY['barbell','dumbbell','cable','machines'],
  target_calories              = 2600,
  target_protein_g             = 165,
  target_carbs_g               = 290,
  target_fats_g                = 80,
  target_water_ml              = 3000,
  show_in_public_rankings      = true,
  city                         = 'São Paulo',
  state                        = 'SP',
  coach_tone                   = 'motivational'
WHERE user_id = 'aee7d333-6741-4406-aa87-7f1e79a3ebaf';

UPDATE user_stats SET
  total_xp        = 3240,
  level           = 8,
  xp_strength     = 1100,
  xp_endurance    = 620,
  xp_flexibility  = 280,
  xp_consistency  = 820,
  xp_nutrition    = 420,
  current_streak  = 6,
  longest_streak  = 14,
  last_active_date = CURRENT_DATE
WHERE user_id = 'aee7d333-6741-4406-aa87-7f1e79a3ebaf';


-- =============================================================
-- BLOCO 2 — USUÁRIOS FICTÍCIOS (para ranking, amigos, comunidade)
-- =============================================================

INSERT INTO profiles (id, full_name, username, gender, birth_date, city, state, country, role, onboarding_completed) VALUES
  ('11111111-1111-1111-1111-111111111111','Marcos Vieira','marcosv','male','1990-03-22','São Paulo','SP','BR','user',true),
  ('22222222-2222-2222-2222-222222222222','Juliana Santos','julisantos','female','1995-11-08','São Paulo','SP','BR','user',true),
  ('33333333-3333-3333-3333-333333333333','Rafael Costa','rafaelc','male','1988-06-14','Rio de Janeiro','RJ','BR','user',true),
  ('44444444-4444-4444-4444-444444444444','Camila Ferreira','camilaf','female','1997-01-30','Belo Horizonte','MG','BR','user',true),
  ('55555555-5555-5555-5555-555555555555','Pedro Alves','pedroalves','male','1992-09-05','São Paulo','SP','BR','user',true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  username  = EXCLUDED.username;

INSERT INTO user_profiles (user_id, height_cm, current_weight_kg, target_weight_kg, activity_level, primary_goal, experience_level, show_in_public_rankings, city, state, target_calories, target_protein_g, target_carbs_g, target_fats_g) VALUES
  ('11111111-1111-1111-1111-111111111111', 182, 88.0, 83.0, 'active',    'muscle_gain',     'advanced',     true, 'São Paulo',       'SP', 2900, 190, 310, 85),
  ('22222222-2222-2222-2222-222222222222', 164, 61.0, 57.0, 'moderate',  'weight_loss',     'intermediate', true, 'São Paulo',       'SP', 1800, 130, 190, 60),
  ('33333333-3333-3333-3333-333333333333', 175, 79.0, 79.0, 'very_active','endurance',      'advanced',     true, 'Rio de Janeiro',  'RJ', 3100, 175, 380, 75),
  ('44444444-4444-4444-4444-444444444444', 168, 65.0, 62.0, 'moderate',  'general_health',  'beginner',     true, 'Belo Horizonte',  'MG', 2000, 140, 220, 65),
  ('55555555-5555-5555-5555-555555555555', 180, 75.0, 75.0, 'active',    'muscle_gain',     'intermediate', true, 'São Paulo',       'SP', 2700, 170, 295, 80)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_stats (user_id, total_xp, level, xp_strength, xp_endurance, xp_flexibility, xp_consistency, xp_nutrition, current_streak, longest_streak, last_active_date) VALUES
  ('11111111-1111-1111-1111-111111111111', 5820, 13, 2400, 800, 310, 1600, 710, 12, 28, CURRENT_DATE),
  ('22222222-2222-2222-2222-222222222222', 2100,  6,  480, 420, 680,  890, 630,  4,  9, CURRENT_DATE - 1),
  ('33333333-3333-3333-3333-333333333333', 7450, 17, 900,3200, 500, 2100, 750, 22, 45, CURRENT_DATE),
  ('44444444-4444-4444-4444-444444444444',  980,  3,  180, 160, 320,  540, 380,  2,  5, CURRENT_DATE - 2),
  ('55555555-5555-5555-5555-555555555555', 3600, 9,  1500, 700, 200,  980, 220,  8, 15, CURRENT_DATE)
ON CONFLICT (user_id) DO UPDATE SET
  total_xp       = EXCLUDED.total_xp,
  level          = EXCLUDED.level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak;


-- =============================================================
-- BLOCO 3 — EXERCÍCIOS
-- =============================================================

INSERT INTO exercises (id, slug, name_pt, name_en, category, primary_muscles, secondary_muscles, equipment, difficulty, verified, description) VALUES
  ('e0000001-0000-0000-0000-000000000001','agachamento-livre','Agachamento Livre','Barbell Squat','strength',ARRAY['quadriceps','gluteus'],ARRAY['hamstrings','calves','core'],ARRAY['barbell'],3,true,'Exercício composto fundamental para pernas e glúteos.'),
  ('e0000001-0000-0000-0000-000000000002','supino-reto','Supino Reto','Bench Press','strength',ARRAY['chest'],ARRAY['triceps','shoulders'],ARRAY['barbell','bench'],3,true,'Principal exercício para desenvolvimento do peitoral.'),
  ('e0000001-0000-0000-0000-000000000003','levantamento-terra','Levantamento Terra','Deadlift','strength',ARRAY['hamstrings','lower_back'],ARRAY['gluteus','traps','core'],ARRAY['barbell'],4,true,'Um dos exercícios mais completos, trabalha posterior e costas.'),
  ('e0000001-0000-0000-0000-000000000004','rosca-direta','Rosca Direta','Barbell Curl','strength',ARRAY['biceps'],ARRAY['forearms'],ARRAY['barbell'],2,true,'Exercício isolador para bíceps.'),
  ('e0000001-0000-0000-0000-000000000005','desenvolvimento-militar','Desenvolvimento Militar','Overhead Press','strength',ARRAY['shoulders'],ARRAY['triceps','traps'],ARRAY['barbell'],3,true,'Exercício composto para ombros.'),
  ('e0000001-0000-0000-0000-000000000006','puxada-frontal','Puxada Frontal','Lat Pulldown','strength',ARRAY['lats'],ARRAY['biceps','rear_delts'],ARRAY['cable','machines'],2,true,'Exercício para dorsais na polia alta.'),
  ('e0000001-0000-0000-0000-000000000007','leg-press','Leg Press 45°','Leg Press','strength',ARRAY['quadriceps','gluteus'],ARRAY['hamstrings'],ARRAY['machines'],2,true,'Exercício para pernas na máquina.'),
  ('e0000001-0000-0000-0000-000000000008','remada-curvada','Remada Curvada','Bent Over Row','strength',ARRAY['lats','traps'],ARRAY['biceps','rear_delts'],ARRAY['barbell'],3,true,'Exercício composto para costas.'),
  ('e0000001-0000-0000-0000-000000000009','triceps-pulley','Tríceps Pulley','Cable Tricep Pushdown','strength',ARRAY['triceps'],ARRAY['forearms'],ARRAY['cable'],2,true,'Isolador de tríceps na polia.'),
  ('e0000001-0000-0000-0000-000000000010','elevacao-lateral','Elevação Lateral','Lateral Raise','strength',ARRAY['shoulders'],ARRAY[],ARRAY['dumbbell'],1,true,'Exercício isolador para deltóide médio.'),
  ('e0000001-0000-0000-0000-000000000011','stiff','Stiff','Romanian Deadlift','strength',ARRAY['hamstrings'],ARRAY['gluteus','lower_back'],ARRAY['barbell'],3,true,'Exercício para posterior de coxa com ênfase nos ísquios.'),
  ('e0000001-0000-0000-0000-000000000012','peck-deck','Peck Deck','Pec Deck Fly','strength',ARRAY['chest'],ARRAY[],ARRAY['machines'],1,true,'Exercício isolador para peitoral na máquina.'),
  ('e0000001-0000-0000-0000-000000000013','barra-fixa','Barra Fixa','Pull-Up','calisthenics',ARRAY['lats'],ARRAY['biceps','core'],ARRAY['pull_up_bar'],3,true,'Exercício de calistenia para costas.'),
  ('e0000001-0000-0000-0000-000000000014','flexao-de-braco','Flexão de Braço','Push-Up','calisthenics',ARRAY['chest'],ARRAY['triceps','shoulders'],ARRAY[],1,true,'Exercício corporal para peitoral.'),
  ('e0000001-0000-0000-0000-000000000015','corrida','Corrida','Running','cardio',ARRAY['quadriceps','calves'],ARRAY['hamstrings','gluteus'],ARRAY[],2,true,'Cardio de alta intensidade.'),
  ('e0000001-0000-0000-0000-000000000016','bicicleta-ergometrica','Bicicleta Ergométrica','Stationary Bike','cardio',ARRAY['quadriceps'],ARRAY['hamstrings','calves'],ARRAY['machines'],1,true,'Cardio de baixo impacto.'),
  ('e0000001-0000-0000-0000-000000000017','prancha','Prancha Abdominal','Plank','calisthenics',ARRAY['core'],ARRAY['shoulders','lower_back'],ARRAY[],1,true,'Exercício isométrico para abdômen.'),
  ('e0000001-0000-0000-0000-000000000018','afundo','Afundo','Lunge','strength',ARRAY['quadriceps','gluteus'],ARRAY['hamstrings','calves'],ARRAY['dumbbell'],2,true,'Exercício unilateral para pernas.'),
  ('e0000001-0000-0000-0000-000000000019','cadeira-extensora','Cadeira Extensora','Leg Extension','strength',ARRAY['quadriceps'],ARRAY[],ARRAY['machines'],1,true,'Isolador de quadríceps na máquina.'),
  ('e0000001-0000-0000-0000-000000000020','mesa-flexora','Mesa Flexora','Leg Curl','strength',ARRAY['hamstrings'],ARRAY[],ARRAY['machines'],1,true,'Isolador de ísquios na máquina.')
ON CONFLICT (slug) DO NOTHING;


-- =============================================================
-- BLOCO 4 — ALIMENTOS
-- =============================================================

INSERT INTO foods (id, source, name, category, calories_kcal, protein_g, carbs_g, fats_g, fiber_g, serving_size_g, serving_description, verified) VALUES
  ('f0000001-0000-0000-0000-000000000001','manual','Frango Grelhado (peito)','proteina',165,31,0,3.6,0,100,'100g',true),
  ('f0000001-0000-0000-0000-000000000002','manual','Arroz Branco Cozido','carboidrato',130,2.7,28,0.3,0.4,100,'100g',true),
  ('f0000001-0000-0000-0000-000000000003','manual','Batata Doce Cozida','carboidrato',86,1.6,20,0.1,2.5,100,'100g',true),
  ('f0000001-0000-0000-0000-000000000004','manual','Ovo Inteiro','proteina',143,12.6,0.7,9.5,0,60,'1 unidade grande',true),
  ('f0000001-0000-0000-0000-000000000005','manual','Whey Protein (concentrado)','suplemento',380,80,8,5,0,100,'100g',true),
  ('f0000001-0000-0000-0000-000000000006','manual','Aveia em Flocos','carboidrato',389,17,66,7,11,100,'100g',true),
  ('f0000001-0000-0000-0000-000000000007','manual','Banana Nanica','fruta',89,1.1,23,0.3,2.6,100,'1 unidade média',true),
  ('f0000001-0000-0000-0000-000000000008','manual','Feijão Carioca Cozido','leguminosa',76,4.8,14,0.5,8.5,100,'100g',true),
  ('f0000001-0000-0000-0000-000000000009','manual','Salmão Grelhado','proteina',206,28,0,10,0,100,'100g',true),
  ('f0000001-0000-0000-0000-000000000010','manual','Azeite de Oliva','gordura',884,0,0,100,0,14,'1 colher de sopa',true),
  ('f0000001-0000-0000-0000-000000000011','manual','Iogurte Grego Natural','lácteo',59,10,3.6,0.4,0,100,'100g',true),
  ('f0000001-0000-0000-0000-000000000012','manual','Maçã','fruta',52,0.3,14,0.2,2.4,150,'1 unidade',true),
  ('f0000001-0000-0000-0000-000000000013','manual','Pão Integral','carboidrato',265,13,41,3.5,6,50,'2 fatias',true),
  ('f0000001-0000-0000-0000-000000000014','manual','Atum em Conserva','proteina',128,28,0,1,0,100,'100g',true),
  ('f0000001-0000-0000-0000-000000000015','manual','Castanha do Pará','gordura',656,14,12,66,7.5,30,'6 unidades',true)
ON CONFLICT DO NOTHING;


-- =============================================================
-- BLOCO 5 — ACADEMIAS
-- =============================================================

INSERT INTO gym_places (id, name, address, city, state, country, latitude, longitude, amenities, verified, rating_avg, rating_count, checkins_total) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Smart Fit Paulista','Av. Paulista, 1374 - Bela Vista','São Paulo','SP','BR',-23.5630,-46.6543,ARRAY['estacionamento','vestiario','sauna','ar_condicionado','wifi'],true,4.2,142,389),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Bodytech Vila Olímpia','R. Funchal, 418 - Vila Olímpia','São Paulo','SP','BR',-23.5977,-46.6884,ARRAY['piscina','vestiario','sauna','estacionamento','crossfit','spinning'],true,4.6,87,212),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc','Bio Ritmo Barra da Tijuca','Av. das Américas, 3301','Rio de Janeiro','RJ','BR',-22.9997,-43.3646,ARRAY['vestiario','sauna','crossfit','ar_condicionado'],true,4.4,63,178)
ON CONFLICT (id) DO NOTHING;

-- Academia do Alexandre
INSERT INTO user_gyms (user_id, gym_place_id, name, city, state, is_primary) VALUES
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Smart Fit Paulista','São Paulo','SP',true)
ON CONFLICT DO NOTHING;

-- Academias dos usuários fictícios
INSERT INTO user_gyms (user_id, gym_place_id, name, city, state, is_primary) VALUES
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Smart Fit Paulista','São Paulo','SP',true),
  ('22222222-2222-2222-2222-222222222222','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Bodytech Vila Olímpia','São Paulo','SP',true),
  ('55555555-5555-5555-5555-555555555555','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Smart Fit Paulista','São Paulo','SP',true),
  ('33333333-3333-3333-3333-333333333333','cccccccc-cccc-cccc-cccc-cccccccccccc','Bio Ritmo Barra da Tijuca','Rio de Janeiro','RJ',true)
ON CONFLICT DO NOTHING;


-- =============================================================
-- BLOCO 6 — GYM CHECK-INS
-- =============================================================

INSERT INTO gym_checkins (user_id, gym_place_id, checked_in_at) VALUES
  -- Alexandre (últimos 14 dias, 9 check-ins)
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '0 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '2 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '4 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '6 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '8 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '10 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '12 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '14 days'),
  -- Marcos
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '0 days'),
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '3 days'),
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '7 days'),
  -- Juliana
  ('22222222-2222-2222-2222-222222222222','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '1 day'),
  ('22222222-2222-2222-2222-222222222222','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '4 days'),
  ('22222222-2222-2222-2222-222222222222','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '7 days'),
  -- Pedro
  ('55555555-5555-5555-5555-555555555555','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '0 days'),
  ('55555555-5555-5555-5555-555555555555','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '3 days'),
  ('55555555-5555-5555-5555-555555555555','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '6 days'),
  -- Rafael
  ('33333333-3333-3333-3333-333333333333','cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '0 days'),
  ('33333333-3333-3333-3333-333333333333','cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333333','cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '2 days');


-- =============================================================
-- BLOCO 7 — TREINOS (workout_logs + set_logs) - Alexandre
-- =============================================================

-- Treino A: Peito + Tríceps (hoje)
INSERT INTO workout_logs (id, user_id, gym_id, started_at, finished_at, duration_sec, perceived_effort, notes, verified_checkin) VALUES
  ('wl000001-0000-0000-0000-000000000001','aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 3600, 8, 'Treino A — Peito e Tríceps. Ótimo pump!', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO set_logs (workout_log_id, exercise_id, set_number, reps, weight_kg) VALUES
  ('wl000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000002',1,10,80),
  ('wl000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000002',2,10,80),
  ('wl000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000002',3,8,85),
  ('wl000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000002',4,6,90),
  ('wl000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000012',1,12,55),
  ('wl000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000012',2,12,55),
  ('wl000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000012',3,10,60),
  ('wl000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000009',1,15,25),
  ('wl000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000009',2,15,25),
  ('wl000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000009',3,12,27.5);

-- Treino B: Costas + Bíceps (2 dias atrás)
INSERT INTO workout_logs (id, user_id, gym_id, started_at, finished_at, duration_sec, perceived_effort, notes, verified_checkin) VALUES
  ('wl000002-0000-0000-0000-000000000002','aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   NOW() - INTERVAL '2 days 2 hours', NOW() - INTERVAL '2 days 1 hour', 3900, 7, 'Treino B — Costas e Bíceps.', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO set_logs (workout_log_id, exercise_id, set_number, reps, weight_kg) VALUES
  ('wl000002-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000006',1,12,55),
  ('wl000002-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000006',2,10,60),
  ('wl000002-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000006',3,10,60),
  ('wl000002-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000008',1,10,60),
  ('wl000002-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000008',2,10,60),
  ('wl000002-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000008',3,8,65),
  ('wl000002-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000013',1,8,NULL),
  ('wl000002-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000013',2,7,NULL),
  ('wl000002-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000004',1,12,30),
  ('wl000002-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000004',2,10,32.5),
  ('wl000002-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000004',3,10,32.5);

-- Treino C: Pernas (4 dias atrás)
INSERT INTO workout_logs (id, user_id, gym_id, started_at, finished_at, duration_sec, perceived_effort, notes, verified_checkin) VALUES
  ('wl000003-0000-0000-0000-000000000003','aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   NOW() - INTERVAL '4 days 2 hours', NOW() - INTERVAL '4 days 1 hour', 4200, 9, 'Treino C — Pernas. Pesado demais!', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO set_logs (workout_log_id, exercise_id, set_number, reps, weight_kg) VALUES
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000001',1,8,100),
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000001',2,8,100),
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000001',3,6,110),
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000001',4,6,110),
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000007',1,12,160),
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000007',2,12,160),
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000007',3,10,180),
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000011',1,10,60),
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000011',2,10,60),
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000019',1,15,50),
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000019',2,15,50),
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000020',1,12,40),
  ('wl000003-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000020',2,12,40);

-- Treino D: Ombros + Cardio (6 dias atrás)
INSERT INTO workout_logs (id, user_id, gym_id, started_at, finished_at, duration_sec, perceived_effort, notes, verified_checkin) VALUES
  ('wl000004-0000-0000-0000-000000000004','aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   NOW() - INTERVAL '6 days 2 hours', NOW() - INTERVAL '6 days 1 hour', 3300, 7, 'Ombros + 20min esteira.', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO set_logs (workout_log_id, exercise_id, set_number, reps, weight_kg) VALUES
  ('wl000004-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000005',1,10,50),
  ('wl000004-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000005',2,10,50),
  ('wl000004-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000005',3,8,55),
  ('wl000004-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000010',1,15,10),
  ('wl000004-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000010',2,15,10),
  ('wl000004-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000010',3,12,12),
  ('wl000004-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000015',1,NULL,NULL);

-- Treino Peito (8 dias atrás)
INSERT INTO workout_logs (id, user_id, gym_id, started_at, finished_at, duration_sec, perceived_effort, verified_checkin) VALUES
  ('wl000005-0000-0000-0000-000000000005','aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   NOW() - INTERVAL '8 days 2 hours', NOW() - INTERVAL '8 days 1 hour', 3600, 8, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO set_logs (workout_log_id, exercise_id, set_number, reps, weight_kg) VALUES
  ('wl000005-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000002',1,10,77.5),
  ('wl000005-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000002',2,10,77.5),
  ('wl000005-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000002',3,8,82.5),
  ('wl000005-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000014',1,15,NULL),
  ('wl000005-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000014',2,15,NULL);

-- Terra + Costas (10 dias atrás)
INSERT INTO workout_logs (id, user_id, gym_id, started_at, finished_at, duration_sec, perceived_effort, verified_checkin) VALUES
  ('wl000006-0000-0000-0000-000000000006','aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   NOW() - INTERVAL '10 days 2 hours', NOW() - INTERVAL '10 days 1 hour', 4500, 9, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO set_logs (workout_log_id, exercise_id, set_number, reps, weight_kg) VALUES
  ('wl000006-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000003',1,5,120),
  ('wl000006-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000003',2,5,130),
  ('wl000006-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000003',3,3,140),
  ('wl000006-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000006',1,12,52.5),
  ('wl000006-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000006',2,10,57.5),
  ('wl000006-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000006',3,10,57.5);

-- Pernas (12 dias atrás)
INSERT INTO workout_logs (id, user_id, gym_id, started_at, finished_at, duration_sec, perceived_effort, verified_checkin) VALUES
  ('wl000007-0000-0000-0000-000000000007','aee7d333-6741-4406-aa87-7f1e79a3ebaf','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   NOW() - INTERVAL '12 days 2 hours', NOW() - INTERVAL '12 days 1 hour', 4200, 8, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO set_logs (workout_log_id, exercise_id, set_number, reps, weight_kg) VALUES
  ('wl000007-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000001',1,8,97.5),
  ('wl000007-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000001',2,8,97.5),
  ('wl000007-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000001',3,8,97.5),
  ('wl000007-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000018',1,12,20),
  ('wl000007-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000018',2,12,20);

-- Treinos dos usuários fictícios (para ranking)
INSERT INTO workout_logs (id, user_id, gym_id, started_at, finished_at, duration_sec, perceived_effort, verified_checkin) VALUES
  ('wlm00001-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '0 days 3 hours', NOW() - INTERVAL '0 days 2 hours', 4800, 9, true),
  ('wlm00002-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '1 day 2 hours',  NOW() - INTERVAL '1 day 1 hour',  5100, 9, true),
  ('wlm00003-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '1 day 2 hours',  NOW() - INTERVAL '1 day 1 hour',  2700, 6, true),
  ('wlm00004-0000-0000-0000-000000000004','33333333-3333-3333-3333-333333333333','cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '0 days 4 hours', NOW() - INTERVAL '0 days 3 hours', 5400,10, true),
  ('wlm00005-0000-0000-0000-000000000005','55555555-5555-5555-5555-555555555555','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '0 days 5 hours', NOW() - INTERVAL '0 days 4 hours', 3900, 8, true)
ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- BLOCO 8 — REFEIÇÕES (meal_logs) — Alexandre
-- =============================================================

INSERT INTO meal_logs (user_id, logged_at, meal_type, food_id, amount_g, calories_kcal, protein_g, carbs_g, fats_g, input_method) VALUES
  -- Hoje — Café da manhã
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '5 hours','breakfast','f0000001-0000-0000-0000-000000000006',80, 311,13.6,52.8,5.6,'manual'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '5 hours','breakfast','f0000001-0000-0000-0000-000000000007',120,107,1.3,27.6,0.4,'manual'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '5 hours','breakfast','f0000001-0000-0000-0000-000000000011',200,118,20,7.2,0.8,'manual'),
  -- Hoje — Almoço
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '2 hours','lunch','f0000001-0000-0000-0000-000000000001',200,330,62,0,7.2,'manual'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '2 hours','lunch','f0000001-0000-0000-0000-000000000002',150,195,4.1,42,0.5,'manual'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '2 hours','lunch','f0000001-0000-0000-0000-000000000008',100, 76,4.8,14,0.5,'manual'),
  -- Ontem — Café
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '29 hours','breakfast','f0000001-0000-0000-0000-000000000006',80,311,13.6,52.8,5.6,'manual'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '29 hours','breakfast','f0000001-0000-0000-0000-000000000004',180,257,22.7,1.3,17.1,'manual'),
  -- Ontem — Almoço
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '26 hours','lunch','f0000001-0000-0000-0000-000000000009',180,371,50.4,0,18,'manual'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '26 hours','lunch','f0000001-0000-0000-0000-000000000003',200,172,3.2,40,0.2,'manual'),
  -- Ontem — Jantar
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '22 hours','dinner','f0000001-0000-0000-0000-000000000001',220,363,68.2,0,7.9,'manual'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '22 hours','dinner','f0000001-0000-0000-0000-000000000002',130,169,3.5,36.4,0.4,'manual'),
  -- Pré-treino (hoje)
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '3 hours','pre_workout','f0000001-0000-0000-0000-000000000005',35,133,28,2.8,1.8,'manual'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW() - INTERVAL '3 hours','pre_workout','f0000001-0000-0000-0000-000000000007',100, 89,1.1,23,0.3,'manual');


-- =============================================================
-- BLOCO 9 — PESO (weight_logs) — Alexandre
-- =============================================================

INSERT INTO weight_logs (user_id, weight_kg, body_fat_percent, logged_at) VALUES
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', 84.2, 20.1, NOW() - INTERVAL '30 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', 83.9, 19.8, NOW() - INTERVAL '27 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', 83.6, 19.5, NOW() - INTERVAL '24 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', 83.4, 19.3, NOW() - INTERVAL '21 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', 83.1, 19.0, NOW() - INTERVAL '18 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', 82.9, 18.8, NOW() - INTERVAL '15 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', 82.7, 18.7, NOW() - INTERVAL '12 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', 82.5, 18.5, NOW() - INTERVAL '9 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', 82.5, 18.5, NOW() - INTERVAL '6 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', 82.3, 18.3, NOW() - INTERVAL '3 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', 82.1, 18.1, NOW());


-- =============================================================
-- BLOCO 10 — CONQUISTAS (achievements catalog)
-- =============================================================

INSERT INTO achievements (id, slug, title, description, icon, category, rarity, xp_reward, criteria) VALUES
  ('ac000001-0000-0000-0000-000000000001','first_workout','Primeiro Treino','Completou seu primeiro treino registrado','💪','workout','common',50,'{"workouts_total":1}'),
  ('ac000002-0000-0000-0000-000000000002','week_streak','Semana Consistente','7 dias de streak','🔥','consistency','uncommon',150,'{"streak":7}'),
  ('ac000003-0000-0000-0000-000000000003','strength_100','Centurião da Força','Levantou 100kg no agachamento','🏋','strength','uncommon',200,'{"squat_1rm":100}'),
  ('ac000004-0000-0000-0000-000000000004','nutrition_week','Nutrição em Dia','7 dias atingindo meta calórica','🥗','nutrition','uncommon',120,'{"nutrition_days":7}'),
  ('ac000005-0000-0000-0000-000000000005','early_bird','Madrugador','Treinou antes das 7h','🌅','lifestyle','common',50,'{"early_workout":1}'),
  ('ac000006-0000-0000-0000-000000000006','social_butterfly','Social','Fez 3 amigos no app','👥','social','common',75,'{"friends_count":3}'),
  ('ac000007-0000-0000-0000-000000000007','iron_will','Vontade de Ferro','30 dias de streak','⚡','consistency','rare',500,'{"streak":30}'),
  ('ac000008-0000-0000-0000-000000000008','gym_regular','Frequentador Assíduo','30 check-ins na academia','🏟','workout','uncommon',300,'{"gym_checkins":30}'),
  ('ac000009-0000-0000-0000-000000000009','protein_king','Rei das Proteínas','Atingiu meta proteica por 14 dias','🍗','nutrition','rare',400,'{"protein_days":14}'),
  ('ac000010-0000-0000-0000-000000000010','level_10','Nível 10','Atingiu o nível 10','⭐','progression','uncommon',250,'{"level":10}')
ON CONFLICT (slug) DO NOTHING;

-- Conquistas do Alexandre
INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','ac000001-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','ac000002-0000-0000-0000-000000000002', NOW() - INTERVAL '7 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','ac000003-0000-0000-0000-000000000003', NOW() - INTERVAL '4 days'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','ac000005-0000-0000-0000-000000000005', NOW() - INTERVAL '20 days')
ON CONFLICT DO NOTHING;


-- =============================================================
-- BLOCO 11 — QUESTS DIÁRIAS — Alexandre (hoje)
-- =============================================================

INSERT INTO daily_quests (user_id, quest_date, title, description, xp_reward, target_type, target_value, progress, completed, completed_at) VALUES
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', CURRENT_DATE, 'Treino do dia',      'Complete um treino hoje',          100, 'workout',  1, 1, true,  NOW() - INTERVAL '1 hour'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', CURRENT_DATE, 'Meta de proteína',   'Consuma 165g de proteína',          75, 'protein',  165, 90, false, NULL),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', CURRENT_DATE, 'Hidratação',         'Beba 3 litros de água',             50, 'water',    3000, 1800, false, NULL),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', CURRENT_DATE, 'Registro de refeição','Registre 3 refeições completas',   60, 'meals',    3, 2, false, NULL)
ON CONFLICT DO NOTHING;


-- =============================================================
-- BLOCO 12 — TRILHAS GUIADAS
-- =============================================================

INSERT INTO trails (id, slug, title, subtitle, description, duration_days, level, goal, cover_emoji, is_premium, days_config) VALUES
  (
    'tr000001-0000-0000-0000-000000000001',
    'hipertrofia-iniciante-21',
    'Hipertrofia para Iniciantes',
    '21 dias para começar a ganhar massa',
    'Trilha progressiva de 21 dias focada em construção de base muscular para quem está começando na academia. Treinos 3x por semana, aumento gradual de carga.',
    21, 'beginner', 'muscle_gain', '💪', false,
    '[
      {"day":1,"title":"Apresentação + Teste","type":"workout","exercises":["agachamento-livre","supino-reto","remada-curvada"]},
      {"day":2,"title":"Descanso ativo","type":"rest","notes":"Caminhada leve 20min"},
      {"day":3,"title":"Peito e Tríceps","type":"workout","exercises":["supino-reto","flexao-de-braco","triceps-pulley"]},
      {"day":4,"title":"Descanso","type":"rest"},
      {"day":5,"title":"Pernas","type":"workout","exercises":["agachamento-livre","leg-press","cadeira-extensora"]}
    ]'::jsonb
  ),
  (
    'tr000002-0000-0000-0000-000000000002',
    'definicao-30-dias',
    'Definição em 30 Dias',
    'Programa completo de cutting com cardio integrado',
    'Combine treino de força e cardio estratégico para perder gordura mantendo a massa muscular. Inclui orientações nutricionais diárias.',
    30, 'intermediate', 'weight_loss', '🔥', false,
    '[
      {"day":1,"title":"Avaliação inicial","type":"assessment","notes":"Tire foto e registre peso"},
      {"day":2,"title":"Circuito Full Body","type":"workout","exercises":["agachamento-livre","supino-reto","remada-curvada","corrida"]},
      {"day":3,"title":"Cardio HIIT 30min","type":"cardio"},
      {"day":4,"title":"Costas e Bíceps","type":"workout"}
    ]'::jsonb
  ),
  (
    'tr000003-0000-0000-0000-000000000003',
    'desafio-corrida-60-dias',
    'Do Zero aos 5km',
    'Run 60 dias — saia do sofá e complete seus primeiros 5km',
    'Programa progressivo para quem nunca correu ou parou de correr. Começa com caminhadas e intervalos, terminando com corrida contínua de 5km.',
    60, 'beginner', 'endurance', '🏃', false,
    '[
      {"day":1,"title":"Caminhada 20min","type":"cardio","duration_min":20},
      {"day":2,"title":"Descanso","type":"rest"},
      {"day":3,"title":"Corrida 1min + Caminhada 4min (5x)","type":"cardio","duration_min":25},
      {"day":4,"title":"Descanso","type":"rest"},
      {"day":5,"title":"Repetir semana 1 treino 2","type":"cardio","duration_min":25}
    ]'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

-- Alexandre inscrito na trilha de hipertrofia
INSERT INTO user_trails (user_id, trail_id, started_at, current_day, status) VALUES
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','tr000001-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days', 6, 'active')
ON CONFLICT DO NOTHING;


-- =============================================================
-- BLOCO 13 — PROFISSIONAIS
-- =============================================================

INSERT INTO professionals (id, user_id, profession, council_type, council_number, council_state, full_name, bio, city, state, specialties, modalities, price_consultation, price_monthly, verified, active, rating_avg, rating_count) VALUES
  (
    'pr000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'personal_trainer', 'CREF', '123456-G/SP', 'SP',
    'Marcos Vieira',
    'Personal trainer com 10 anos de experiência em hipertrofia, emagrecimento e reabilitação. Especialista em treino funcional e musculação.',
    'São Paulo','SP',
    ARRAY['hipertrofia','emagrecimento','funcional'],
    ARRAY['online','presencial'],
    180.00, 650.00, true, true, 4.8, 47
  ),
  (
    'pr000002-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'nutritionist', 'CRN', '78901-SP', 'SP',
    'Juliana Santos',
    'Nutricionista esportiva especializada em emagrecimento saudável, hipertrofia e dietas plant-based. Atendimento online em todo o Brasil.',
    'São Paulo','SP',
    ARRAY['esportiva','emagrecimento','vegana','vegetariana'],
    ARRAY['online'],
    150.00, 500.00, true, true, 4.9, 82
  ),
  (
    'pr000003-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333333',
    'physiotherapist', 'CREFITO', '45678-F/RJ', 'RJ',
    'Rafael Costa',
    'Fisioterapeuta esportivo com foco em prevenção e reabilitação de lesões. Experiência com atletas amadores e profissionais de corrida e musculação.',
    'Rio de Janeiro','RJ',
    ARRAY['reabilitacao','esportiva','corrida','musculacao'],
    ARRAY['presencial','online'],
    200.00, NULL, true, true, 4.7, 31
  )
ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- BLOCO 14 — POSTS DA COMUNIDADE
-- =============================================================

INSERT INTO community_posts (id, author_id, content, likes_count, comments_count, moderation_status, created_at) VALUES
  ('cp000001-0000-0000-0000-000000000001','aee7d333-6741-4406-aa87-7f1e79a3ebaf',
   'Primeira semana de dieta consistente completada! 🎉 Consegui bater a meta de proteína todos os dias. Quem mais tá no desafio?',
   12,3,'approved', NOW() - INTERVAL '3 days'),
  ('cp000002-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',
   'PR novo no agachamento hoje — 140kg! 💪 Consistência é tudo. Três anos de treino para chegar aqui.',
   34,8,'approved', NOW() - INTERVAL '1 day'),
  ('cp000003-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222',
   'Dica de nutrição: adicionar canela na aveia não só melhora o sabor mas também ajuda no controle glicêmico. Ótimo para quem treina de manhã!',
   21,5,'approved', NOW() - INTERVAL '2 days'),
  ('cp000004-0000-0000-0000-000000000004','33333333-3333-3333-3333-333333333333',
   'Fui correr na orla hoje às 6h da manhã. 12km em 52 minutos. Melhor que qualquer café! ☀️🏃',
   18,4,'approved', NOW() - INTERVAL '4 hours'),
  ('cp000005-0000-0000-0000-000000000005','55555555-5555-5555-5555-555555555555',
   'Semana difícil no trabalho mas não deixei o treino de lado. 5 dias de academia essa semana. Você decide suas prioridades!',
   29,7,'approved', NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- BLOCO 15 — AMIZADES
-- =============================================================

INSERT INTO friendships (requester_id, addressee_id, status) VALUES
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','11111111-1111-1111-1111-111111111111','accepted'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','22222222-2222-2222-2222-222222222222','accepted'),
  ('55555555-5555-5555-5555-555555555555','aee7d333-6741-4406-aa87-7f1e79a3ebaf','accepted'),
  ('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','accepted'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','44444444-4444-4444-4444-444444444444','pending')
ON CONFLICT DO NOTHING;


-- =============================================================
-- BLOCO 16 — DESAFIOS DE COMUNIDADE (participantes + check-ins)
-- =============================================================

-- Busca IDs dos desafios existentes por slug e insere participantes
-- (os 5 desafios já foram inseridos na migration anterior)

DO $$
DECLARE
  ch_id uuid;
BEGIN
  -- Desafio de flexão
  SELECT id INTO ch_id FROM community_challenges WHERE slug = '30-dias-flexao' LIMIT 1;
  IF ch_id IS NOT NULL THEN
    INSERT INTO community_challenge_participants (challenge_id, user_id, enrolled_at, check_in_count, current_progress, last_check_in_at)
    VALUES
      (ch_id,'aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW()-INTERVAL '10 days', 8, 800, NOW()-INTERVAL '1 day'),
      (ch_id,'11111111-1111-1111-1111-111111111111',  NOW()-INTERVAL '12 days',10,1100, NOW()),
      (ch_id,'55555555-5555-5555-5555-555555555555',  NOW()-INTERVAL '8 days',  7, 700, NOW()-INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    INSERT INTO community_challenge_checkins (challenge_id, user_id, checked_in_at, value, notes)
    VALUES
      (ch_id,'aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW()-INTERVAL '1 day',  100,'Difícil mas consegui!'),
      (ch_id,'aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW()-INTERVAL '3 days', 100,'Firme!'),
      (ch_id,'11111111-1111-1111-1111-111111111111',  NOW()-INTERVAL '0 days', 110,'Novo recorde pessoal'),
      (ch_id,'55555555-5555-5555-5555-555555555555',  NOW()-INTERVAL '2 days', 100,'Dói mas vale a pena')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Desafio de agachamento
  SELECT id INTO ch_id FROM community_challenges WHERE slug = '100-agachamentos-dia' LIMIT 1;
  IF ch_id IS NOT NULL THEN
    INSERT INTO community_challenge_participants (challenge_id, user_id, enrolled_at, check_in_count, current_progress, last_check_in_at)
    VALUES
      (ch_id,'aee7d333-6741-4406-aa87-7f1e79a3ebaf', NOW()-INTERVAL '5 days', 4, 400, NOW()-INTERVAL '1 day'),
      (ch_id,'22222222-2222-2222-2222-222222222222',  NOW()-INTERVAL '6 days', 5, 500, NOW())
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- =============================================================
-- BLOCO 17 — EXAMES + BIOMARCADORES — Alexandre
-- =============================================================

INSERT INTO lab_exams (id, user_id, exam_date, lab_name, title, processed) VALUES
  ('le000001-0000-0000-0000-000000000001','aee7d333-6741-4406-aa87-7f1e79a3ebaf','2026-03-15','Fleury','Hemograma + Bioquímica + Hormônios',true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO biomarkers (user_id, lab_exam_id, marker_key, marker_name, value, unit, reference_min, reference_max, status, measured_at) VALUES
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','le000001-0000-0000-0000-000000000001','testosterone_total','Testosterona Total',    580,  'ng/dL', 280,  800,  'normal',  '2026-03-15'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','le000001-0000-0000-0000-000000000001','vitamin_d',          'Vitamina D (25-OH)',      28,   'ng/mL', 30,   100,  'low',     '2026-03-15'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','le000001-0000-0000-0000-000000000001','ferritin',           'Ferritina',              95,   'ng/mL', 30,   400,  'normal',  '2026-03-15'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','le000001-0000-0000-0000-000000000001','glucose_fasting',    'Glicemia de Jejum',      92,   'mg/dL', 70,   99,   'normal',  '2026-03-15'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','le000001-0000-0000-0000-000000000001','creatinine',         'Creatinina',             1.05, 'mg/dL', 0.7,  1.2,  'normal',  '2026-03-15'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','le000001-0000-0000-0000-000000000001','hdl',                'HDL Colesterol',         52,   'mg/dL', 40,   60,   'normal',  '2026-03-15'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','le000001-0000-0000-0000-000000000001','ldl',                'LDL Colesterol',         128,  'mg/dL', 0,    130,  'normal',  '2026-03-15'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf','le000001-0000-0000-0000-000000000001','tsh',                'TSH',                    2.1,  'mUI/L', 0.4,  4.0,  'normal',  '2026-03-15')
ON CONFLICT DO NOTHING;


-- =============================================================
-- BLOCO 18 — MORNING CHECK-INS — Alexandre (últimos 7 dias)
-- =============================================================

INSERT INTO morning_checkins (user_id, checkin_date, sleep_quality, sleep_hours, energy_level, mood, stress_level, notes) VALUES
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', CURRENT_DATE - 6, 4, 8.0, 4, 4, 2, 'Semana boa, energia alta'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', CURRENT_DATE - 5, 3, 6.5, 3, 3, 3, 'Reunião cedo, dormi menos'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', CURRENT_DATE - 4, 5, 9.0, 5, 5, 1, 'Descansado, dia de pernas'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', CURRENT_DATE - 3, 4, 7.5, 4, 4, 2, NULL),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', CURRENT_DATE - 2, 3, 6.0, 3, 3, 4, 'Estressado com prazo no trabalho'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', CURRENT_DATE - 1, 4, 7.5, 4, 4, 2, 'Recuperando bem'),
  ('aee7d333-6741-4406-aa87-7f1e79a3ebaf', CURRENT_DATE,     5, 8.0, 5, 5, 1, 'Ótimo! Pronto para treinar')
ON CONFLICT (user_id, checkin_date) DO NOTHING;


-- =============================================================
-- BLOCO 19 — PROGRESSO DE HABILIDADES — Alexandre
-- =============================================================

-- Atualiza algumas skills com progresso realista para o Alexandre
UPDATE user_skills SET
  status = 'mastered',
  progress = '{"reps_in_a_set": 20, "sessions_practiced": 15}',
  first_practice_at = NOW() - INTERVAL '25 days',
  mastered_at = NOW() - INTERVAL '5 days'
WHERE user_id = 'aee7d333-6741-4406-aa87-7f1e79a3ebaf'
  AND skill_key = 'flexao_basica';

UPDATE user_skills SET
  status = 'mastered',
  progress = '{"reps_in_a_set": 15, "sessions_practiced": 12}',
  first_practice_at = NOW() - INTERVAL '20 days',
  mastered_at = NOW() - INTERVAL '3 days'
WHERE user_id = 'aee7d333-6741-4406-aa87-7f1e79a3ebaf'
  AND skill_key = 'agachamento_basico';

UPDATE user_skills SET
  status = 'in_progress',
  progress = '{"reps_in_a_set": 8, "sessions_practiced": 7}',
  first_practice_at = NOW() - INTERVAL '10 days'
WHERE user_id = 'aee7d333-6741-4406-aa87-7f1e79a3ebaf'
  AND skill_key = 'flexao_diamante';

UPDATE user_skills SET
  status = 'in_progress',
  progress = '{"weight_pct_bodyweight": 110, "sessions_practiced": 9}',
  first_practice_at = NOW() - INTERVAL '12 days'
WHERE user_id = 'aee7d333-6741-4406-aa87-7f1e79a3ebaf'
  AND skill_key = 'agachamento_barra';

UPDATE user_skills SET
  status = 'in_progress',
  progress = '{"sessions_practiced": 5, "seconds_held": 40}',
  first_practice_at = NOW() - INTERVAL '8 days'
WHERE user_id = 'aee7d333-6741-4406-aa87-7f1e79a3ebaf'
  AND skill_key = 'prancha_30s';

UPDATE user_skills SET
  status = 'in_progress',
  progress = '{"reps_in_a_set": 4, "sessions_practiced": 6}',
  first_practice_at = NOW() - INTERVAL '14 days'
WHERE user_id = 'aee7d333-6741-4406-aa87-7f1e79a3ebaf'
  AND skill_key = 'barra_fixa';

-- =============================================================
-- FIM DO SEED
-- =============================================================
