-- ═══════════════════════════════════════════════════════════════
-- Onboarding — Database Migration
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

create table if not exists user_profiles (
  id                  uuid        default gen_random_uuid() primary key,
  user_id             uuid        references auth.users(id) on delete cascade not null unique,
  display_name        text,
  study_goal          text,           -- 'sinav_hazirligi', 'ders_basarisi', 'duzenli_aliskanlik', 'genel_gelisim'
  exam_type           text,           -- 'YKS', 'LGS', 'KPSS', 'DGS', 'ALES', 'diger'
  daily_available_mins int          not null default 120,
  preferred_hours     text          not null default 'afternoon',  -- 'morning','afternoon','evening','night'
  focus_intensity     text          not null default 'normal',     -- 'light','normal','intense'
  consistency_level   text          not null default 'sometimes',  -- 'never','rarely','sometimes','often','daily'
  onboarding_completed boolean      not null default false,
  onboarding_step     int           not null default 0,
  created_at          timestamptz   default now(),
  updated_at          timestamptz   default now()
);

alter table user_profiles enable row level security;
create policy "profiles_all" on user_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
