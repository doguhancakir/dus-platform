-- Bayraklanan soruda kullanıcının seçtiği şık (metin olarak; şıklar karıştırıldığı için)
ALTER TABLE public.user_cards ADD COLUMN IF NOT EXISTS flagged_choice text;
