create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";
create extension if not exists "postgis";
create extension if not exists "vector";

create or replace function public.immutable_unaccent(text)
  returns text
  language sql
  immutable
  parallel safe
  strict
as $$
  select public.unaccent('public.unaccent'::regdictionary, $1)
$$;

create type user_role as enum ('user', 'professional', 'gym_admin', 'platform_admin');
create type fitness_goal as enum ('lose_fat', 'gain_muscle', 'maintain', 'performance', 'general_health', 'rehabilitation');
create type experience_level as enum ('beginner', 'intermediate', 'advanced');
create type training_location as enum ('home', 'gym', 'outdoor', 'hotel', 'crossfit_box', 'studio');
create type diet_type as enum ('balanced', 'low_carb', 'ketogenic', 'mediterranean', 'vegetarian', 'vegan', 'intermittent_fasting', 'flexible');
create type coach_tone as enum ('warm', 'motivational', 'technical', 'tough');
create type meal_type as enum ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack', 'pre_workout', 'post_workout');
create type subscription_plan as enum ('free', 'pro', 'premium');
create type subscription_status as enum ('active', 'past_due', 'canceled', 'trialing');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'user',
  full_name text,
  username text unique,
  avatar_url text,
  phone text,
  birth_date date,
  gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  city text,
  state text,
  country text default 'BR',
  onboarding_completed boolean not null default false,
  onboarding_step int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on profiles (role);
create index on profiles (city);

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  height_cm numeric(5,2),
  current_weight_kg numeric(5,2),
  target_weight_kg numeric(5,2),
  body_fat_percent numeric(4,2),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  sleep_hours_avg numeric(3,1),
  work_schedule text,
  available_minutes_per_day int,
  primary_goal fitness_goal not null default 'general_health',
  secondary_goals fitness_goal[],
  diet_preference diet_type default 'balanced',
  food_allergies text[],
  food_restrictions text[],
  disliked_foods text[],
  preferred_foods text[],
  experience_level experience_level not null default 'beginner',
  preferred_training_locations training_location[],
  available_equipment text[],
  injuries_notes text,
  medical_notes text,
  coach_tone coach_tone not null default 'warm',
  target_calories int,
  target_protein_g int,
  target_carbs_g int,
  target_fats_g int,
  target_water_ml int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.foods (
  id uuid primary key default uuid_generate_v4(),
  source text not null check (source in ('taco', 'usda', 'industrial', 'user_custom')),
  external_id text,
  barcode text,
  name text not null,
  name_normalized text,
  brand text,
  category text,
  calories_kcal numeric(6,2) not null,
  protein_g numeric(5,2) not null default 0,
  carbs_g numeric(5,2) not null default 0,
  fats_g numeric(5,2) not null default 0,
  fiber_g numeric(5,2) default 0,
  sugar_g numeric(5,2) default 0,
  sodium_mg numeric(7,2) default 0,
  saturated_fat_g numeric(5,2) default 0,
  serving_size_g numeric(6,2),
  serving_description text,
  verified boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.foods_set_normalized()
returns trigger as $$
begin
  new.name_normalized = lower(public.immutable_unaccent(new.name));
  return new;
end;
$$ language plpgsql;

create trigger foods_normalize_name
  before insert or update of name on public.foods
  for each row execute function public.foods_set_normalized();

create index on foods (barcode) where barcode is not null;
create index on foods using gin (name_normalized gin_trgm_ops);
create index on foods (source);

create table public.meal_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  meal_type meal_type not null,
  food_id uuid references foods(id),
  custom_food_name text,
  amount_g numeric(7,2) not null,
  calories_kcal numeric(7,2) not null,
  protein_g numeric(6,2) not null,
  carbs_g numeric(6,2) not null,
  fats_g numeric(6,2) not null,
  input_method text check (input_method in ('manual', 'voice', 'photo', 'barcode', 'text_natural')),
  photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index on meal_logs (user_id, logged_at desc);

create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name_pt text not null,
  name_en text,
  description text,
  instructions text[],
  common_mistakes text[],
  breathing_notes text,
  category text not null check (category in (
    'strength', 'calisthenics', 'cardio', 'mobility', 'stretching',
    'yoga', 'pilates', 'hiit', 'functional', 'olympic'
  )),
  primary_muscles text[] not null,
  secondary_muscles text[],
  equipment text[],
  difficulty int not null check (difficulty between 1 and 5),
  video_url text,
  thumbnail_url text,
  anatomy_3d_ref text,
  beginner_variation_id uuid references exercises(id),
  advanced_variation_id uuid references exercises(id),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index on exercises (category);
create index on exercises using gin (primary_muscles);
create index on exercises using gin (equipment);

create table public.workout_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  split_type text,
  weeks_duration int,
  goal fitness_goal,
  is_active boolean not null default true,
  starts_at date,
  ends_at date,
  created_by_ai boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index on workout_plans (user_id, is_active);

create table public.workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references workout_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  day_of_week int,
  estimated_duration_min int,
  order_index int,
  created_at timestamptz not null default now()
);

create table public.workout_session_exercises (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  order_index int not null,
  target_sets int not null,
  target_reps text,
  target_rest_sec int,
  target_rir int,
  notes text
);

create table public.workout_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references workout_sessions(id),
  gym_id uuid,
  started_at timestamptz not null,
  finished_at timestamptz,
  duration_sec int,
  perceived_effort int check (perceived_effort between 1 and 10),
  notes text,
  verified_checkin boolean not null default false,
  created_at timestamptz not null default now()
);

create index on workout_logs (user_id, started_at desc);

create table public.set_logs (
  id uuid primary key default uuid_generate_v4(),
  workout_log_id uuid not null references workout_logs(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  set_number int not null,
  reps int,
  weight_kg numeric(6,2),
  rir int,
  duration_sec int,
  distance_m numeric(8,2),
  notes text,
  created_at timestamptz not null default now()
);

create index on set_logs (workout_log_id);
create index on set_logs (exercise_id);

create table public.morning_checkins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  sleep_quality int check (sleep_quality between 1 and 10),
  sleep_hours numeric(3,1),
  energy_level int check (energy_level between 1 and 10),
  mood int check (mood between 1 and 10),
  stress_level int check (stress_level between 1 and 10),
  sore_muscles text[],
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create table public.daily_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  workout_session_id uuid references workout_sessions(id),
  meals_suggestion jsonb,
  water_goal_ml int,
  habits jsonb,
  ai_notes text,
  generated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table public.coach_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references coach_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_used int,
  model text,
  created_at timestamptz not null default now()
);

create index on coach_messages (conversation_id, created_at);

create table public.weight_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(5,2) not null,
  body_fat_percent numeric(4,2),
  logged_at timestamptz not null default now(),
  notes text
);

create index on weight_logs (user_id, logged_at desc);

create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan subscription_plan not null default 'free',
  status subscription_status not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index on subscriptions (user_id) where status = 'active';

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger set_updated_at before update on user_profiles
  for each row execute function set_updated_at();
create trigger set_updated_at before update on coach_conversations
  for each row execute function set_updated_at();
create trigger set_updated_at before update on subscriptions
  for each row execute function set_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.user_profiles (user_id)
  values (new.id);

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table profiles enable row level security;
alter table user_profiles enable row level security;
alter table meal_logs enable row level security;
alter table workout_plans enable row level security;
alter table workout_sessions enable row level security;
alter table workout_session_exercises enable row level security;
alter table workout_logs enable row level security;
alter table set_logs enable row level security;
alter table morning_checkins enable row level security;
alter table daily_plans enable row level security;
alter table coach_conversations enable row level security;
alter table coach_messages enable row level security;
alter table weight_logs enable row level security;
alter table subscriptions enable row level security;
alter table foods enable row level security;
alter table exercises enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

create policy "user_profiles_all_own" on user_profiles for all using (auth.uid() = user_id);

create policy "meal_logs_all_own" on meal_logs for all using (auth.uid() = user_id);

create policy "workout_plans_all_own" on workout_plans for all using (auth.uid() = user_id);

create policy "workout_sessions_all_own" on workout_sessions for all using (auth.uid() = user_id);

create policy "workout_session_exercises_all" on workout_session_exercises
  for all using (
    exists (
      select 1 from workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "workout_logs_all_own" on workout_logs for all using (auth.uid() = user_id);

create policy "set_logs_all_own" on set_logs
  for all using (
    exists (
      select 1 from workout_logs wl
      where wl.id = workout_log_id and wl.user_id = auth.uid()
    )
  );

create policy "morning_checkins_all_own" on morning_checkins for all using (auth.uid() = user_id);

create policy "daily_plans_all_own" on daily_plans for all using (auth.uid() = user_id);

create policy "coach_conversations_all_own" on coach_conversations for all using (auth.uid() = user_id);

create policy "coach_messages_all_own" on coach_messages
  for all using (
    exists (
      select 1 from coach_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "weight_logs_all_own" on weight_logs for all using (auth.uid() = user_id);

create policy "subscriptions_select_own" on subscriptions for select using (auth.uid() = user_id);

create policy "foods_select_all" on foods for select using (true);
create policy "exercises_select_all" on exercises for select using (true);
