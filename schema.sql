-- ============================================================
-- DUS Platform — Supabase Schema
-- Supabase SQL Editor'da çalıştır (tek seferde)
-- ============================================================

-- -------------------------------------------------------
-- 1. KULLANICILAR
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname      text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_admin      boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- -------------------------------------------------------
-- 2. BRANŞLAR
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  icon       text,
  color      text,
  sort_order int DEFAULT 0
);

-- 8 branş sabit olarak girildi (app'te de hard-coded var, tutarlı olsun)
INSERT INTO public.branches (id, name, icon, color, sort_order) VALUES
  (1, 'Restoratif Diş Tedavisi',          '🦷', '#3b82f6', 1),
  (2, 'Protetik Diş Tedavisi',            '🔩', '#8b5cf6', 2),
  (3, 'Ağız, Diş ve Çene Cerrahisi',      '⚕️',  '#ef4444', 3),
  (4, 'Ağız, Diş ve Çene Radyolojisi',   '🔬', '#f97316', 4),
  (5, 'Periodontoloji',                   '🌿', '#22c55e', 5),
  (6, 'Ortodonti',                        '😁', '#14b8a6', 6),
  (7, 'Endodonti',                        '🔧', '#f59e0b', 7),
  (8, 'Pedodonti (Çocuk Diş Hekimliği)', '👶', '#ec4899', 8)
ON CONFLICT (id) DO NOTHING;

-- Sequence'ı güncelle
SELECT setval('public.branches_id_seq', 8, true);

-- -------------------------------------------------------
-- 3. KONULAR
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.topics (
  id         serial PRIMARY KEY,
  branch_id  int REFERENCES public.branches(id) ON DELETE CASCADE,
  title      text NOT NULL,
  content    text,            -- markdown formatında
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- -------------------------------------------------------
-- 4. SORULAR
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id             serial PRIMARY KEY,
  topic_id       int REFERENCES public.topics(id) ON DELETE CASCADE,
  question_text  text NOT NULL,
  options        jsonb,        -- ["A şıkkı", "B şıkkı", ...]
  correct_answer int,          -- 0-4 arası index
  explanation    text,
  created_at     timestamptz DEFAULT now()
);

-- -------------------------------------------------------
-- 5. KULLANICI KONU İLERLEMESİ
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_topic_progress (
  user_id      uuid REFERENCES public.users(id) ON DELETE CASCADE,
  topic_id     int  REFERENCES public.topics(id) ON DELETE CASCADE,
  completed    boolean DEFAULT false,
  completed_at timestamptz,
  PRIMARY KEY (user_id, topic_id)
);

-- -------------------------------------------------------
-- 6. KULLANICI KART VERİLERİ (SM-2)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_cards (
  user_id       uuid  REFERENCES public.users(id) ON DELETE CASCADE,
  question_id   int   REFERENCES public.questions(id) ON DELETE CASCADE,
  status        text  DEFAULT 'new',    -- new | learning | review | relearning
  interval      float DEFAULT 0,        -- gün cinsinden
  ease_factor   float DEFAULT 2.5,
  repetitions   int   DEFAULT 0,
  due_date      timestamptz,
  learning_step int   DEFAULT 0,
  last_review   timestamptz,
  PRIMARY KEY (user_id, question_id),
  CONSTRAINT valid_status CHECK (status IN ('new', 'learning', 'review', 'relearning'))
);

-- -------------------------------------------------------
-- 7. INDEXLER (performans)
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_topics_branch_id       ON public.topics(branch_id);
CREATE INDEX IF NOT EXISTS idx_topics_sort_order      ON public.topics(branch_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id     ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_user_id     ON public.user_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_due_date    ON public.user_cards(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_user_cards_status      ON public.user_cards(user_id, status);
CREATE INDEX IF NOT EXISTS idx_utp_user_id            ON public.user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_users_nickname         ON public.users(nickname);

-- -------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- Not: Custom auth kullandığımız için (Supabase Auth değil)
-- anon key ile erişime izin veriyoruz.
-- Güvenlik: Supabase projesini private tutun ve
-- anon key'i sadece bu uygulamaya verin.
-- -------------------------------------------------------
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cards          ENABLE ROW LEVEL SECURITY;

-- Herkese okuma izni (anon dahil) — public içerik
CREATE POLICY "branches_read_all"  ON public.branches  FOR SELECT USING (true);
CREATE POLICY "topics_read_all"    ON public.topics    FOR SELECT USING (true);
CREATE POLICY "questions_read_all" ON public.questions FOR SELECT USING (true);

-- Kullanıcı tablosu: kayıt ve login için okuma/yazma
CREATE POLICY "users_insert"       ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_select"       ON public.users FOR SELECT USING (true);

-- Kullanıcı verileri: sadece kendi kaydı (client UUID ile filtre)
-- Not: Custom auth'ta RLS user() yok, bu yüzden anon'a kendi verilerine
-- erişim için full izin veriyoruz — client tarafında user_id ile filtrele.
CREATE POLICY "user_cards_all"     ON public.user_cards          FOR ALL USING (true);
CREATE POLICY "user_progress_all"  ON public.user_topic_progress FOR ALL USING (true);

-- Admin içerik yönetimi (topics, questions insert/update/delete)
CREATE POLICY "topics_write_all"    ON public.topics    FOR ALL USING (true);
CREATE POLICY "questions_write_all" ON public.questions FOR ALL USING (true);

-- -------------------------------------------------------
-- 9. YARDIMCI VIEW: Due kart sayısı (opsiyonel)
-- -------------------------------------------------------
-- Bu view'ı isterseniz dashboard query optimizasyonu için kullanabilirsiniz
CREATE OR REPLACE VIEW public.v_due_cards AS
  SELECT
    uc.user_id,
    q.topic_id,
    t.branch_id,
    COUNT(*) AS due_count
  FROM public.user_cards uc
  JOIN public.questions q ON q.id = uc.question_id
  JOIN public.topics    t ON t.id = q.topic_id
  WHERE uc.due_date <= now()
    AND uc.status != 'new'
  GROUP BY uc.user_id, q.topic_id, t.branch_id;
