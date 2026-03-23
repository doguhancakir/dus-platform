# DUS Çalışma Platformu — Proje Brief'i (v3 FINAL)

## ⚠️ EN ÖNEMLİ KURAL: UI HER ŞEYDEN ÖNCE GELİR
Bu platform güzel görünmezse hiçbir anlamı yok. Her component, her sayfa, her buton estetik olarak mükemmel olmalı. Generic, sıkıcı, "developer yapımı" görünen bir UI KABUL EDİLEMEZ. Referans al: modern SaaS uygulamaları (Notion, Linear, Arc Browser). Detaylar:
- Micro-interactions ve hover efektleri
- Kartlar soft shadow ve subtle border
- Geçişler animate (framer-motion veya CSS transitions)
- Typography hiyerarşisi net (başlık, alt başlık, body, caption)
- Spacing tutarlı ve generous
- Renkler harmonik palette'den
- Loading state'leri skeleton shimmer ile
- Empty state'ler güzel illustrasyonlarla
- Koyu tema: siyah değil, koyu gri tonları (#0a0a0a, #141414, #1a1a1a, #222)
- Accent renk: tıbbi ama modern (koyu teal/cyan)
- Kartlar glassmorphism ya da subtle gradient

## Genel Bakış
DUS (Diş Hekimliği Uzmanlık Sınavı) için çalışma platformu. Kullanıcılar branş bazlı konuları okuyup, **gerçek Anki SM-2 algoritmasıyla** sorular çözüyor. Tüm platform Türkçe.

## Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS + Framer Motion
- **Backend/Database:** Supabase (auth, database) — ÜCRETSİZ plan yeterli
- **Hosting:** GitHub Pages + Cloudflare
- **Domain:** doguhancakir.com

## Altyapı Notu
Mevcut site GitHub'da index.html olarak host ediliyor, Cloudflare üzerinden serve ediliyor. Bu proje için yeni bir GitHub repo oluştur. Subdomain tercih: dus.doguhancakir.com

## Branşlar (sabit, 8 adet)
1. Restoratif Diş Tedavisi
2. Protetik Diş Tedavisi
3. Ağız, Diş ve Çene Cerrahisi
4. Ağız, Diş ve Çene Radyolojisi
5. Periodontoloji
6. Ortodonti
7. Endodonti
8. Pedodonti (Çocuk Diş Hekimliği)

---

## SORU SİSTEMİ: ANKI SM-2 ALGORİTMASI (KRİTİK BÖLÜM)

Bu sistem Anki'nin SM-2 tabanlı algoritmasının birebir uyarlamasıdır. Basitleştirilmiş versiyon DEĞİL, gerçek SM-2.

### 4 Buton (Anki ile aynı)
Kullanıcı cevabı gördükten sonra 4 seçenek:
- 🔴 **Tekrar** (Again) — Hiç hatırlamadım / tamamen yanlış
- 🟠 **Zor** (Hard) — Hatırladım ama çok zorlandım
- 🟡 **İyi** (Good) — Normal hatırladım
- 🟢 **Kolay** (Easy) — Çok kolay, hemen biliyordum

### Kart Durumları
Her soru kartı şu durumlardan birinde:
- **Yeni** (New) — henüz hiç görülmedi
- **Öğrenme** (Learning) — ilk kez görüldü, kısa aralıklarla tekrar
- **İnceleme** (Review) — öğrenildi, giderek artan aralıklarla tekrar
- **Yeniden Öğrenme** (Relearning) — inceleme sırasında unutuldu, tekrar öğrenme aşamasında

### SM-2 Algoritma Detayı

#### Öğrenme Aşaması (Learning Phase)
Yeni bir kart ilk görüldüğünde "Öğrenme" durumuna girer.
Öğrenme adımları: 1 dakika → 10 dakika (Anki varsayılanı)

- **Tekrar (Again):** Kart birinci adıma döner (1 dakika sonra tekrar)
- **Zor (Hard):** Mevcut adımın ortalaması ile bir sonraki adımın ortalaması (tekrar aynı session'da)
- **İyi (Good):** Bir sonraki adıma geç. Son adımdaysa → "İnceleme" durumuna geç, ilk interval = 1 gün
- **Kolay (Easy):** Hemen "İnceleme" durumuna geç, ilk interval = 4 gün

#### İnceleme Aşaması (Review Phase — asıl spaced repetition)
Kart "İnceleme" durumuna geçtikten sonra SM-2 devreye girer.

Her kartın değerleri:
- **interval** (gün cinsinden — bir sonraki gösterime kaç gün)
- **ease_factor** (zorluk çarpanı, başlangıç = 2.5, minimum = 1.3)
- **repetitions** (başarılı tekrar sayısı)

Buton davranışları:
- **Tekrar (Again):**
  - interval = 1 gün (sıfırlanır, yeniden öğrenme aşamasına girer)
  - ease_factor -= 0.20 (minimum 1.3)
  - repetitions = 0
  
- **Zor (Hard):**
  - interval = önceki interval × 1.2
  - ease_factor -= 0.15 (minimum 1.3)
  
- **İyi (Good):**
  - Eğer repetitions == 0: interval = 1 gün
  - Eğer repetitions == 1: interval = 6 gün
  - Eğer repetitions > 1: interval = önceki interval × ease_factor
  - ease_factor değişmez
  - repetitions += 1
  
- **Kolay (Easy):**
  - interval = önceki interval × ease_factor × 1.3
  - ease_factor += 0.15
  - repetitions += 1

#### Yeniden Öğrenme Aşaması (Relearning)
Review sırasında "Tekrar" basılırsa kart buraya girer.
Öğrenme adımları ile aynı mantık (1dk → 10dk).
Tamamlanınca review'a döner ama interval azaltılmış olarak.

### Supabase'de Saklanacak Kart Verileri
Her kullanıcı × her soru için:
```
user_id          — kullanıcı
question_id      — soru
status           — new / learning / review / relearning
interval         — gün cinsinden (float)
ease_factor      — zorluk çarpanı (float, başlangıç 2.5)
repetitions      — başarılı tekrar sayısı (int)
due_date         — sonraki gösterim tarihi (timestamp)
learning_step    — öğrenme aşamasındaki adım (0, 1, ...)
last_review      — son inceleme tarihi
```

### Günlük Çalışma Akışı
1. Kullanıcı bir konuya girer
2. "Sorular" butonuna basar
3. Sistem sırasıyla gösterir:
   a. Bugün vadesi dolan (due) review kartları
   b. Öğrenme/yeniden öğrenme aşamasındaki kartlar
   c. Yeni kartlar (günlük limit: 20 yeni kart)
4. Her kart için: soru → cevabı göster → 4 butondan birini seç
5. SM-2 algoritması çalışır, due_date güncellenir
6. Kullanıcı ertesi gün girdiğinde vadesi dolan kartlar tekrar gösterilir

### Soru Paneli İstatistikleri
Üstte görünen bilgiler:
- "Yeni: X | Öğrenme: X | İnceleme: X" (Anki tarzı renk kodlu sayaçlar)
- Mavi = yeni, Kırmızı = öğrenme/yeniden öğrenme, Yeşil = inceleme

---

## Sayfa Yapısı

### Ana Sayfa (Dashboard)
- Hoş geldin mesajı (nick ile)
- 8 branş kartı, grid layout
- Her kartta:
  - Branş ismi + ikon/renk kodu
  - Circular progress indicator
  - "X/Y konu tamamlandı"
  - "Bugün X kart bekliyor" (due cards)
  - Hover efektleri
- Genel ilerleme barı
- "Bugün çözülecek: X kart" genel gösterge

### Branş Sayfası
- Konu listesi (card list)
- Her konu kartında:
  - Konu adı + tamamlandı ise ✓
  - Soru durumu: "Yeni: X | Bekleyen: X | Öğrenilen: X"
  - Hover efektli
- Branş ilerleme barı

### Konu Sayfası
- **Ana alan: Konu İçeriği**
  - Zengin metin (markdown render)
  - Renkli vurgulama:
    - 🔴 Kırmızı = KRİTİK
    - 🟠 Turuncu = ÖNEMLİ
    - 🔵 Mavi kutucuk = Klinik ipucu
    - 🟢 Yeşil kutucuk = Özet
  - Resim desteği, tablo desteği
  - Max 720px content genişliği
  - Font: Inter, 16-18px body

- **Sağ üst: Soru Butonu**
  - "📝 Bugün: X kart" (due cards sayısı)
  - Tıklayınca Anki soru paneli açılır

- **Sayfa sonu: "Öğrendim" Butonu**
  - Tıklayınca check animasyonu
  - Toggle (geri alınabilir)

### Soru Paneli (Anki Tarzı — TAM EKRAN MODAL)
- Üstte: "Yeni: 5 | Öğrenme: 2 | İnceleme: 12" sayaçlar (renkli)
- Ortada: Soru metni (büyük, okunabilir)
- Şıklı sorularda: şık kartları
- **"Cevabı Göster"** butonu (büyük, ortada)
- Cevap gösterilince:
  - Doğru cevap yeşil highlight
  - Açıklama (varsa)
  - Alt kısımda 4 buton yan yana:
    - 🔴 **Tekrar** (altında tahmini süre: "<1dk")
    - 🟠 **Zor** (altında tahmini süre: "6dk")
    - 🟡 **İyi** (altında tahmini süre: "10dk" veya "1gün")
    - 🟢 **Kolay** (altında tahmini süre: "4gün")
  - Butonlar büyük, renkli, satisfying click
- Kartlar bitince: "Tebrikler! Bugünlük bu kadar. 🎉" ekranı

## Kullanıcı Sistemi

### Kayıt/Giriş
- Sadece nick + şifre (E-POSTA YOK)
- Supabase'de custom auth
- Güzel login sayfası

### Kullanıcı Verileri (Supabase)
- Konu tamamlanma durumları
- Her soru için SM-2 verileri (interval, ease_factor, repetitions, due_date, status)
- Günlük istatistikler
- Kullanıcı kapansa da kaldığı yerden devam

## Admin Paneli (/admin, şifre korumalı)
- Konu ekleme/düzenleme (zengin metin editörü)
- Soru ekleme: soru metni + şıklar + doğru cevap + açıklama + konu bağlantısı
- Toplu soru import (JSON/CSV)
- Branş/konu yönetimi
- Normal kullanıcılar erişemez

## Supabase Tablo Şeması (Önerilen)

```sql
-- Kullanıcılar
users (
  id uuid PRIMARY KEY,
  nickname text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamp
)

-- Branşlar
branches (
  id serial PRIMARY KEY,
  name text NOT NULL,
  icon text,
  color text,
  sort_order int
)

-- Konular
topics (
  id serial PRIMARY KEY,
  branch_id int REFERENCES branches(id),
  title text NOT NULL,
  content text, -- markdown formatında
  sort_order int,
  created_at timestamp
)

-- Sorular
questions (
  id serial PRIMARY KEY,
  topic_id int REFERENCES topics(id),
  question_text text NOT NULL,
  options jsonb, -- ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı", "E şıkkı"]
  correct_answer int, -- 0-4 arası index
  explanation text,
  created_at timestamp
)

-- Kullanıcı konu ilerlemesi
user_topic_progress (
  user_id uuid REFERENCES users(id),
  topic_id int REFERENCES topics(id),
  completed boolean DEFAULT false,
  completed_at timestamp,
  PRIMARY KEY (user_id, topic_id)
)

-- Kullanıcı soru kartları (SM-2 verileri)
user_cards (
  user_id uuid REFERENCES users(id),
  question_id int REFERENCES questions(id),
  status text DEFAULT 'new', -- new, learning, review, relearning
  interval float DEFAULT 0, -- gün cinsinden
  ease_factor float DEFAULT 2.5,
  repetitions int DEFAULT 0,
  due_date timestamp,
  learning_step int DEFAULT 0,
  last_review timestamp,
  PRIMARY KEY (user_id, question_id)
)
```

## Placeholder İçerik (Test İçin)
Her branşa 3-4 gerçekçi konu + her konuya 5-10 DUS tarzı çoktan seçmeli soru.
Örnek branş içeriği:
- Endodonti: "Kanal Anatomisi", "Kök Kanal Tedavisi Endikasyonları", "İrrigasyon Solüsyonları"
- Ortodonti: "Angle Sınıflaması", "Sefalometrik Analiz", "Hareketli Apareyler"

## Responsive
- Desktop: sidebar + geniş içerik
- Mobil: bottom nav + card-based, soru paneli full-screen

## Öncelik Sırası
1. Proje iskeleti (Vite + React + Tailwind + Supabase)
2. Supabase schema (yukarıdaki tablolar)
3. Kullanıcı kayıt/giriş (nick + şifre)
4. Ana sayfa (branş kartları)
5. Branş sayfası (konu listesi)
6. Konu sayfası (güzel UI)
7. Anki soru sistemi (SM-2 algoritma tam çalışır)
8. İlerleme takibi
9. Admin paneli
10. GitHub Pages deploy + Cloudflare
