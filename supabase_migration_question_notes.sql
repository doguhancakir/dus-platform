-- Yıldızlı sorular + kişisel notlar
CREATE TABLE IF NOT EXISTS public.question_notes (
  user_id     uuid   NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id integer NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  note        text   NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);
ALTER TABLE public.question_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "question_notes_all" ON public.question_notes;
CREATE POLICY "question_notes_all" ON public.question_notes FOR ALL USING (true) WITH CHECK (true);
