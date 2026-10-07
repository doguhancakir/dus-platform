-- ============================================================
-- OVERHAUL MIGRATION — Supabase SQL Editor'da tek seferde çalıştır
-- Tekrar çalıştırılırsa zarar vermez (idempotent).
-- ============================================================

-- 1) Dışarıdan kayıt kesin kapalı
DROP POLICY IF EXISTS "users_insert" ON public.users;

-- 2) Admin kullanıcı yönetimi — sadece admin şifresiyle çalışır
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public._verify_admin(p_admin_nickname text, p_admin_password text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE h text;
BEGIN
  SELECT password_hash INTO h FROM public.users
  WHERE nickname = p_admin_nickname AND is_admin = true;
  IF h IS NULL THEN RETURN false; END IF;
  -- bcryptjs $2b$ ve pgcrypto $2a$ aynı algoritma; karşılaştırma için normalize et
  h := '$2a$' || substr(h, 5);
  RETURN extensions.crypt(p_admin_password, h) = h;
END $$;

REVOKE ALL ON FUNCTION public._verify_admin(text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_admin_nickname text, p_admin_password text, p_nickname text, p_password text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public._verify_admin(p_admin_nickname, p_admin_password) THEN
    RAISE EXCEPTION 'Admin şifresi hatalı';
  END IF;
  IF length(trim(p_nickname)) < 2 THEN RAISE EXCEPTION 'Kullanıcı adı en az 2 karakter olmalı'; END IF;
  IF length(p_password) < 4 THEN RAISE EXCEPTION 'Şifre en az 4 karakter olmalı'; END IF;
  IF EXISTS (SELECT 1 FROM public.users WHERE nickname = trim(p_nickname)) THEN
    RAISE EXCEPTION 'Bu kullanıcı adı zaten var';
  END IF;
  INSERT INTO public.users (nickname, password_hash, is_admin)
  VALUES (trim(p_nickname), extensions.crypt(p_password, extensions.gen_salt('bf', 10)), false)
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_password(
  p_admin_nickname text, p_admin_password text, p_user_id uuid, p_new_password text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF NOT public._verify_admin(p_admin_nickname, p_admin_password) THEN
    RAISE EXCEPTION 'Admin şifresi hatalı';
  END IF;
  IF length(p_new_password) < 4 THEN RAISE EXCEPTION 'Şifre en az 4 karakter olmalı'; END IF;
  UPDATE public.users
  SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10))
  WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kullanıcı bulunamadı'; END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_password(text, text, uuid, text) TO anon, authenticated;

-- 3) Uygulama ayarları (çalışma prompt'u burada saklanır)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_all" ON public.app_settings;
CREATE POLICY "app_settings_all" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- 4) Kişisel günlük hedefler (değişiklik geçmişiyle — eski günlerin streak'i bozulmaz)
CREATE TABLE IF NOT EXISTS public.user_goal_settings (
  user_id        uuid REFERENCES public.users(id) ON DELETE CASCADE,
  effective_date date NOT NULL,
  total_goal     int  NOT NULL CHECK (total_goal >= 1),
  new_goal       int  NOT NULL DEFAULT 0 CHECK (new_goal >= 0),
  updated_at     timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, effective_date),
  CHECK (new_goal <= total_goal)
);
ALTER TABLE public.user_goal_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_goal_settings_all" ON public.user_goal_settings;
CREATE POLICY "user_goal_settings_all" ON public.user_goal_settings FOR ALL USING (true) WITH CHECK (true);

-- 5) Tekrar aralığı en fazla 30 gün — sadece admin hesabının mevcut kartları
UPDATE public.user_cards
SET "interval" = LEAST("interval", 30),
    due_date   = LEAST(due_date, last_review + interval '30 days')
WHERE user_id = 'b3d46358-a964-4b79-a0db-e7edafecf2f3'
  AND last_review IS NOT NULL
  AND ("interval" > 30 OR due_date > last_review + interval '30 days');
