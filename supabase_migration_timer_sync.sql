-- Kronometre cihazlar arası senkron
-- 1) study_sessions okuma/yazma kuralı Supabase Auth'a (auth.uid()) bağlıydı;
--    site kendi giriş sistemini kullandığı için auth.uid() hep boş → hiçbir cihaz
--    DB'deki süreyi okuyamıyordu. Diğer tablolardaki gibi açık kural yapılıyor.
DROP POLICY IF EXISTS "study_sessions_select_own" ON public.study_sessions;
DROP POLICY IF EXISTS "study_sessions_insert_own" ON public.study_sessions;
DROP POLICY IF EXISTS "study_sessions_update_own" ON public.study_sessions;
DROP POLICY IF EXISTS "study_sessions_all" ON public.study_sessions;
CREATE POLICY "study_sessions_all" ON public.study_sessions FOR ALL USING (true) WITH CHECK (true);

-- 2) Her cihaz kendi saydığı saniyeyi toplama ekler (telefon + PC birleşir).
CREATE OR REPLACE FUNCTION public.add_study_seconds(p_user_id uuid, p_date date, p_delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_total integer;
BEGIN
  IF p_delta IS NULL OR p_delta < 0 OR p_delta > 3600 THEN
    RAISE EXCEPTION 'Geçersiz süre';
  END IF;
  INSERT INTO public.study_sessions (user_id, date, seconds, updated_at)
  VALUES (p_user_id, p_date, p_delta, now())
  ON CONFLICT (user_id, date) DO UPDATE
    SET seconds = public.study_sessions.seconds + EXCLUDED.seconds,
        updated_at = now()
  RETURNING seconds INTO v_total;
  RETURN v_total;
END $$;

GRANT EXECUTE ON FUNCTION public.add_study_seconds(uuid, date, integer) TO anon, authenticated;
