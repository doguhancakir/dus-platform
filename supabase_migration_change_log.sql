-- Değişiklik günlüğü: soru / konu / kitap eklenince, değişince, silinince otomatik kayıt.
-- Kullanıcıların çözdüğü kartlar, notlar ve çizimler loglanmaz.
CREATE TABLE IF NOT EXISTS public.change_log (
  id         bigserial PRIMARY KEY,
  at         timestamptz NOT NULL DEFAULT now(),
  table_name text NOT NULL,
  action     text NOT NULL,          -- INSERT / UPDATE / DELETE
  row_id     text,
  actor      text,                   -- 'site' (admin paneli) veya 'claude'
  old_data   jsonb,                  -- DELETE: silinen satırın tamamı, UPDATE: sadece değişen alanların eski hali
  new_data   jsonb                   -- INSERT: eklenen satır, UPDATE: sadece değişen alanların yeni hali
);
CREATE INDEX IF NOT EXISTS change_log_at_idx ON public.change_log (at DESC);
CREATE INDEX IF NOT EXISTS change_log_table_idx ON public.change_log (table_name, at DESC);

ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "change_log_read" ON public.change_log;
CREATE POLICY "change_log_read" ON public.change_log FOR SELECT USING (true);
-- Yazma/silme izni yok: kayıtları sadece aşağıdaki trigger yazar.

CREATE OR REPLACE FUNCTION public.log_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o jsonb;
  n jsonb;
  k text;
  actor text;
BEGIN
  BEGIN
    actor := coalesce(current_setting('request.headers', true)::json->>'x-actor', 'site');
  EXCEPTION WHEN others THEN
    actor := 'site';
  END;

  IF TG_OP = 'INSERT' THEN
    n := to_jsonb(NEW);
    INSERT INTO change_log (table_name, action, row_id, actor, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, n->>'id', actor, n);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    o := to_jsonb(OLD);
    INSERT INTO change_log (table_name, action, row_id, actor, old_data)
    VALUES (TG_TABLE_NAME, TG_OP, o->>'id', actor, o);
    RETURN OLD;
  ELSE
    o := '{}'::jsonb;
    n := '{}'::jsonb;
    FOR k IN SELECT jsonb_object_keys(to_jsonb(NEW)) LOOP
      IF (to_jsonb(NEW)->k) IS DISTINCT FROM (to_jsonb(OLD)->k) THEN
        o := o || jsonb_build_object(k, to_jsonb(OLD)->k);
        n := n || jsonb_build_object(k, to_jsonb(NEW)->k);
      END IF;
    END LOOP;
    IF n <> '{}'::jsonb THEN
      INSERT INTO change_log (table_name, action, row_id, actor, old_data, new_data)
      VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(NEW)->>'id', actor, o, n);
    END IF;
    RETURN NEW;
  END IF;
END $$;

DROP TRIGGER IF EXISTS questions_change_log ON public.questions;
CREATE TRIGGER questions_change_log AFTER INSERT OR UPDATE OR DELETE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.log_change();

DROP TRIGGER IF EXISTS topics_change_log ON public.topics;
CREATE TRIGGER topics_change_log AFTER INSERT OR UPDATE OR DELETE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.log_change();

DROP TRIGGER IF EXISTS books_change_log ON public.books;
CREATE TRIGGER books_change_log AFTER INSERT OR UPDATE OR DELETE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.log_change();
