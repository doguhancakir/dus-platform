-- Sorulara kaynak (ör. "Dus Data Maxx Soru Bankası")
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source text;
