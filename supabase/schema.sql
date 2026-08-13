-- ============================================================
-- Noetic OS — Core Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─────────────────────────────────────────
-- 1. TASK TEMPLATES
--    Pre-defined tasks grouped by subject & difficulty.
--    Difficulty: 1=Kolay  2=Orta  3=Zor
-- ─────────────────────────────────────────
create table if not exists task_templates (
  id          uuid primary key default gen_random_uuid(),
  subject     text    not null,
  title       text    not null,
  description text    not null,
  difficulty  int     not null check (difficulty between 1 and 3),
  xp_reward   int     not null,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- 2. DAILY TASKS
--    Each user gets up to 3 tasks per day.
--    One row = one task assigned to one user on one day.
-- ─────────────────────────────────────────
create table if not exists daily_tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid    not null references auth.users(id) on delete cascade,
  template_id  uuid    not null references task_templates(id),
  date         date    not null default current_date,
  completed    boolean not null default false,
  completed_at timestamptz,
  xp_earned    int     not null default 0,
  created_at   timestamptz default now(),
  unique (user_id, template_id, date)
);

-- ─────────────────────────────────────────
-- 3. USER XP
--    One row per user. Tracks level, total XP,
--    current difficulty and last active date.
-- ─────────────────────────────────────────
create table if not exists user_xp (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  total_xp           int  not null default 0,
  level              int  not null default 1,
  current_difficulty int  not null default 1 check (current_difficulty between 1 and 3),
  last_active_date   date,
  updated_at         timestamptz default now()
);

-- ─────────────────────────────────────────
-- 4. USER STREAKS
--    Tracks daily study streaks.
-- ─────────────────────────────────────────
create table if not exists user_streaks (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  current_streak int  not null default 0,
  longest_streak int  not null default 0,
  last_streak_date date,
  updated_at     timestamptz default now()
);

-- ─────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table task_templates  enable row level security;
alter table daily_tasks     enable row level security;
alter table user_xp         enable row level security;
alter table user_streaks    enable row level security;

-- task_templates: everyone can read
create policy "task_templates_read" on task_templates
  for select using (true);

-- daily_tasks: users see / modify only their own rows
create policy "daily_tasks_select" on daily_tasks
  for select using (auth.uid() = user_id);

create policy "daily_tasks_insert" on daily_tasks
  for insert with check (auth.uid() = user_id);

create policy "daily_tasks_update" on daily_tasks
  for update using (auth.uid() = user_id);

-- user_xp: own row only
create policy "user_xp_select" on user_xp
  for select using (auth.uid() = user_id);

create policy "user_xp_insert" on user_xp
  for insert with check (auth.uid() = user_id);

create policy "user_xp_update" on user_xp
  for update using (auth.uid() = user_id);

-- user_streaks: own row only
create policy "user_streaks_select" on user_streaks
  for select using (auth.uid() = user_id);

create policy "user_streaks_insert" on user_streaks
  for insert with check (auth.uid() = user_id);

create policy "user_streaks_update" on user_streaks
  for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 6. INDEXES
-- ─────────────────────────────────────────
create index if not exists daily_tasks_user_date
  on daily_tasks (user_id, date desc);

create index if not exists task_templates_difficulty
  on task_templates (difficulty);

-- ─────────────────────────────────────────
-- 7. SEED — TASK TEMPLATES
--    3 difficulties × 5 subjects × ~3 tasks each
-- ─────────────────────────────────────────

-- ── KOLAY (difficulty = 1) ──────────────
insert into task_templates (subject, title, description, difficulty, xp_reward) values
  ('Matematik',  'Temel işlemler tekrarı',       '10 adet dört işlem sorusu çöz.',                      1, 50),
  ('Matematik',  'Kesirler konusu',               'Kesir ekleme ve çıkarma soruları üzerinde çalış.',    1, 50),
  ('Matematik',  'Yüzde hesaplama',               '5 adet yüzde sorusu çöz.',                            1, 50),
  ('Fizik',      'Birimler ve dönüşümler',        'SI birimlerini ve dönüşüm formüllerini gözden geçir.',1, 50),
  ('Fizik',      'Temel kavramlar tekrarı',       'Hız, ivme ve kuvvet kavramlarını özetle.',            1, 50),
  ('Kimya',      'Periyodik tablo tekrarı',       'İlk 20 elementi ezbere yaz.',                         1, 50),
  ('Kimya',      'Atom yapısı',                   'Proton, nötron ve elektron kavramlarını özetle.',     1, 50),
  ('Türkçe',     'Kelime bilgisi',                '10 yeni kelimeyi öğren ve cümlede kullan.',            1, 50),
  ('Türkçe',     'Paragraf okuma',                'Bir paragraf oku ve ana fikri yaz.',                  1, 50),
  ('İngilizce',  'Günlük kelime tekrarı',         '10 İngilizce kelimeyi tekrar et.',                    1, 50),
  ('İngilizce',  'Temel cümle yapısı',            'Subject + Verb + Object yapısıyla 5 cümle yaz.',      1, 50),
  ('Tarih',      'Osmanlı kuruluş dönemi',        'Osmanlı Devleti''nin kuruluşunu özetle.',             1, 50);

-- ── ORTA (difficulty = 2) ───────────────
insert into task_templates (subject, title, description, difficulty, xp_reward) values
  ('Matematik',  'Denklem çözme',                '5 adet birinci dereceden denklem çöz.',               2, 100),
  ('Matematik',  'Geometri problemleri',          'Alan ve çevre hesaplayan 5 problem çöz.',             2, 100),
  ('Matematik',  'Olasılık',                      '3 adet temel olasılık sorusu çöz.',                   2, 100),
  ('Fizik',      'Newton''un yasaları',            'Her üç yasa için birer örnek problem çöz.',           2, 100),
  ('Fizik',      'Enerji ve iş',                  'Kinetik ve potansiyel enerji problemleri çöz.',       2, 100),
  ('Kimya',      'Mol hesaplamaları',             '3 adet mol kütlesi sorusu çöz.',                      2, 100),
  ('Kimya',      'Kimyasal tepkimeler',           'Denge ve denkleştirme soruları üzerinde çalış.',      2, 100),
  ('Türkçe',     'Yazım kuralları',               'Büyük harf ve noktalama kurallarını tekrar et.',      2, 100),
  ('Türkçe',     'Sözcük türleri',                'İsim, fiil, sıfat ve zarf örnekleri bul.',            2, 100),
  ('İngilizce',  'Present Perfect yapısı',        '5 Present Perfect cümlesi yaz ve çevir.',             2, 100),
  ('İngilizce',  'Okuma parçası analizi',         'Bir kısa metin oku, soruları yanıtla.',               2, 100),
  ('Tarih',      'Kurtuluş Savaşı aşamaları',     'Önemli cepheleri ve tarihleri özetle.',               2, 100);

-- ── ZOR (difficulty = 3) ────────────────
insert into task_templates (subject, title, description, difficulty, xp_reward) values
  ('Matematik',  'Türev uygulamaları',            '5 adet türev sorusu çöz, grafik yorumla.',            3, 200),
  ('Matematik',  'İntegral hesaplama',             '3 belirli integral hesapla.',                         3, 200),
  ('Matematik',  'Trigonometri soruları',          '5 ileri düzey trigonometri sorusu çöz.',              3, 200),
  ('Fizik',      'Elektrik devreleri',             'Seri ve paralel devre problemleri çöz.',              3, 200),
  ('Fizik',      'Dalgalar ve optik',             'Kırılma ve yansıma problemleri üzerinde çalış.',      3, 200),
  ('Kimya',      'Asit-Baz dengesi',              'pH hesaplama ve tampon çözelti soruları çöz.',        3, 200),
  ('Kimya',      'Organik kimya',                 'Hidrokarbonlar konusunu özetle, 3 soru çöz.',         3, 200),
  ('Türkçe',     'Kompozisyon yazma',             '300 kelimelik bir deneme yaz.',                       3, 200),
  ('Türkçe',     'Şiir analizi',                  'Bir şiiri edebi sanatlar açısından çözümle.',         3, 200),
  ('İngilizce',  'Essay yazma',                   '250 kelimelik bir opinion essay yaz.',                3, 200),
  ('İngilizce',  'Dinleme ve özet',               'Bir podcast dinle, İngilizce 5 cümleyle özetle.',    3, 200),
  ('Tarih',      'Birinci Dünya Savaşı analizi',  'Savaşın nedenlerini ve sonuçlarını karşılaştır.',     3, 200);
