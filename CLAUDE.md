# Notlar (Claude için)

- Soru bankası değişiklikleri (`questions`, `topics`, `books`) veritabanında `change_log` tablosuna trigger ile otomatik yazılır (`supabase_migration_change_log.sql`). Admin → GEÇMİŞ sekmesinde görünür.
- Veritabanına REST ile doğrudan yazarken `x-actor: claude` header'ı gönder; böylece log'da "Claude" olarak görünür (header yoksa "admin paneli" yazılır).
- "Şu kaynak ne zaman eklendi / ne silindi" soruları için `change_log` tablosuna bak; silinen satırın tamamı `old_data` içinde durur.
