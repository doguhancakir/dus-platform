-- DUS Platform Supabase Schema
-- Supabase SQL Editor'de çalıştırın

-- =============================================
-- TABLOLAR
-- =============================================

-- Kullanıcılar (Supabase Auth yerine custom auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Branşlar
CREATE TABLE IF NOT EXISTS branches (
  id serial PRIMARY KEY,
  name text NOT NULL,
  icon text,
  color text,
  sort_order int DEFAULT 0
);

-- Konular
CREATE TABLE IF NOT EXISTS topics (
  id serial PRIMARY KEY,
  branch_id int REFERENCES branches(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Sorular
CREATE TABLE IF NOT EXISTS questions (
  id serial PRIMARY KEY,
  topic_id int REFERENCES topics(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb DEFAULT '[]',
  correct_answer int DEFAULT 0,
  explanation text,
  created_at timestamptz DEFAULT now()
);

-- Kullanıcı konu ilerlemesi
CREATE TABLE IF NOT EXISTS user_topic_progress (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  topic_id int REFERENCES topics(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  PRIMARY KEY (user_id, topic_id)
);

-- Kullanıcı soru kartları (SM-2)
CREATE TABLE IF NOT EXISTS user_cards (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  question_id int REFERENCES questions(id) ON DELETE CASCADE,
  status text DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'relearning')),
  interval float DEFAULT 0,
  ease_factor float DEFAULT 2.5,
  repetitions int DEFAULT 0,
  due_date timestamptz DEFAULT now(),
  learning_step int DEFAULT 0,
  last_review timestamptz,
  PRIMARY KEY (user_id, question_id)
);

-- =============================================
-- INDEXLER
-- =============================================

CREATE INDEX IF NOT EXISTS idx_topics_branch_id ON topics(branch_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_due_date ON user_cards(due_date);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user_id ON user_topic_progress(user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;

-- Users: herkes okuyabilir (login için nick arama), sadece kendi satırını güncelleyebilir
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (true);

-- Branches: herkes okuyabilir
CREATE POLICY "branches_select" ON branches FOR SELECT USING (true);
CREATE POLICY "branches_all" ON branches FOR ALL USING (true);

-- Topics: herkes okuyabilir
CREATE POLICY "topics_select" ON topics FOR SELECT USING (true);
CREATE POLICY "topics_all" ON topics FOR ALL USING (true);

-- Questions: herkes okuyabilir
CREATE POLICY "questions_select" ON questions FOR SELECT USING (true);
CREATE POLICY "questions_all" ON questions FOR ALL USING (true);

-- User topic progress: herkes kendi verisini yönetir
CREATE POLICY "user_topic_progress_all" ON user_topic_progress FOR ALL USING (true);

-- User cards: herkes kendi verisini yönetir
CREATE POLICY "user_cards_all" ON user_cards FOR ALL USING (true);

-- =============================================
-- ÖRNEK VERİ
-- =============================================

-- Branşları ekle
INSERT INTO branches (id, name, icon, color, sort_order) VALUES
  (1, 'Restoratif Diş Tedavisi', '🦷', '#3b82f6', 1),
  (2, 'Protetik Diş Tedavisi', '🔩', '#8b5cf6', 2),
  (3, 'Ağız, Diş ve Çene Cerrahisi', '⚕️', '#ef4444', 3),
  (4, 'Ağız, Diş ve Çene Radyolojisi', '🔬', '#f97316', 4),
  (5, 'Periodontoloji', '🌿', '#22c55e', 5),
  (6, 'Ortodonti', '😁', '#14b8a6', 6),
  (7, 'Endodonti', '🔧', '#f59e0b', 7),
  (8, 'Pedodonti (Çocuk Diş Hekimliği)', '👶', '#ec4899', 8)
ON CONFLICT (id) DO NOTHING;

-- Örnek Endodonti konuları
INSERT INTO topics (branch_id, title, content, sort_order) VALUES
(7, 'Kanal Anatomisi', '## Kanal Anatomisi

Kök kanal sisteminin anatomik yapısının anlaşılması başarılı endodontik tedavinin temelidir.

### Temel Kavramlar

**Ana kanal:** Pulpa odasından apikal foramene uzanan ana kanal sistemi.

**Yan kanallar:** Ana kanaldan çıkan ve periodontal ligamente açılan yan kanallar. İkinci molar dişlerde en sık görülür.

> **KRİTİK:** Lateral kanallar en sık kök ortası 1/3'ünde bulunur

### Dişlere Göre Kanal Sayıları

| Diş | Kök Sayısı | Kanal Sayısı |
|-----|------------|--------------|
| Üst santral | 1 | 1 |
| Üst lateral | 1 | 1 (nadiren 2) |
| Üst kanin | 1 | 1 |
| Üst 1. premolar | 2 | 2 |
| Üst 1. molar | 3 | 3-4 |
| Alt santral | 1 | 1-2 |
| Alt 1. molar | 2 | 3 |

### Werth ve Gerber Sınıflaması (Vertucci)

- **Tip I:** Tek kanal, tek foramen (1)
- **Tip II:** 2 kanal birleşerek 1 foramenden çıkar (2-1)
- **Tip III:** 1→2→1
- **Tip IV:** 2 ayrı kanal, 2 ayrı foramen (en önemli: **alt kesici dişler**)
- **Tip V:** 1→2
- **Tip VI:** 2→1→2
- **Tip VII:** 1→2→1→2
- **Tip VIII:** 3 ayrı kanal

> **ÖNEMLİ:** Tip IV en çok alt kesici dişlerde görülür ve tedavide ikinci kanalın atlanma riski yüksektir.

### Apikal Anatomi

- **Apikal foramen:** Kanalın apikale açıldığı nokta
- **Minör apikal çap (CDC):** Kanalın en dar yeri, genellikle apeks ucundan 0.5-1mm içeride
- **Majör apikal çap:** Foramenin açıldığı yer

> **KLİNİK İPUCU:** Çalışma uzunluğu minör apikal çapa (CDC) göre belirlenir.', 1),

(7, 'Kök Kanal Tedavisi Endikasyonları', '## Kök Kanal Tedavisi Endikasyonları ve Kontrendikasyonları

### Endikasyonlar

**Pulpitis İrreversibilis:**
- Spontan, uzun süreli ağrı
- Termal uyarıya aşırı ve uzun süren yanıt
- Gece ağrısı
- Ağrının lokalize edilememesi

**Pulpa Nekrozu:**
- Vitalite testine yanıtsızlık
- Periapikalradyolüsensi
- Sinüs traktı varlığı
- Ağrısız şişlik

**Elektif Endikasyonlar:**
- Protetik köprü ayağı hazırlığı
- İleri atrizyon/erozyon durumları
- Diş travması sonrası

### Kontrendikasyonlar

> **KRİTİK:** Periodontal desteği yetersiz dişlerde endodontik tedavi prognoz açısından sorgulanmalıdır.

**Mutlak Kontrendikasyonlar:**
- Kök kırığı (vertikal)
- Geri dönüşümsüz periodontal hasar
- Anatomik olarak tedavi edilemez kanal sistemi

**Göreli Kontrendikasyonlar:**
- Ciddi sistemik hastalık
- Radyoterapiye bağlı osteoradionekroz riski

### Prognoz Faktörleri

| Faktör | İyi Prognoz | Kötü Prognoz |
|--------|-------------|--------------|
| Pulpa durumu | Vital | Nekrotik + enfeksiyon |
| Periapeks | Normal | Büyük lezyon |
| Kanal | Şekillendirilmiş | Hesaplı kanallar |
| Restorasyon | Adekuat | Yetersiz | ', 2),

(7, 'İrrigasyon Solüsyonları', '## Endodontik İrrigasyon Solüsyonları

İrrigasyon, mekanik preparasyonun ulaşamadığı alanlarda kimyasal debridmana olanak tanır.

### Sodyum Hipoklorit (NaOCl)

> **KRİTİK:** Kök kanal tedavisinde altın standart irrigan NaOCl''dir.

**Konsantrasyonlar:**
- %0.5 → En az doku iritasyonu, en az antibakteriyel etki
- %1-2.5 → Klinikte en yaygın kullanılan
- %5.25 → En güçlü antibakteriyel etki, en fazla doku iritasyonu

**Özellikleri:**
- Doku çözme kapasitesi (proteolitik etki)
- Geniş antimikrobiyal spektrum
- *Enterococcus faecalis*''e karşı etkisi konsantrasyona bağlı

**Dezavantajları:**
- Smear tabakasını kaldıramaz
- Kanal dışına çıkması doku hasarına yol açar
- Metal aletleri paslandırır

### EDTA (Etilendiamintetraasetik Asit)

- **Amaç:** Smear tabakasının kaldırılması
- **Konsantrasyon:** %17
- **Süre:** 1 dakika yeterli
- İnorganik debris uzaklaştırır

> **ÖNEMLİ:** NaOCl ile EDTA'nın birlikte kullanımı sinerjistik etki gösterir. Final irrigasyonda sırayla kullanılır: NaOCl → EDTA → NaOCl

### Klorheksidin (CHX)

- **Konsantrasyon:** %2
- *E. faecalis*''e karşı güçlü etki
- Substantivite özelliği (uzun süreli antimikrobiyal etki)
- **Dikkat:** NaOCl ile birlikte kullanıldığında toksik para-kloroanilin oluşturur!

### Protokol Özeti

```
1. Preparasyon öncesi: %2.5 NaOCl (kanal lubrikasyonu)
2. Her alet değişiminde: %2.5 NaOCl
3. Final irrigasyon: EDTA 1dk → NaOCl → CHX (isteğe bağlı)
```', 3);

-- Ortodonti örnek konuları
INSERT INTO topics (branch_id, title, content, sort_order) VALUES
(6, 'Angle Sınıflaması', '## Angle Maloklüzyon Sınıflaması

Edward H. Angle tarafından 1899''da geliştirilen bu sınıflama, üst birinci büyük azı dişinin alt birinci büyük azı dişi ile olan ilişkisine dayanır.

### Sınıf I (Nötrookliüzyon)

> Üst birinci büyük azının meziyobukkal tüberkülü, alt birinci büyük azının bukkal olguğu ile aynı hizadadır.

**Özellikler:**
- Sagital ilişki normaldir
- Dental anomaliler mevcuttur (çapraşıklık, açıklık ısırış vb.)
- En sık görülen sınıf

### Sınıf II (Distookliüzyon)

Alt birinci büyük azı üst birinci büyük azıya göre **distal** konumdadır.

**Bölüm 1 (Division 1):**
- Üst kesici dişler protrüzyonda
- Artmış overjet
- Konveks profil
- Genellikle hiperdiverjant vaka

**Bölüm 2 (Division 2):**
- Üst santral kesiciler retrokline
- Artmış overbite (derin kapanış)
- Yan kesiciler öne eğilmiş
- Kare profil

> **KRİTİK:** Sınıf II/2''de santral dişler arkaya eğik, lateraller öne eğiktir.

### Sınıf III (Meziookliüzyon)

Alt birinci büyük azı üst birinci büyük azıya göre **mezial** konumdadır.

**Özellikler:**
- Ön çapraz kapanış (anterior crossbite)
- İçbükey (konkav) profil
- Mandibular prognati veya maksiller retrognatizm
- Genetik faktörler önemli

### Sınıf II/2 ile Sınıf I Arasındaki Farklar

| Özellik | Sınıf I | Sınıf II/1 | Sınıf II/2 |
|---------|---------|------------|------------|
| Overjet | Normal | Artmış | Azalmış/Normal |
| Overbite | Normal | Artmış | Belirgin artmış |
| Santral eğimi | Normal | Öne | Arkaya |', 1),

(6, 'Sefalometrik Analiz', '## Sefalometrik Analiz Temelleri

Sefalometri, standart kafa filmlerinde anatomik noktalar ve düzlemler arası açı ve mesafelerin ölçülmesini içerir.

### Temel Noktalar

**İskelet Noktaları:**
- **S (Sella):** Sella tursika''nın merkezi
- **N (Nasion):** Nazofrontal sütürün en ön noktası
- **A noktası:** Maksiller alveolün en derin noktası (supraspinale)
- **B noktası:** Mandibular alveolün en derin noktası (supramentale)
- **Pog (Pogonion):** Mandibulanın en ön noktası
- **Gn (Gnathion):** Senfizin en alt-ön noktası
- **Me (Menton):** Mandibulanın en alt noktası
- **Go (Gonion):** Mandibula açısının noktası
- **Or (Orbitale):** Orbita tabanının en alt noktası
- **Po (Porion):** Dış kulak yolunun üst noktası

### Temel Düzlemler

| Düzlem | Tanım |
|--------|-------|
| **SN düzlemi** | S-N noktalarını birleştiren çizgi |
| **Frankfurt horizontal** | Po-Or''ı birleştiren çizgi |
| **Palatinal düzlem (ANS-PNS)** | Damak düzlemi |
| **Okluzal düzlem** | Molarların tüberkül tepesi-kesici kesim noktası |
| **Mandibular düzlem** | Go-Me veya Go-Gn |

### ANB Açısı

> **KRİTİK:** ANB açısı, üst ve alt çenenin birbirine göre sagital pozisyonunu gösterir.

- **Normal:** 0°-4° (ortalama 2°)
- **> 4°:** Sınıf II iskelet ilişkisi
- **< 0°:** Sınıf III iskelet ilişkisi

### SNA ve SNB Açıları

- **SNA:** Maksilla pozisyonu (Normal: 82° ± 2°)
  - Artmış → Maksiller prognatizm
  - Azalmış → Maksiller retrognatizm

- **SNB:** Mandibula pozisyonu (Normal: 80° ± 2°)
  - Artmış → Mandibular prognatizm
  - Azalmış → Mandibular retrognatizm

> **KLİNİK İPUCU:** ANB = SNA - SNB. Yüksek ANB değeri Sınıf II vaka göstergesidir.', 2);

-- Periodontoloji örnek konusu
INSERT INTO topics (branch_id, title, content, sort_order) VALUES
(5, 'Periodontitis Sınıflandırması', '## 2017 Dünya Çalışması: Periodontitis Sınıflandırması

2017 yılında güncellenen periodontitis sınıflandırması klinik pratik için önemli değişiklikler getirmiştir.

### Staging (Evre) Sistemi

Hastalığın şiddeti ve karmaşıklığını tanımlar.

| Evre | Klinik Ataçman Kaybı | Radyografik Kemik Kaybı | Diş Kaybı |
|------|---------------------|------------------------|-----------|
| **I** | 1-2 mm | Koronal 1/3 (%<15) | 0 |
| **II** | 3-4 mm | Koronal 1/3 (15-33%) | 0 |
| **III** | ≥5 mm | 1/3 orta ve apikal | ≤4 diş |
| **IV** | ≥5 mm | 1/3 orta ve apikal | >4 diş |

> **KRİTİK:** Evre IV''te mastikatör fonksiyon bozulmuştur (çiğneme yetersizliği).

### Grading (Derece) Sistemi

Hastalığın ilerleme hızı ve risk faktörlerini tanımlar.

**Derece A (Yavaş ilerleme):**
- Son 5 yılda kanıtlanmış ilerleme yok
- Sigara içmiyor
- HbA1c < %7

**Derece B (Orta ilerleme):**
- Yaşa göre %0.25-1.0 kemik kaybı/yıl
- < 10 sigara/gün
- HbA1c < %7

**Derece C (Hızlı ilerleme):**
- Yaşa göre >%1.0 kemik kaybı/yıl
- ≥10 sigara/gün veya içici
- HbA1c ≥%7

> **ÖNEMLİ:** Sigara ve kontrol altında olmayan diyabet, dereceyi otomatik olarak C''ye yükseltir.

### Tedavi Yaklaşımı

**Adım 1 (Non-cerrahi):**
- Hasta eğitimi
- Supragingival ve subgingival debridman
- Risk faktörü kontrolü

**Adım 2 (Yeniden değerlendirme):**
- 6-8 hafta sonra
- Tedaviye yanıt değerlendirmesi

**Adım 3 (Cerrahi - gerekirse):**
- Rezektif veya rejeneratif cerrahi
- Cep derinliği >5mm persiste ediyorsa', 1);

-- Restoratif örnek konusu
INSERT INTO topics (branch_id, title, content, sort_order) VALUES
(1, 'Kompozit Rezin Sistemleri', '## Kompozit Rezin Sistemleri

Kompozit rezinler, diş hekimliğinde estetik restorasyon materyali olarak altın standart haline gelmiştir.

### Kompozit Rezin Yapısı

**1. Organik Matriks (Reçine Faz):**
- **Bis-GMA:** En yaygın kullanılan monomer (Bowen monomeri)
- **TEGDMA:** Viskoziteyi azaltır, polimerizasyon büzülmesini artırır
- **UDMA:** Bis-GMA alternatifi, daha az kırılgan

**2. İnorganik Doldurucu (Filler):**
- Mekanik özellikleri belirler
- Kuartz, baryum cam, silika partikülleri
- Doldurucu miktarı arttıkça → polimerizasyon büzülmesi azalır

**3. Silane Bağlayıcı:**
- Organik-inorganik faz bağlantısı
- Hidrofilik karakteri sayesinde su alımını kolaylaştırır

### Sınıflandırma (Partikül Boyutuna Göre)

| Tip | Partikül Boyutu | Özellik |
|-----|-----------------|---------|
| **Makrodolduruculu** | 10-100 μm | Yüksek dayanıklılık, kötü yüzey |
| **Mikrodolduruculu** | 0.04 μm | Mükemmel yüzey, zayıf mekanik |
| **Hibrit** | 0.04-4 μm | Denge (en yaygın) |
| **Nanodolduruculu** | <0.1 μm | En iyi yüzey + dayanıklılık |

> **KRİTİK:** Posterior kompozitlerde en çok tercih edilen tip hibrit kompozittir.

### Polimerizasyon

**Polimerizasyon Büzülmesi:**
- %1.5-5 hacimsel küçülme
- Mikrosızıntı ve post-op hassasiyetin temel nedeni
- Büzülmeyi azaltma yöntemleri:
  - Oblique teknik (açılı katman uygulaması)
  - "Incremental" (artımlı) yerleştirme
  - Düşük polimerizasyon ışık yoğunluğu (''soft start'')

> **KLİNİK İPUCU:** Her tabaka 2mm''yi geçmemeli, ışıkla 20-40 saniye polimerize edilmelidir.', 1);

-- =============================================
-- ÖRNEK SORULAR
-- =============================================

-- Endodonti sorular (Kanal Anatomisi)
INSERT INTO questions (topic_id, question_text, options, correct_answer, explanation)
SELECT t.id, soru.soru_metni, soru.secenekler::jsonb, soru.dogru, soru.aciklama
FROM topics t
CROSS JOIN (VALUES
  (
    'Vertucci Tip IV kanal morfolojisi en sık hangi dişte görülür?',
    '["Üst santral kesici", "Alt santral kesici", "Üst birinci premolar", "Alt birinci molar", "Üst kanin"]',
    1,
    'Vertucci Tip IV (2 ayrı kanal, 2 ayrı foramen) en sık alt kesici dişlerde görülür. Bu nedenle alt kesici dişlerin endodontik tedavisinde ikinci kanalın atlanmamasına dikkat edilmelidir.'
  ),
  (
    'Çalışma uzunluğu hangi anatomik noktaya göre belirlenir?',
    '["Apeks ucuna", "Majör apikal çapa (MAF)", "Minör apikal çapa (CDC)", "Apikal delta''ya", "Yan kanala"]',
    2,
    'Çalışma uzunluğu, minör apikal çap (CDC - cementum-dentin kavşağı) olan, apeks ucundan yaklaşık 0.5-1 mm içerideki noktaya kadar belirlenir. Bu nokta kanalın en dar yeridir.'
  ),
  (
    'Üst birinci büyük azı dişinde en sık kaç kanal bulunur?',
    '["2 kanal", "3 kanal", "4 kanal", "5 kanal", "1 kanal"]',
    2,
    'Üst birinci büyük azı tipik olarak 3 kökte 4 kanal içerir: meziyobukkal kökte 2 kanal (MB1, MB2), distobukkal kökte 1 kanal, palatal kökte 1 kanal. Toplam 4 kanal standart kabul edilir.'
  ),
  (
    'Lateral kanallar en sık kök''ün hangi bölgesinde görülür?',
    '["Apekste", "Kök ucunun 1/3 apikal kısmında", "Kök ortası 1/3''ünde", "Kök üstü 1/3''ünde", "Her bölgede eşit dağılımda"]',
    2,
    'Lateral kanallar en sık kök ortası 1/3 bölgesinde bulunur. Apikalde ise aksesuar kanallar ve apikal delta yapısı görülür.'
  ),
  (
    'Aşağıdakilerden hangisi Vertucci sınıflamasında yanlış eşleştirilmiştir?',
    '["Tip I: Tek kanal tek foramen", "Tip II: 2 kanal birleşerek 1 foramenden çıkar", "Tip IV: 2 ayrı kanal 2 ayrı foramen", "Tip VIII: 3 ayrı kanal", "Tip VI: 2→1 kanal konfigürasyonu"]',
    4,
    'Vertucci Tip VI konfigürasyonu 2→1→2 şeklindedir; yani 2 kanaldan başlar, birleşir, tekrar ayrılır. "2→1" konfigürasyonu Tip II''ye karşılık gelir.'
  )
) AS soru(soru_metni, secenekler, dogru, aciklama)
WHERE t.title = 'Kanal Anatomisi' AND t.branch_id = 7;

-- Endodonti sorular (İrrigasyon)
INSERT INTO questions (topic_id, question_text, options, correct_answer, explanation)
SELECT t.id, soru.soru_metni, soru.secenekler::jsonb, soru.dogru, soru.aciklama
FROM topics t
CROSS JOIN (VALUES
  (
    'Kök kanal tedavisinde altın standart irrigan hangisidir?',
    '["Klorheksidin (%2)", "EDTA (%17)", "Sodyum hipoklorit (NaOCl)", "Hidrojen peroksit", "Salin solüsyonu"]',
    2,
    'Sodyum hipoklorit (NaOCl), hem doku çözücü hem de antibakteriyel özelliği ile kök kanal tedavisinde altın standart irrigan olarak kabul edilir.'
  ),
  (
    'Smear tabakasını kaldırmak için kullanılan irrigan hangisidir?',
    '["NaOCl %5.25", "EDTA %17", "Klorheksidin %2", "Salin", "Sitrik asit %10"]',
    1,
    'EDTA (Etilendiamintetraasetik asit) %17 konsantrasyonda inorganik debris ve smear tabakasını kaldırmak için kullanılır. 1 dakikalık uygulama yeterlidir.'
  ),
  (
    'NaOCl ile klorheksidinin birlikte kullanılması neden sakıncalıdır?',
    '["Antibakteriyel etki azalır", "Para-kloroanilin gibi toksik ürün oluşur", "Kanalı tıkar", "pH''ı düşürür", "Dentin erozyon yapar"]',
    1,
    'NaOCl ve klorheksidin bir arada kullanıldığında para-kloroanilin adlı toksik, kahverengi-turuncu çökelti oluşur. Bu nedenle beraber kullanılmamalıdır. Final irrigasyonda birini kullandıktan sonra diğerine geçmeden önce salin ile yıkama yapılmalıdır.'
  ),
  (
    'Klorheksidinin diğer irriganlardan üstün olduğu özellik hangisidir?',
    '["Doku çözücü özellik", "Dentin duvarını demineralize etme", "Substantivite (uzun süreli antimikrobiyal etki)", "Smear tabakasını kaldırma", "Kanal lubrikasyonu sağlama"]',
    2,
    'Klorheksidinin substantivite özelliği, dentin tübüllerine adsorbe olarak uzun süreli antimikrobiyal etki sağlamasını ifade eder. Bu özellik E. faecalis gibi dirençli mikroorganizmalara karşı etkisini artırır.'
  ),
  (
    'Final irrigasyon protokolü doğru sıralaması hangisidir?',
    '["EDTA → NaOCl → CHX", "NaOCl → CHX → EDTA", "CHX → EDTA → NaOCl", "EDTA → CHX → NaOCl", "NaOCl → NaOCl → EDTA"]',
    0,
    'Doğru final irrigasyon sıralaması: Önce EDTA ile smear tabakası kaldırılır, ardından NaOCl ile antibakteriyel etki sağlanır. İstenirse son aşamada CHX eklenebilir ancak NaOCl ile direkt temas ettirilmemelidir.'
  )
) AS soru(soru_metni, secenekler, dogru, aciklama)
WHERE t.title = 'İrrigasyon Solüsyonları' AND t.branch_id = 7;

-- Ortodonti sorular (Angle Sınıflaması)
INSERT INTO questions (topic_id, question_text, options, correct_answer, explanation)
SELECT t.id, soru.soru_metni, soru.secenekler::jsonb, soru.dogru, soru.aciklama
FROM topics t
CROSS JOIN (VALUES
  (
    'Angle Sınıf II Bölüm 2 maloklüzyonun karakteristik özelliği hangisidir?',
    '["Üst santral dişler protrüzyonda, artmış overjet", "Üst santral dişler retroklüzde, artmış overbite", "Alt dişler mezial konumda", "Ön çapraz kapanış", "Açık kapanış"]',
    1,
    'Sınıf II Bölüm 2''de santral kesiciler arkaya eğilmiş (retroklüzde), yan kesiciler öne eğilmiştir. Overbite belirgin şekilde artmıştır. Overjet ise normalden az olabilir.'
  ),
  (
    'Angle sınıflaması hangi dişin ilişkisine dayanır?',
    '["Üst kanin-alt kanin", "Üst birinci premolar-alt birinci premolar", "Üst birinci büyük azı-alt birinci büyük azı", "Üst santral-alt santral", "Üst ikinci büyük azı-alt ikinci büyük azı"]',
    2,
    'Angle sınıflaması, üst birinci büyük azı dişinin meziyobukkal tüberkülünün alt birinci büyük azı dişinin bukkal olguğu ile ilişkisine dayanır.'
  ),
  (
    'Sınıf III maloklüzyonun radiografik/klinik özelliği hangisidir?',
    '["Artmış ANB açısı", "Konveks profil", "Mandibular prognati/maksiller retrognatizm", "Artmış overbite", "Üst dişlerin protrüzyonu"]',
    2,
    'Sınıf III maloklüzyonda alt çene öne (mandibular prognati) veya üst çene geri (maksiller retrognatizm) konumdadır. Profil içbükey (konkav) görünür, ANB açısı negatif veya sıfırın altındadır.'
  ),
  (
    'Hangi Angle sınıfında hastanın profili "kare" görünüm gösterir?',
    '["Sınıf I", "Sınıf II Bölüm 1", "Sınıf II Bölüm 2", "Sınıf III", "Hepsinde aynı"]',
    2,
    'Sınıf II Bölüm 2 vakalarında derin kapanış ve santral dişlerin retroklüzyonu nedeniyle yüz alt kısmı kısa ve kare görünümlüdür. Sınıf II/1''de ise konveks profil tipiktir.'
  ),
  (
    'Angle sınıflamasında referans nokta üst birinci büyük azının hangi bölgesidir?',
    '["Distal tüberkülü", "Meziyolingual tüberkülü", "Distolingual tüberkülü", "Meziyobukkal tüberkülü", "Sentral fossası"]',
    3,
    'Angle sınıflamasında üst birinci büyük azının MEZİYOBUKKAL tüberkülü referans alınır. Bu tüberkülün alt birinci büyük azının bukkal olguğu ile ilişkisi sınıflamayı belirler.'
  )
) AS soru(soru_metni, secenekler, dogru, aciklama)
WHERE t.title = 'Angle Sınıflaması' AND t.branch_id = 6;

-- Sefalometri soruları
INSERT INTO questions (topic_id, question_text, options, correct_answer, explanation)
SELECT t.id, soru.soru_metni, soru.secenekler::jsonb, soru.dogru, soru.aciklama
FROM topics t
CROSS JOIN (VALUES
  (
    'ANB açısının normal değeri nedir?',
    '["0°-2°", "0°-4°", "4°-6°", "2°-6°", "5°-8°"]',
    1,
    'ANB açısının normal değeri 0°-4°''dir (ortalama 2°). ANB > 4° Sınıf II iskelet ilişkisini, ANB < 0° ise Sınıf III iskelet ilişkisini gösterir.'
  ),
  (
    'SNA açısının normal değeri ve anlamı nedir?',
    '["70° ± 2°, mandibula pozisyonu", "80° ± 2°, mandibula pozisyonu", "82° ± 2°, maksilla pozisyonu", "76° ± 2°, okluzal düzlem", "84° ± 2°, kafa tabanı"]',
    2,
    'SNA açısı 82° ± 2° normaldir ve maksilla''nın kafa tabanına göre sagital pozisyonunu gösterir. Artmış SNA maksiller prognatizmi, azalmış SNA ise maksiller retrognatizmi ifade eder.'
  ),
  (
    'Sefalometride "A noktası" nereye karşılık gelir?',
    '["Mandibulanın en ön noktası", "Maksiller alveolün en derin noktası", "Sella tursika''nın merkezi", "Mandibular alveolün en derin noktası", "Orbita tabanının en alt noktası"]',
    1,
    'A noktası (supraspinale) maksiller alveolün en derin (en çukur) noktasıdır. B noktası (supramentale) ise mandibular alveolün en derin noktasıdır.'
  ),
  (
    'Frankfurt horizontal düzlem hangi noktaları birleştirir?',
    '["Sella-Nasion", "ANS-PNS", "Porion-Orbitale", "Gonion-Menton", "Gonion-Gnathion"]',
    2,
    'Frankfurt horizontal düzlem, Porion (dış kulak yolunun üst noktası) ile Orbitale''yi (orbita tabanının en alt noktası) birleştirir. Doğal baş pozisyonuna yakın bir referans düzlemidir.'
  )
) AS soru(soru_metni, secenekler, dogru, aciklama)
WHERE t.title = 'Sefalometrik Analiz' AND t.branch_id = 6;

-- Periodontoloji soruları
INSERT INTO questions (topic_id, question_text, options, correct_answer, explanation)
SELECT t.id, soru.soru_metni, soru.secenekler::jsonb, soru.dogru, soru.aciklama
FROM topics t
CROSS JOIN (VALUES
  (
    '2017 sınıflamasına göre Stage IV periodontitis ile Stage III arasındaki temel fark nedir?',
    '["Kemik kaybı miktarı", "Cep derinliği", "Mastikatör disfonksiyon varlığı ve diş kaybı sayısı", "Ataçman kaybı değeri", "Sigara kullanımı"]',
    2,
    'Stage IV periodontitiste mastikatör fonksiyon bozukluğu (çiğneme yetersizliği) ve >4 diş kaybı vardır. Stage III ile fark, fonksiyonel bozukluk ve daha fazla diş kaybıdır.'
  ),
  (
    'Periodontitis Derece C''ye hangi durum otomatik yükseltme sağlar?',
    '["Sigara kullanımı (günde ≥10 adet) veya kontrol altında olmayan diyabet", "Sadece sigara kullanımı", "Sadece diyabet", "Yaşlı hasta olmak", "Birden fazla ilaç kullanımı"]',
    0,
    '2017 sınıflamasına göre günde ≥10 sigara kullanımı veya HbA1c ≥%7 olan diyabet vakası, hastalığı otomatik olarak Derece C''ye yükseltir.'
  ),
  (
    'Non-cerrahi periodontal tedavinin yeniden değerlendirmesi ne zaman yapılmalıdır?',
    '["2-4 hafta sonra", "6-8 hafta sonra", "3 ay sonra", "Hemen ertesi seans", "1 yıl sonra"]',
    1,
    'Non-cerrahi periodontal tedavi (debridman) sonrası doku iyileşmesini ve tedavi yanıtını değerlendirmek için 6-8 hafta beklenmesi önerilir.'
  )
) AS soru(soru_metni, secenekler, dogru, aciklama)
WHERE t.title = 'Periodontitis Sınıflandırması' AND t.branch_id = 5;

-- Restoratif soruları
INSERT INTO questions (topic_id, question_text, options, correct_answer, explanation)
SELECT t.id, soru.soru_metni, soru.secenekler::jsonb, soru.dogru, soru.aciklama
FROM topics t
CROSS JOIN (VALUES
  (
    'Posterior kompozit restorasyonlarda en çok tercih edilen kompozit tipi hangisidir?',
    '["Makrodolduruculu", "Mikrodolduruculu", "Hibrit", "Sıvı (Flowable)", "Kompomer"]',
    2,
    'Posterior bölgede hem mekanik dayanıklılık hem de kabul edilebilir estetik sağlaması nedeniyle hibrit kompozitler tercih edilir. Mikrodolduruculu kompozitler anterior estetik için kullanılır.'
  ),
  (
    'Kompozit rezinde polimerizasyon büzülmesini azaltmak için kullanılan teknik hangisidir?',
    '["Tek seferde ışıkla polimerize etme", "Artımlı (incremental) katman tekniği", "Kalın tabaka uygulaması", "Düşük ışık yoğunluğu ile uzun süre bekleme", "Sadece C faktörünü artırma"]',
    1,
    'Artımlı (incremental) yerleştirme tekniğinde her katman ≤2mm tutularak polimerize edilir. Bu yöntem polimerizasyon büzülmesini ve C faktörünü azaltır, adaptasyonu artırır.'
  ),
  (
    'Bis-GMA''nın kompozit rezindeki rolü nedir?',
    '["Doldurucu partikül", "Ana organik matriks monomeri", "Silane bağlayıcı ajan", "Renk stabilizatörü", "Polimerizasyon inhibitörü"]',
    1,
    'Bis-GMA (Bowen monomeri) kompozit rezinin organik matriks fazının temel monomeridir. Mekanik özellikleri yüksek, ancak viskozitesi fazladır. TEGDMA ile birlikte kullanılarak viskozite düşürülür.'
  )
) AS soru(soru_metni, secenekler, dogru, aciklama)
WHERE t.title = 'Kompozit Rezin Sistemleri' AND t.branch_id = 1;

-- Endodonti Endikasyonlar soruları
INSERT INTO questions (topic_id, question_text, options, correct_answer, explanation)
SELECT t.id, soru.soru_metni, soru.secenekler::jsonb, soru.dogru, soru.aciklama
FROM topics t
CROSS JOIN (VALUES
  (
    'Pulpitis irreversibilis''in klinik bulgusu aşağıdakilerden hangisidir?',
    '["Termal uyarıya kısa süreli yanıt", "Spontan uzun süreli ağrı ve termal uyarıya uzun süren yanıt", "Vitalite testine yanıtsızlık", "Yalnızca basınç ağrısı", "Asemptomatik seyir"]',
    1,
    'Pulpitis irreversibilis''te spontan ağrı, gece ağrısı, termal uyarıya uzun süren ve yoğun yanıt tipiktir. Ağrı lokalize edilemez. Vitalite testine yanıtsızlık ise nekroz bulgusudur.'
  ),
  (
    'Vertikal kök kırığı endodontik tedavi için ne anlam taşır?',
    '["Tedavi endikasyonudur", "Relatif kontrendikasyondur", "Mutlak kontrendikasyondur", "Tedaviyi kolaylaştırır", "Prognoza etkisi yoktur"]',
    2,
    'Vertikal kök kırığı endodontik tedavi için mutlak kontrendikasyondur. Bu durumda diş genellikle çekilmek zorunda kalınır, çünkü kanal tedavisi başarılı olamaz.'
  )
) AS soru(soru_metni, secenekler, dogru, aciklama)
WHERE t.title = 'Kök Kanal Tedavisi Endikasyonları' AND t.branch_id = 7;
