-- ============================================================
-- DUS Platform — Seed Data (Placeholder İçerik)
-- schema.sql'den SONRA çalıştır
-- ============================================================

-- -------------------------------------------------------
-- KONULAR
-- -------------------------------------------------------
INSERT INTO public.topics (branch_id, title, content, sort_order) VALUES

-- 1. Restoratif
(1, 'Kompozit Rezinler', '## Kompozit Rezinler

Kompozit rezinler, **inorganik doldurucu partikül** ile **organik reçine matriks**ten oluşan estetik restoratif materyallerdir.

### Yapısı
- **Reçine Matriks:** Bis-GMA, TEGDMA, UDMA
- **Doldurucu:** Silika, baryum camı (%50-80 ağırlıkça)
- **Silanlama:** Doldurucu-matriks bağlantısını sağlar

### Sınıflandırma (Doldurucu Boyutuna Göre)
| Tip | Doldurucu Boyutu | Kullanım |
|-----|-----------------|---------|
| Makrofil | 10-100 µm | Posterior |
| Mikrofil | 0.01-0.1 µm | Anterior (estetik) |
| Hibrit | Karışık | Evrensel |
| Nanohibrit | <100 nm | Anterior+Posterior |

### Polimerizasyon Büzülmesi
> **KRİTİK:** Kompozitler polimerizasyon sırasında **%2-5 büzülür**. Bu kenar sızıntısına yol açar.

**Azaltma yöntemleri:**
- Artımlı uygulama tekniği
- Düşük C-faktörlü kavite tasarımı
- Bulk-fill kompozitler (≤4 mm tek tabaka)', 1),

(1, 'Adeziv Sistemler', '## Adeziv Sistemler

Diş sert dokuları ile restoratif materyal arasında bağlantıyı sağlayan sistemlerdir.

### Nesiller ve Teknikler

**Total-etch (3. adım):**
1. Asit (fosforik asit %35-37) → yıka → kurula
2. Primer uygula
3. Bond uygula

**Self-etch (2. adım):**
1. Primer+asit birlikte
2. Bond uygula

**All-in-one (1. adım):**
- Hepsi tek şişede

### Smear Layer
> **ÖNEMLİ:** Total-etch smear layer''ı tamamen kaldırır. Self-etch modifiye eder.

**Mina bağlantısı:** Mikromekanikal (asit ile prizmatik yapı açılır)
**Dentin bağlantısı:** Hibrit tabaka oluşumu (reçine dentin tübüllerine infiltre olur)', 2),

-- 2. Protetik
(2, 'Sabit Protez Endikasyonları', '## Sabit Protez Endikasyonları

### Köprü (Sabit Parsiyel Protez) Endikasyonları
- Bir veya birkaç dişin kaybı
- Yeterli destek diş sayısı ve sağlığı
- Kemik desteği yeterli

### Kontraendikasyonlar
- Uzun edentül saha (>3 diş)
- **Pontik Eğrisi Kuralı:** Eğer pontik sayısı > destek diş sayısı → kontraendike

### Dayak Dişleri (Abutment)
Kritik kriterler:
1. **Kök yüzey alanı** yeterli olmalı (Ante Kanunu)
2. Periodontal sağlık
3. Kron/kök oranı ≥ 1:1

> **Ante Kanunu:** Köprü pontiklerinin kök yüzey alanı, dayak dişlerin toplam kök yüzey alanını GEÇEMEZ.', 1),

(2, 'Tam Protez Prensipleri', '## Tam Protez Temel Prensipleri

### 3 Temel Prensip
1. **Retansiyon** — Protezin yerinde kalması
2. **Stabilite** — Fonksiyon sırasında hareket etmemesi
3. **Destek** — Kuvvetlerin kemiğe iletilmesi

### Vertikal Boyut
- **VDO (Oklüzal):** Dişler kapandığında yüz yüksekliği
- **VDR (İstirahat):** Kaslar gevşekken yüz yüksekliği
- **İnteroklüzal Mesafe:** VDR - VDO = 2-4 mm

### Arka Diş Dizimi
- Posterior dişler **kret üzerine** dizilir
- Çapraz oklüzyon **en az** kullanılır
- **Lingualize oklüzyon:** Alt dişlerin lingual tüberkülleri üst dişlerin fossalarına kapanır', 2),

-- 3. Cerrahi
(3, 'Diş Çekimi Endikasyonları', '## Diş Çekimi Endikasyonları

### Mutlak Endikasyonlar
- İleri periodontal hastalık (kemik kaybı >%75)
- Restore edilemeyen kron kırıkları
- Kök kırıkları (vertikal)
- Tedaviye cevap vermeyen periapical lezyon

### Rölatif Endikasyonlar
- Ortodontik nedenler (çekiciler)
- Süpernümerer dişler
- Gömülü 3. molarlar (semptomatik)

### Kontraendikasyonlar
> **KRİTİK:** Aşağıdaki durumlarda çekim ERTELENMELİ:

- Aktif enfeksiyon (lokal anestezi etkisizleşir, enfeksiyon yayılabilir)
- Antikoagülan tedavi (INR > 3.5)
- **Bisfosfonat kullanımı** → MRONJ riski
- Kontrol altında olmayan sistemik hastalık', 1),

(3, 'Gömülü Diş Cerrahisi', '## Gömülü Diş Cerrahisi

### En Sık Gömülü Dişler
1. Alt 3. molar (%35)
2. Üst kanin (%34)
3. Üst 3. molar
4. Alt premolar

### Alt 3. Molar Sınıflamaları

**Pell-Gregory (Dal ilişkisi):**
- Sınıf I: Ön kenar daldaki yer var
- Sınıf II: Ön kenar dal içinde (yarı gömülü)
- Sınıf III: Tamamen dal içinde

**Winter Sınıflaması (Angülasyon):**
- Mezioangüler (en sık)
- Vertikal
- Distoangüler (en zor)
- Horizontal

### Komplikasyonlar
- **Dry socket (alveolar osteitis):** En sık komplikasyon, 3-5. günde ağrı
- N. alveolaris inferior hasarı
- Komşu dişe zarar', 2),

-- 4. Radyoloji
(4, 'Periapikal Radyografi', '## Periapikal Radyografi

### Teknikler

**Paralel Teknik (Uzun Konik):**
- Film/sensör dişe paralel
- X-ışını dik açıyla gelir
- **Tercih edilen teknik** — distorsiyon minimal

**Bisektris Tekniği:**
- Film diş ekseni açısını ikiye bölen düzleme dik
- Portable ünitelerde kullanışlı
- Distorsiyon riski yüksek

### Anatomik Yapılar
| Yapı | Radyografik Görünüm |
|------|-------------------|
| Mine | Çok radyoopak |
| Dentin | Radyoopak |
| Pulpa | Radyolüsent |
| Lamina dura | İnce radyoopak çizgi |
| PDL aralığı | İnce radyolüsent çizgi |

> **Klinik İpucu:** Lamina dura kaybı → periodontal hastalık veya periapical patoloji işareti.', 1),

(4, 'Panoramik Radyografi', '## Panoramik Radyografi

### Endikasyonlar
- Tüm dişlerin genel değerlendirmesi
- Gömülü dişler
- TME değerlendirmesi
- Kist/tümör taraması
- İmplant planlaması

### Avantajlar vs Dezavantajlar
**Avantajlar:**
- Geniş alan, tek film
- Düşük doz
- Hasta uyumu iyi

**Dezavantajlar:**
- **Magnifikasyon** (%20-30) ve distorsiyon
- Detay düşük — periapikal lezyonlar atlanabilir
- Süperpozisyon

### Ghost Artefaktlar
> **ÖNEMLİ:** Radyoopak objeler (küpe, protez) karşı tarafta hayalet görüntü oluşturur. Hasta hazırlığında çıkarılmalıdır.', 2),

-- 5. Periodontoloji
(5, 'Periodontal Hastalık Sınıflaması', '## Periodontal Hastalık Sınıflaması (2017 AAP/EFP)

### Periodontitis Evreleme (Stage)
| Evre | Kemik Kaybı | Cep Derinliği | Diş Kaybı |
|------|------------|--------------|-----------|
| I   | Koronal 1/3 | ≤4 mm | Yok |
| II  | Koronal 1/3 | ≤5 mm | Yok |
| III | ≥1/3 veya furkasyon | ≥6 mm | ≤4 diş |
| IV  | İleri | ≥6 mm | ≥5 diş |

### Derecelendirme (Grade)
- **Grade A:** Yavaş ilerleme kanıtı yok
- **Grade B:** Orta ilerleme
- **Grade C:** Hızlı ilerleme, sigara/DM risk faktörü

### Gingivitis vs Periodontitis
> **Temel Fark:** Gingivitis **geri dönüşümlü** (kemik kaybı yok). Periodontitis **geri dönüşümsüz** (kemik kaybı var).', 1),

(5, 'Periodontal Tedavi Basamakları', '## Periodontal Tedavi Basamakları

### Faz 1 — Etiyolojik Tedavi
1. Oral hijyen eğitimi
2. Diştaşı temizliği (scaling)
3. **Kök yüzeyi düzleştirme (root planing)**
4. Risk faktörü kontrolü (sigara bırakma, DM kontrolü)

### Yeniden Değerlendirme (6-8 hafta sonra)
Faz 1 sonrası cep derinliği, BOP, plak skoru değerlendirilir.

### Faz 2 — Cerrahi Tedavi (gerekirse)
- **Modifiye Widman Flebi:** Kök yüzey erişimi
- **Osseous Cerrahi:** Kemik şekillendirme
- **GTR (Yönlendirilmiş Doku Rejenerasyonu):** Membran ile yeni bağ dokusu

### Faz 3 — Destekleyici Periodontal Tedavi
> Her 3-6 ayda bir recall ziyareti. Periodontal hastalık kronik → yaşam boyu takip.', 2),

-- 6. Ortodonti
(6, 'Angle Sınıflaması', '## Angle Sınıflaması

Edward Angle (1899) molar ilişkisine göre sınıflandırmıştır.

### Sınıf I (Nörookllüzyon)
- Üst 1. molarin **meziobukal tüberkülü** → alt 1. molarin **bukkal oluğuna** kapanır
- **Diş çapraşıklığı** Sınıf I maloklüzyonun en sık nedenidir

### Sınıf II (Distooklüzyon)
Alt ark üste göre **distalde**
- **Div 1:** Üst kesiciler prokline (öne eğik)
- **Div 2:** Üst kesiciler retrokline (geriye eğik), derin kapanış

### Sınıf III (Meziooklüzyon)
Alt ark üste göre **meziyalde** (ön çapraz kapanış sık)

> **KRİTİK:** Angle sınıflaması yalnızca **molar ilişkisini** tanımlar, iskelet ilişkisini değil!

### İskelet Sınıflaması
Sefalometrik analiz ile: ANB açısı
- Normal: 2° ± 2°
- Sınıf II: >4°
- Sınıf III: <0°', 1),

(6, 'Sabit Ortodontik Apareyler', '## Sabit Ortodontik Apareyler

### Bracket Sistemleri
**Standart Edgewise:** Slot 0.022"
**MBT / Roth:** Torque, angülasyon ve rotasyon bilgisi bracket içine programlanmış
**Self-ligating:** Kilit mekanizmalı (Damon, In-Ovation)

### Kuvvet Bileşenleri
- **Ark teli:** Dişi hareket ettirir
- **Bracket:** Kuvveti dişe iletir
- **Bant/Bondaj:** Bracket tutucusu

### Diş Hareketi Türleri
| Hareket | Tanım |
|---------|-------|
| Tilting | Kron hareketi, kök az |
| Torque | Kök hareketi, kron az |
| Translasyon | Kron ve kök eşit |
| Rotasyon | Uzun eksen etrafında dönüş |

> **Biyolojik Temel:** Diş hareketi PDL üzerindeki **basınç-gerilim** teorisiyle açıklanır. Basınç tarafında rezorpsiyon, gerilim tarafında apozisyon.', 2),

-- 7. Endodonti
(7, 'Kanal Anatomisi', '## Kanal Anatomisi

### Vertucci Sınıflaması (1984)
| Tip | Tanım | Örnek |
|-----|-------|-------|
| I   | 1 kanal, 1 foramen | Tek kanallı |
| II  | 2 kanal birleşir, 1 çıkış | Üst premolar |
| III | 1→2→1 | |
| IV  | 2 ayrı kanal, 2 foramen | Alt premolar |
| V   | 1→2 | Alt ön |

### Kritik Dişler
- **Üst 1. Molar:** 3 kök, genellikle **4 kanal** (MB2 kanalı %60-95)
- **Alt 1. Molar:** 2 kök, genellikle **3-4 kanal**
- **Üst 1. Premolar:** 2 kök sık, 2 kanal
- **Alt Ön Dişler:** 2 kanal sık (%40)

> **KRİTİK:** MB2 kanalı en çok atlanan kanal. Üst 1. molar tedavisinde rutin aranmalıdır.

### Apeks Fizyolojisi
- **Anatomik apeks:** Kökün görsel ucu
- **Radyografik apeks:** Film üzerindeki uç
- **Fizyolojik apeks (CDJ):** Gerçek doldurma bitiş noktası, apeksten **0.5-1.5 mm** içeride', 1),

(7, 'İrrigasyon Solüsyonları', '## İrrigasyon Solüsyonları

### NaOCl (Sodyum Hipoklorit)
**Standart irrigan**, **tek organik doku çözücü**

| Konsantrasyon | Özellik |
|--------------|---------|
| %0.5-1 | Düşük sitotoksisite |
| %2.5 | Standart kullanım |
| %5.25 | Maksimum antibakteriyal |

> **KRİTİK:** NaOCl peripeks itilirse **hipoklorit kazası** → şiddetli ağrı, şişlik, parestezi.

### EDTA
- **%17 EDTA:** Smearlayeri kaldırır (anorganik)
- NaOCl ile birlikte kullanılır
- Son irrigasyon: **NaOCl → EDTA → NaOCl**

### CHX (Klorheksidin)
- %2 — antibakteriyal, **E. faecalis**''e etkili
- Dentin tübüllerine bağlanır (substantivite)
- **NaOCl ile KARIŞTIRMA** → turuncu-kahverengi çökelti (PAchloroaniline) oluşur!

### Aktivasyon Yöntemleri
- **Pasif ultrasonic irrigasyon (PUI):** Altın standart
- Sonic aktivasyon (EndoActivator)
- Negatif basınçlı irrigasyon (EndoVac)', 2),

-- 8. Pedodonti
(8, 'Süt Dişi Pulpa Tedavisi', '## Süt Dişi Pulpa Tedavisi

### Endikasyona Göre Seçim

**İndirekt Pulpa Tedavisi (IPT):**
- Derin çürük, pulpa açılmamış
- Kalsiyum hidroksit veya MTA ile örtme
- Tek seans

**Pulpotomi:**
- Koronal pulpa çıkarılır, radiküler pulpa sağlıklı
- **Formokrezol** veya **MTA/Ferrik sulfat**
- En sık yapılan süt dişi pulpa tedavisi

**Pulpektomi:**
- Tüm pulpa nekrotik veya kronik iltihaplı
- Kanal ZOE (çinko oksit öjenol) ile doldurulur
- Rezorbe olabilir materyal kullanılır!

> **ÖNEMLİ:** Süt dişi kanal dolgu maddesi **rezorbe olabilir** olmalıdır. Çünkü daimi diş kökü gelişirken süt dişi kökü fizyolojik olarak rezorbe olur.

### Pulpotomi Sonrası
- Paslanmaz çelik kron ile restore edilir
- Amalgam veya kompozit **önerilmez** (kırılma riski)', 1),

(8, 'Yer Tutucu Apareyler', '## Yer Tutucu Apareyler

Süt dişi erken kaybında daimi dişin süreceği yeri korumak için kullanılır.

### Sabit Yer Tutucular

**Band ve Loop:**
- Tek diş kaybında
- Komşu dişe bant, loop uzanır
- En sık kullanılan

**Lingual Ark:**
- Alt çenede bilateral posterior kayıp
- Molar bantlara tutunur, lingual telden yapılır

**Nance Apareyi:**
- Üst çenede bilateral kayıp
- Damakta akrilik topuz ile destek

### Hareketli Yer Tutucular
- İşbirliği gerektiren çocuklarda kullanışsız
- Okul çağı öncesi çocuklarda tercih edilmez

> **KRİTİK Karar:** Süt dişi kaybında **hangi dişin** kaybolduğu ve **ne zaman** kaybedildiği tedavi kararını etkiler.
> - Erken kayıp + uzun bekleme → yer tutucu
> - Geç kayıp + daimi diş yakın → yer tutucu gerekmeyebilir', 2);

-- -------------------------------------------------------
-- SORULAR
-- -------------------------------------------------------

-- Topic ID'leri dinamik alabilmek için subquery kullanıyoruz
-- Önce tüm topic ID'lerini alalım ve sırayla soruları ekleyelim

-- Not: Aşağıdaki INSERT'ler topic_id'ye göre.
-- Konuların id'leri 1'den başlayarak sırayla atanacak.
-- Eğer veritabanınızda farklı id'ler atandıysa topic_id'leri güncelleyin.

INSERT INTO public.questions (topic_id, question_text, options, correct_answer, explanation) VALUES

-- ===== KONU 1: Kompozit Rezinler =====
(
  (SELECT id FROM public.topics WHERE title = 'Kompozit Rezinler'),
  'Kompozit rezinlerin polimerizasyon büzülmesini azaltmak için kullanılan en etkili teknik hangisidir?',
  '["Tek tabaka (bulk) uygulama","Artımlı (inkremental) uygulama","Işık kaynağını uzaktan tutmak","Yüksek yoğunluklu ışık kullanmak","Matriks bant kullanmamak"]',
  1,
  'Artımlı uygulama tekniğinde her tabaka ayrı ayrı polimerize edilir. Bu şekilde her tabakanın büzülmesi sınırlı kalır ve toplam büzülme etkisi azaltılmış olur.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Kompozit Rezinler'),
  'Mikrofil kompozitler hangi kullanım alanı için en uygundur?',
  '["Posterior dişlerde oklüzal yüzeyler","Anterior dişlerde estetik restorasyonlar","Geniş kavitelerin doldurulması","Amalgam replasmanı","Kök yüzeyi restorasyonu"]',
  1,
  'Mikrofil kompozitler küçük doldurucu boyutu (0.01-0.1 µm) sayesinde mükemmel yüzey parlaklığı verir. Ancak mekanik dayanıklılıkları düşük olduğundan posterior yük taşıyan kaviteler için önerilmez.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Kompozit Rezinler'),
  'Kompozit rezinlerin temel organik matriks monomeri hangisidir?',
  '["HEMA","Bis-GMA","EDTA","MMA","ZOE"]',
  1,
  'Bis-GMA (bisfenol A-glisidil metakrilat) en yaygın kullanılan kompozit matriks monomeridir. Yüksek molekül ağırlığı sayesinde büzülme az, polimerizasyon derecesi yüksektir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Kompozit Rezinler'),
  'Kompozit rezinlerde silan kullanımının amacı nedir?',
  '["Polimerizasyon hızını artırmak","Renk stabilitesini sağlamak","Doldurucu ile matriks arasındaki bağlantıyı güçlendirmek","Viskoziteyi azaltmak","Radyopasiteyi artırmak"]',
  2,
  'Silan, biffonksiyonel bir bağlayıcı ajandır. Bir ucu inorganik doldurucu partiküllerine, diğer ucu organik reçine matrikse bağlanarak ikisi arasında güçlü bir arayüzey bağlantısı oluşturur.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Kompozit Rezinler'),
  'Bulk-fill kompozitlerin standart hibrit kompozitlerden temel farkı nedir?',
  '["Daha fazla büzülme göstermeleri","4 mm''ye kadar tek tabakada uygulanabilmeleri","Daha kısa polimerize olma süreleri","İşlem gerektirmemeleri","Daha ucuz olmaları"]',
  1,
  'Bulk-fill kompozitler özel fotobaşlatıcıları ve translüsent yapıları sayesinde 4 mm''ye kadar tek tabakada yeterli polimerizasyon sağlar. Bu, çok katlı uygulama süresini azaltır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Kompozit Rezinler'),
  'Aşağıdakilerden hangisi kompozit rezinin dezavantajı değildir?',
  '["Polimerizasyon büzülmesi","Teknik hassasiyet","Iyi estetik","Nemden etkilenme","Uzun uygulama süresi"]',
  2,
  'İyi estetik kompozit rezinin önemli bir AVANTAJI''dır. Dezavantajları arasında polimerizasyon büzülmesi, teknik hassasiyet, neme duyarlılık ve uzun uygulama süresi sayılabilir.'
),

-- ===== KONU 2: Adeziv Sistemler =====
(
  (SELECT id FROM public.topics WHERE title = 'Adeziv Sistemler'),
  'Total-etch adeziv sistemlerde asit uygulamasından sonra dentin ne kadar nemli bırakılmalıdır?',
  '["Tamamen kuru","Hafif nemli (wet bonding)","Tamamen ıslak","Izotonik solüsyonla ıslatılmış","Nem önemsizdir"]',
  1,
  'Total-etch sistemlerde dentin kollajen fiberleri aşırı kurutulursa kollaps olur ve reçine infiltrasyonu azalır. "Wet bonding" tekniğinde dentin hafif nemli bırakılarak fiber yapısı korunur ve hibrit tabaka oluşumu sağlanır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Adeziv Sistemler'),
  'Self-etch adeziv sistemlerin total-etch''e göre temel avantajı nedir?',
  '["Daha güçlü mina bağlantısı","Smear layer''ı tamamen kaldırması","Daha az teknik hassasiyet","Daha ucuz olması","Daha uzun raf ömrü"]',
  2,
  'Self-etch sistemlerde asitleme ve prime aynı anda gerçekleşir. Dentin nem kontrolü kritik değildir, teknik hassasiyet daha azdır. Ancak mina bağlantısı total-etch kadar güçlü değildir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Adeziv Sistemler'),
  'Mina adezyon mekanizması esas olarak hangisine dayanır?',
  '["Kimyasal bağ","Mikromekanikal tutuculuk","Van der Waals kuvvetleri","İyon değişimi","Çözünme ve yayılma"]',
  1,
  'Asit uygulaması sonrası minada prizmatik yapılar açılır ve reçine bu pöröz yapıya sızdırılarak "reçine tag"ları oluşturur. Bu mikromekanikal interlocking adeziv sistemlerin temel tutunma mekanizmasıdır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Adeziv Sistemler'),
  'Hibrit tabaka (hybrid layer) nerede oluşur?',
  '["Mine ile adezivin arayüzeyinde","Dentin ile adezivin arayüzeyinde","Dentin ile kompozitin arayüzeyinde","Smear layer içinde","Bond ile primer arasında"]',
  1,
  'Reçine monomerleri dentin tübülleri ve deminerlize dentin içine infiltre olur. Bu bölgede oluşan reçine-dentin karışımı "hibrit tabaka" olarak adlandırılır ve dentin adezyon mekanizmasının temelidir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Adeziv Sistemler'),
  'Fosforik asit ile mina pürüzlendirmesinde kullanılan standart konsantrasyon ve süre hangisidir?',
  '["%%10, 60 saniye","%%35-37, 15-30 saniye","%%50, 10 saniye","%%20, 45 saniye","%%5, 120 saniye"]',
  1,
  '%35-37 konsantrasyonda fosforik asit 15-30 saniye uygulanır. Uzun süreli asitleme mine yapısına zarar verir, kısa süreli asitleme yeterli pürüzlendirme sağlamaz.'
),

-- ===== KONU 3: Sabit Protez Endikasyonları =====
(
  (SELECT id FROM public.topics WHERE title = 'Sabit Protez Endikasyonları'),
  'Ante Kanunu''na göre köprü yapımında temel kural nedir?',
  '["Destek diş sayısı pontik sayısından fazla olmalı","Destek dişlerin kök yüzey alanı pontiklerin kök yüzey alanından az olmamalı","Pontik dişler daima metal olmalı","Köprü uzunluğu 3 dişi geçmemeli","Destek dişler vital olmalı"]',
  1,
  'Ante Kanunu''na göre destek (abutment) dişlerin toplam kök yüzey alanı, eksik (pontik) dişlerin kök yüzey alanından az olmamalıdır. Bu kural periodontal destek yeterliliğini değerlendirmek için kullanılır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Sabit Protez Endikasyonları'),
  'Sabit bölümlü protez (köprü) için en önemli kontraendikasyon hangisidir?',
  '["Yaşlı hasta","Uzun edentül saha","Küçük posterior dişler","Estetik beklenti yüksek hasta","Bruksizm"]',
  1,
  'Uzun edentül saha (>3 diş kaybı) sabit protez için ana kontraendikasyondur. Bu durumlarda Ante Kanunu sağlanamaz, aşırı kuvvetler destek dişlere zarar verir ve implant destekli protez tercih edilmelidir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Sabit Protez Endikasyonları'),
  'Köprü protezinde uygun kron-kök oranı nedir?',
  '["2:1","1:2","1:1 veya kök lehine","Eşit olması gerekmez","3:1"]',
  2,
  'İdeal kron-kök oranı 1:1 veya kök lehine (kök daha uzun) olmalıdır. Kron/kök oranı 1:1''den kötü olduğunda (kron uzun, kök kısa) kaldıraç etkisiyle periodontal destek zarar görür.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Sabit Protez Endikasyonları'),
  'Aşağıdaki durumlarda hangisinde sabit parsiyel protez (köprü) tercih edilir?',
  '["4 ardışık diş eksikliği","Bilateral posterior dişlerin tümü eksik","Tek arka diş (serbest sonlu) eksikliği","2 ardışık ön diş eksikliği yeterli destek dişle","Geniş alveolar kemik kaybı"]',
  3,
  '2 ardışık anterior diş eksikliğinde, destek dişler yeterli periodontal desteğe sahipse ve Ante Kanunu sağlanabiliyorsa sabit köprü endikedir. Serbest sonlu (distal extension) boşluklar ve çok sayıda diş eksikliği implant veya hareketli protez endikasyonudur.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Sabit Protez Endikasyonları'),
  'Metal-seramik restorasyonlarda hangi metal en sık alerjiye neden olur?',
  '["Altın","Paladyum","Nikel","Kobalt","Krom"]',
  2,
  'Nikel (Ni) en sık alerjik reaksiyona neden olan dental metaldir. Hastaların özellikle kadınlarda nikel alerjisi anamnezi sorgulanmalı, nikel içeren alaşımlardan kaçınılmalıdır.'
),

-- ===== KONU 4: Tam Protez Prensipleri =====
(
  (SELECT id FROM public.topics WHERE title = 'Tam Protez Prensipleri'),
  'Tam protezde vertikal boyut (VDO) belirlenirken kullanılan en güvenilir yöntem hangisidir?',
  '["Yüz ölçümleri","Fonetik yöntem","Willis yöntemi (göz-burun = burun-çene)","Fizyolojik istirahat pozisyonu + interoklüzal mesafe","Estetik değerlendirme"]',
  3,
  'Fizyolojik istirahat pozisyonundan (VDR) interoklüzal mesafe (2-4 mm) çıkarılarak VDO hesaplanır. Bu yöntem en güvenilir temel yöntemdir. Diğer yöntemler destekleyici olarak kullanılır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Tam Protez Prensipleri'),
  'Tam protezde retansiyonu en fazla etkileyen faktör nedir?',
  '["Protezin ağırlığı","Kasların aktivitesi","Tükürüğün yüzey gerilimi ve adezyon","Protezin rengi","Hastanın yaşı"]',
  2,
  'Tükürük, protez-mukoza arayüzeyinde adezyon ve kohezyon kuvvetleri oluşturarak retansiyonun temel fiziksel mekanizmasını sağlar. Bunun yanı sıra periferik kapanma (border seal) da kritik önemdedir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Tam Protez Prensipleri'),
  'Tam protezde arka dişlerin kret üzerine yerleştirilmesinin amacı nedir?',
  '["Estetik","Fonetik","Stabilitenin ve destek kemiğin korunması","Hastanın rahat yemesi","Protezin kolay temizlenmesi"]',
  2,
  'Posterior dişler kret (alveol kret) üzerine yerleştirildiğinde kuvvetler alveol kemiğine dik iletilir. Bu hem stabilitenin hem de kemik dokusunun korunması açısından kritiktir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Tam Protez Prensipleri'),
  'Vertikal boyutun aşırı artırılması hangi sonuca yol açar?',
  '["Daha iyi çiğneme","Daha iyi estetik","Kas yorgunluğu ve TME ağrısı","Daha iyi fonetik","Protezin daha iyi tutması"]',
  2,
  'VDO aşırı artırıldığında çiğneme kasları sürekli gerilim altında kalır, yorgunluk ve TME sorunları ortaya çıkar. Ayrıca konuşmada "klikleme" sesi duyulabilir.'
),

-- ===== KONU 5: Diş Çekimi Endikasyonları =====
(
  (SELECT id FROM public.topics WHERE title = 'Diş Çekimi Endikasyonları'),
  'Bisfosfonat kullanan hastada diş çekimi sonrası en korkulan komplikasyon nedir?',
  '["Dry socket","Alveolar kist","İlaçla ilişkili çene osteonekrozu (MRONJ)","Parestezi","Çene kırığı"]',
  2,
  'Bisfosfonatlar osteoklas aktivitesini baskılar. Dental işlem sonrası yara iyileşmesi bozulabilir ve MRONJ (Medication-Related Osteonecrosis of the Jaw) gelişebilir. Bu komplikasyon özellikle IV bisfosfonat kullanan onkoloji hastalarında daha sıktır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Diş Çekimi Endikasyonları'),
  'Akut dento-alveolar apsede diş çekiminin lokal anestezi ile ertelenmesi önerilir çünkü:',
  '["Apse iyileştikten sonra çekim daha kolay olur","Asidik ortam anestezik ilaçların etkisini azaltır","Hasta ağrıya daha az duyarlıdır","Enfeksiyon durumunda kanama riski fazladır","Dişin iyileşme şansı vardır"]',
  1,
  'Enfekte dokularda pH düşer (asidik ortam). Lokal anestezikler baz formda sinir membranından geçer; asidik ortamda iyon tuzağına (ion trapping) takılır ve etkinlikleri dramatik olarak azalır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Diş Çekimi Endikasyonları'),
  'Aşağıdaki sistemik hastalıklardan hangisi diş çekimi için mutlak kontraendikasyon oluşturur?',
  '["Kontrol altındaki tip 2 diabetes mellitus","Stabil angina pektoris","Son 6 ay içinde geçirilmiş miyokard enfarktüsü","Kontrol altındaki hipertansiyon","Kronik böbrek hastalığı (diyalize girmeyen)"]',
  2,
  'Son 6 ay içinde geçirilmiş MI, elektif dental işlemler için kontraendikasyondur. Bu dönemde tekrar enfarktüs riski yüksektir ve stres yanıtı tetikleyici olabilir. 6 ay sonra kardiyolog onayı ile işlem yapılabilir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Diş Çekimi Endikasyonları'),
  'Warfarin kullanan hastada elektif diş çekimi için kabul edilebilir INR aralığı nedir?',
  '["INR < 1.5","INR 1.5-2.0","INR 2.0-3.5","INR > 4.0","INR değeri önemsizdir"]',
  2,
  'INR 2.0-3.5 arasında basit çekimler lokal hemostatik önlemler (sünger, sütür) ile güvenle yapılabilir. INR > 3.5 olduğunda kardiyolog ile konsülte edilerek doz ayarlaması değerlendirilir. Warfarin rutin olarak kesilmez!'
),
(
  (SELECT id FROM public.topics WHERE title = 'Diş Çekimi Endikasyonları'),
  'Dry socket (alveolar osteitis) için en önemli risk faktörü hangisidir?',
  '["Yaş > 60","Kadın cinsiyet","Sigara kullanımı","Antibiyotik kullanımı","Kötü oral hijyen"]',
  2,
  'Sigara, pıhtı organizasyonunu bozar ve lokal iskemiye yol açar. Bu nedenle çekim öncesi ve sonrası en az 48 saat sigara içilmemesi önerilir. Dry socket riski sigara içenlerde 3-4 kat daha fazladır.'
),

-- ===== KONU 6: Gömülü Diş Cerrahisi =====
(
  (SELECT id FROM public.topics WHERE title = 'Gömülü Diş Cerrahisi'),
  'Pell-Gregory sınıflamasına göre Sınıf B ne anlama gelir?',
  '["Dişin ön kenarı dalın önünde","Dişin ön kenarı ramus ile 1. molar arasında","Diş tamamen ramus içinde","Dişin 1/2''si kemik içinde","Diş gingival doku altında"]',
  1,
  'Pell-Gregory sınıflaması 3. moların ramusla ilişkisini tanımlar. Sınıf A: Ön kenar ramusun önünde; Sınıf B: Ön kenar ramus ile 1. molar arasında; Sınıf C: Diş tamamen ramus içinde.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Gömülü Diş Cerrahisi'),
  'Gömülü alt 3. molarda en sık görülen angülasyon hangisidir?',
  '["Vertikal","Distoangüler","Mezioangüler","Horizontal","Bukkoangüler"]',
  2,
  'Mezioangüler pozisyon alt gömülü 3. molarda en sık görülen angülasyondur (%43-74). Distoangüler pozisyon ise en zor çıkarılan angülasyondur çünkü ramus çıkarılacak dişin arka kısmını engeller.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Gömülü Diş Cerrahisi'),
  'Dry socket (alveolar osteitis) tedavisinde ne kullanılır?',
  '["Antibiyotik + analjezik","Lokal debritman + iyodoform tampon","Kürüntü + sütür","Amoksisilin + metronidazol","Kortikosteroid"]',
  1,
  'Dry socket tedavisinde alveol yumuşak sabunlu su ile yıkanır, nekrotik materyal uzaklaştırılır ve iyodoform içeren öjenollü tampon (Alvogyl vb.) yerleştirilir. Bu tampon ağrıyı giderir ve iyileşmeyi hızlandırır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Gömülü Diş Cerrahisi'),
  'Üst kanin dişin gömülü kalmasının en sık nedeni nedir?',
  '["Genetik faktörler","Süt kanin dişinin geç dökülmesi","Sistemik hastalık","Travma","İdiopatik"]',
  1,
  'Üst kalıcı kanin dişinin gömülü kalmasında süt kanininin geç kaybı veya uzun süreli retansiyonu önemli bir rol oynar. Süt kanini erken çekilmesi bazı vakalarda kalıcı kaninin normal sürmesini sağlayabilir.'
),

-- ===== KONU 7: Periapikal Radyografi =====
(
  (SELECT id FROM public.topics WHERE title = 'Periapikal Radyografi'),
  'Paralel teknik (uzun konik teknik) bisektris tekniğine göre tercih edilmesinin ana nedeni nedir?',
  '["Daha hızlı çekim","Daha düşük radyasyon dozu","Daha az geometrik distorsiyon","Daha küçük film boyutu gerektirir","Tüm hastalarda uygulanabilir"]',
  2,
  'Paralel teknikte film dişe paralel ve X-ışını bu ikisine dik açıda gönderilir. Bu sayede geometrik distorsiyon minimale iner, gerçek boyut ve şekil elde edilir. Bisektris tekniğinde angülasyon hataları distorsiyona yol açar.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Periapikal Radyografi'),
  'Radyografide lamina dura kaybı hangi durumu düşündürür?',
  '["Normal bir bulgu","Diş çürüğü","Periodontal hastalık veya periapical patoloji","Mine hipoplazisi","Dentin hipersensitivitesi"]',
  2,
  'Lamina dura, alveol kemiğinin diş soketini çevreleyen ince korteks tabakasıdır. Radyografide ince radyoopak çizgi olarak görünür. Kaybı, periodontal iltihap veya periapical patoloji (granülom, kist, apse) işaretidir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Periapikal Radyografi'),
  'Aşağıdakilerden hangisi radyolüsent görünüm verir?',
  '["Mine","Amalgam","Pulpa","Lamina dura","Kemik yoğun bölgeler"]',
  2,
  'Radyolüsent yapılar X-ışınını az tutar, filmde/sensörde koyu (siyah) görünür. Pulpa, PDL aralığı, hava boşlukları ve yumuşak dokular radyolüsenttir. Mine, amalgam, kemik ve metal yapılar radyoopaktır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Periapikal Radyografi'),
  'Periapikal radyografide görüntü uzaması (elongation) hangi hata sonucu oluşur?',
  '["Dikey açı fazla","Dikey açı az","Yatay açı fazla","Film yanlış yönde","Ekspojur süresi uzun"]',
  1,
  'Dikey açı (vertikal angülasyon) yetersiz olduğunda X-ışınları dişe daha teğet açıyla gelir ve görüntü uzar (elongation). Fazla dikey açı ise kısalmaya (foreshortening) yol açar.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Periapikal Radyografi'),
  'Radyografide iki kökü olan bir dişin kanallarını birbirinden ayırt etmek için kullanılan teknik nedir?',
  '["SLOB kuralı (Same Lingual Opposite Buccal)","Bisektris tekniği","Paralel teknik","Clark kuralı (Tube shift tekniği)","Sefalometri"]',
  3,
  'Clark kuralı (SLOB kuralı): Tüp yatay olarak kaydırıldığında bukkal yapı tüpün hareket yönüne ZITTON hareket eder. "Aynı yönde hareket eden = Lingual, Ters yönde hareket eden = Bukkal" prensibiyle kanallar lokalize edilir.'
),

-- ===== KONU 8: Panoramik Radyografi =====
(
  (SELECT id FROM public.topics WHERE title = 'Panoramik Radyografi'),
  'Panoramik radyografide "ghost artefakt" nasıl oluşur?',
  '["Hastanın hareketi sonucu","Radyoopak objelerin karşı tarafta hayalet görüntüsü","Filmin yanlış yerleştirilmesi","Ekspojur hatası","Banyo solüsyonunun eskimesi"]',
  1,
  'Çenelerin dışında kalan radyoopak objeler (küpe, protez, piercing) X-ışını yolunda iki kez geçer ve karşı tarafta bulanık, büyütülmüş hayalet görüntü oluşturur. Bu nedenle panoramik öncesi tüm metal objeler çıkarılmalıdır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Panoramik Radyografi'),
  'Panoramik radyografide üst kesici bölgede görülen "ghost" görüntüsüne ne yol açar?',
  '["Yüksek ekspojur","Servikal vertebra süperpozisyonu","Hastanın kafasını öne eğmesi","Ton''un geniş olması","Film hatası"]',
  1,
  'Panoramik radyografide boyun omurları (servikal vertebralar) ve yumuşak doku yapıları üst kesici bölgede süperpozisyon ve radyoopak görüntü oluşturabilir. Bu normal anatomik süperpozisyondur.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Panoramik Radyografi'),
  'Panoramik radyografide magnifikasyon faktörü yaklaşık ne kadardır?',
  '["%%5-10","%%20-30","%%50","%%100","Magnifikasyon yoktur"]',
  1,
  'Panoramik radyografide görüntü gerçek boyuttan %20-30 daha büyük görünür. Bu nedenle implant planlaması gibi doğru boyut gerektiren durumlarda magnifikasyon faktörü hesaba katılmalıdır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Panoramik Radyografi'),
  'Aşağıdakilerden hangisi panoramik radyografinin endikasyonu değildir?',
  '["Gömülü dişlerin değerlendirilmesi","Periapikal lezyonların detaylı incelemesi","TME değerlendirmesi","Kist ve tümör taraması","Implant öncesi genel değerlendirme"]',
  1,
  'Panoramik radyografide detay düşüktür ve periapikal lezyonlar atlanabilir. Periapikal patolojinin detaylı incelenmesi için periapikal radyografi veya CBCT tercih edilmelidir. Panoramik tarama amaçlı kullanılır.'
),

-- ===== KONU 9: Periodontal Hastalık Sınıflaması =====
(
  (SELECT id FROM public.topics WHERE title = 'Periodontal Hastalık Sınıflaması'),
  '2017 AAP/EFP sınıflamasına göre Evre III periodontitisi Evre II''den ayıran temel kriter nedir?',
  '["Cep derinliği > 6 mm veya furkasyon tutulumu","Kemik kaybı > %%20","Diş hareketliliği","BOP pozitifliği","Plak indeksi"]',
  0,
  'Evre III''te cep derinliği ≥6 mm veya furkasyon Sınıf II-III tutulumu veya vertikal kemik kaybı ≥3 mm bulunur. Ayrıca 4 adede kadar diş kaybı vardır. Evre II''ye göre daha ileri kemik ve bağ dokusu kaybı söz konusudur.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Periodontal Hastalık Sınıflaması'),
  'Gingivitis ile periodontitis arasındaki temel fark nedir?',
  '["Gingivitis ağrılı, periodontitis ağrısız","Gingivitiste kemik kaybı yok, periodontitiste var","Gingivitis yaşlılarda görülür","Periodontitis antibiyotikle iyileşir","Gingivitis kalıcıdır"]',
  1,
  'Gingivitis yalnızca dişeti iltihabıdır, kemik ve bağ dokusu kaybı yoktur ve tamamen geri dönüşümlüdür. Periodontitiste ise periodontal bağ dokusu ve alveol kemiği kaybı vardır ve bu yıkım geri dönüşümsüzdür.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Periodontal Hastalık Sınıflaması'),
  'Periodontal hastalık için en önemli risk faktörü hangisidir?',
  '["İleri yaş","Sigara","Kadın cinsiyet","Stres","Kötü oral hijyen"]',
  1,
  'Sigara, periodontal hastalık için en güçlü modifiye edilebilir risk faktörüdür. Sigara içenlerde hastalık daha ağır seyreder, tedaviye yanıt daha kötüdür. Sigara bırakmak periodontal prognozunu belirgin iyileştirir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Periodontal Hastalık Sınıflaması'),
  'BOP (Bleeding on Probing — Sondlamada Kanama) neyi gösterir?',
  '["Dişeti sağlıklı","Aktif gingival iltihap","Kemik kaybı","Derin cep varlığı","Diş taşı varlığı"]',
  1,
  'BOP, sondlama ile oluşturulan mekanik uyarıya karşı kanama yanıtıdır. Gingival sulkus/cebin iç duvarında aktif iltihap varlığının göstergesidir. BOP negatifliği dişeti sağlığının güçlü bir göstergesidir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Periodontal Hastalık Sınıflaması'),
  'Furkasyon tutulumu sınıflamasında Sınıf III ne anlama gelir?',
  '["Furkasyon yok","Prob furkasyona giriyor ama geçmiyor","Prob furkasyonu geçiyor (through-and-through)","Cerrahi gerektiren furkasyon","Furkasyon açığa çıkmış ama temizlenebilir"]',
  2,
  'Furkasyon tutulumu: Sınıf I — prob <3 mm giriyor; Sınıf II — prob >3 mm giriyor ama geçmiyor; Sınıf III — prob furkasyonu tamamen geçiyor (''through-and-through''). Sınıf III en ağır durumdur, prognoz kötüdür.'
),

-- ===== KONU 10: Periodontal Tedavi =====
(
  (SELECT id FROM public.topics WHERE title = 'Periodontal Tedavi Basamakları'),
  'Periodontal tedavide "kök yüzeyi düzleştirme" (root planing) amacı nedir?',
  '["Diş taşını kaldırmak","Etkilenmiş sement ve bakteriyal endotoksinleri uzaklaştırmak","Kemiği şekillendirmek","Gingival cebi kapamak","Diş yüzeyini parlatmak"]',
  1,
  'Kök yüzeyi düzleştirmede subgingival diş taşı, enfekte sement ve bakteriyal endotoksinler uzaklaştırılır. Böylece kök yüzeyi biyouyumlu hale gelir ve dişeti-kök arayüzeyinde yeniden bağlantı sağlanabilir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Periodontal Tedavi Basamakları'),
  'Faz 1 periodontal tedavi sonrası yeniden değerlendirme ne zaman yapılır?',
  '["1 hafta","2-3 hafta","6-8 hafta","3 ay","6 ay"]',
  2,
  '6-8 hafta, doku iyileşmesi için yeterli süredir. Bu süre sonunda cep derinliği, BOP, plak kontrolü değerlendirilir ve cerrahi ihtiyaç belirlenir. Erken değerlendirme iyileşmeyi tam yansıtmaz.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Periodontal Tedavi Basamakları'),
  'GTR (Yönlendirilmiş Doku Rejenerasyonu) ile amaçlanan nedir?',
  '["Alveol kemiğinin tamamen yenilenmesi","Yeni periodontal bağ dokusu, sement ve kemik oluşumu","Sadece kemik dolumunun sağlanması","Dişeti şeklinin düzeltilmesi","İnflamasyonun baskılanması"]',
  1,
  'GTR''de bariyer membran kullanılarak epitelyal ve gingival bağ dokusu hücrelerinin kök yüzeyine hızlı göçü engellenir, periodontal ligament hücrelerinin bölgeye gelmesine ve yeni periodonsiyum (sement + PDL + kemik) oluşmasına olanak tanınır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Periodontal Tedavi Basamakları'),
  'Periodontal destekleyici tedavi (PDT) aralığı standart olarak ne kadardır?',
  '["Her ay","Her 3 ay","Her 3-6 ay","Her yıl","2 yılda bir"]',
  2,
  'Periodontal tedavi sonrası bakım ziyaretleri standart olarak 3-6 ayda bir yapılır. Risk faktörü yüksek hastalarda (sigara, DM, aktif hastalık hikayesi) 3 aylık aralık tercih edilir.'
),

-- ===== KONU 11: Angle Sınıflaması =====
(
  (SELECT id FROM public.topics WHERE title = 'Angle Sınıflaması'),
  'Angle Sınıf I maloklüzyonun en sık nedeni hangisidir?',
  '["İskelet anomalisi","Diş çapraşıklığı","Alışkanlık","Kalıtım","Dil baskısı"]',
  1,
  'Angle Sınıf I maloklüzyonunda molar ilişkisi normaldir, problem diş seviyesindedir. En sık neden diş çapraşıklığıdır (diş boyutlarının ark boyutunu aşması). İskelet ilişkisi genellikle normaldir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Angle Sınıflaması'),
  'Angle Sınıf II Divison 2 maloklüzyonun karakteristik özelliği nedir?',
  '["Üst kesiciler protrüzif, derin kapanış","Üst kesiciler retroklüze, derin kapanış","Alt çene öne çıkmış","Anterior açık kapanış","Çapraz kapanış"]',
  1,
  'Sınıf II Div. 2''de üst santral kesiciler retroklüze (geriye eğik), üst lateral kesiciler ise mesiale eğiktir. Derin kapanış (deep bite) sık görülür. Bu durum genellikle üst çene küçük/dar ark ile birliktedir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Angle Sınıflaması'),
  'Sefalometride ANB açısı ne hakkında bilgi verir?',
  '["Mandibulanın rotasyonu","Üst çene ile alt çene arasındaki sagittal iskelet ilişkisi","Dişlerin pozisyonu","Yumuşak doku profili","Vertikal boyut"]',
  1,
  'ANB açısı (A noktası - Nasion - B noktası), maksilla (A) ile mandibula (B) arasındaki sagittal iskelet ilişkisini gösterir. Normal 2° ± 2°; artış → Sınıf II iskelet; azalma/negatif → Sınıf III iskelet.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Angle Sınıflaması'),
  'Angle sınıflaması hangi temele dayanır?',
  '["Sefalometrik analiz","Birinci daimi molar ilişkisi","Kanin ilişkisi","Overjet ölçümü","İskelet ilişkisi"]',
  1,
  'Angle sınıflaması üst 1. daimi moların meziobukal tüberkülü ile alt 1. daimi moların bukkal oluğunun ilişkisine göre yapılır. Bu ilişki 3 sınıfta değerlendirilir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Angle Sınıflaması'),
  'Fonksiyonel ortodontik apareyler (aktivatör vb.) hangi yaş grubunda en etkilidir?',
  '["Erişkin dönem","Yetişkinlik öncesi büyüme dönemi","Süt dişlenme dönemi","Karışık dişlenme başlangıcı","Yaş fark yaratmaz"]',
  1,
  'Fonksiyonel apareyler iskelet büyümesini yönlendirerek çalışır. Bu nedenle aktif büyüme döneminde (genellikle 8-14 yaş, pubertal büyüme zirvesinde) en etkilidir. Büyüme tamamlandıktan sonra iskelet etkisi beklenmez.'
),

-- ===== KONU 12: Sabit Ortodontik Apareyler =====
(
  (SELECT id FROM public.topics WHERE title = 'Sabit Ortodontik Apareyler'),
  'Sabit ortodontik tedavide en yaygın kullanılan bracket slot boyutu hangisidir?',
  '["0.018 inç","0.022 inç","0.025 inç","0.028 inç","0.030 inç"]',
  1,
  '0.022 inç slot sistemi günümüzde en yaygın kullanılan standarttır. Bu slot boyutu daha geniş teller kullanımına olanak tanır ve daha iyi tork/angülasyon kontrolü sağlar.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Sabit Ortodontik Apareyler'),
  'Ortodontik diş hareketinde basınç tarafında ne olur?',
  '["Osteoblast aktivitesi artar","Osteoklast aktivitesi artar (kemik rezorpsiyonu)","Kollajen sentezi artar","PDL genişler","Kan akımı artar"]',
  1,
  'Basınç tarafında PDL sıkışır, damarlar baskılanır ve hipoksi oluşur. Osteoklastlar aktive olarak kemik rezorpsiyonu gerçekleştirir. Gerilim tarafında ise osteoblastlar aktive olur ve yeni kemik yapılır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Sabit Ortodontik Apareyler'),
  'Ortodontik tedavide kuvvet idealinin üzerinde olması ne sonuç verir?',
  '["Daha hızlı diş hareketi","Daha yavaş diş hareketi veya diş hareketi durması","Kemik yapımı artar","PDL genişler","Ağrı hissedilmez"]',
  1,
  'Aşırı kuvvet PDL damarlarını tamamen sıkıştırır (hyalinizasyon). Bu bölgede direkt kemik rezorpsiyonu yapılamaz; uzaktan, dolaylı rezorpsiyon (undermining resorption) gerçekleşir. Diş hareketi yavaşlar veya durur.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Sabit Ortodontik Apareyler'),
  'Retansiyon döneminde en sık tercih edilen sabit retainer nereye uygulanır?',
  '["Üst çene posterioruna","Alt çene ön dişlerin lingüaline (3-3)","Üst çene ön dişlerin bukkaline","Tüm alt dişlere","Sadece kaninlere"]',
  1,
  'Alt sabit retainer (lingual retainer) alt 3-3 veya 4-4 arası dişlerin lingual yüzeyine yapıştırılır. Bu bölge en sık nükslerin görüldüğü alandır ve hastanın uyum gerektirmeyen sabit tutucu tercih edilir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Sabit Ortodontik Apareyler'),
  'Ark teli sıralamasında ilk kullanılan tel tipi nedir?',
  '["Stainless steel (paslanmaz çelik)","Nikel-titanium (NiTi)","Beta-titanium (TMA)","Altın alaşımı","Kobalt-krom"]',
  1,
  'NiTi teller süper elastik özellikleri sayesinde büyük çapraşıklıklarda bile düşük-sabit kuvvet uygular. Tedavinin başında çapraşıklığı gideren bu teller, ardından daha rijit paslanmaz çelik tellerle değiştirilir.'
),

-- ===== KONU 13: Kanal Anatomisi =====
(
  (SELECT id FROM public.topics WHERE title = 'Kanal Anatomisi'),
  'Üst birinci molarda en sık atlanana kanal hangisidir?',
  '["Palatal kanal","Mesiobukkal 1. kanal (MB1)","Mesiobukkal 2. kanal (MB2)","Distobukkal kanal","Tüm kanallar eşit sıklıkta atlanır"]',
  2,
  'MB2 kanalı üst 1. molarda %60-95 vakada bulunmasına rağmen en sık atlanan kanaldır. Operatörün mesiobukal kökü tek kanallı saydığı durumlarda tedavisi eksik kalır. MB2''yi bulmak için DG16 explorer ile MB1''in 1-2 mm lingualinde arama yapılmalıdır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Kanal Anatomisi'),
  'Vertucci Tip IV kanal konfigürasyonu nasıldır?',
  '["1 kanal, 1 foramen","2 kanal birleşir 1 foramen","1 kanal, 2 foramen","2 ayrı kanal, 2 foramen","1 kanal 2''ye ayrılır tekrar birleşir"]',
  3,
  'Vertucci Tip IV: koronal kısımda 2 ayrı kanal, apikale kadar ayrı seyreder ve 2 ayrı foramenden çıkar. Alt premolarlarda sık görülür. Tip I (1 kanal 1 foramen) en basit; Tip IV en sık klinik önem taşıyandır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Kanal Anatomisi'),
  'Apikal constriction (apeks daralması — CDJ) nerededir?',
  '["Anatomik apekste","Radiografik apekste","Sement-dentin birleşiminde (apeksten 0.5-1.5 mm içeride)","Kökün ortasında","Furkasyon seviyesinde"]',
  2,
  'CDJ (Cemento-Dentin Junction / Fizyolojik apeks) kanaldaki en dar noktadır ve anatomik apeksten 0.5-1.5 mm içeridedir. Endodontik tedavide kanal dolgusu bu noktada bitirilmelidir; apikali aşmak periapical dokulara zarar verir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Kanal Anatomisi'),
  'Alt birinci molarda kaç kanal bulunması beklenir?',
  '["1 kanal","2 kanal","3-4 kanal","5 kanal","6 kanal"]',
  2,
  'Alt birinci molar genellikle 2 kök (mezial ve distal) ve 3-4 kanal içerir: mezial kökte 2 kanal (ML ve MB), distal kökte 1-2 kanal. Nadir de olsa 3. distolingual kök (radix entomolaris) bulunabilir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Kanal Anatomisi'),
  'Endodontik tedavide çalışma boyu belirlenmesinde altın standart yöntem nedir?',
  '["Yalnızca radyografik yöntem","Elektronik apeks bulucu (EAB)","Taktil his","EAB + radyografi kombine","Diş uzunluk tabloları"]',
  3,
  'Modern endodontide EAB + periapikal radyografi kombinasyonu altın standarttır. EAB CDJ''yi elektronik olarak bulurken, radyografi anatomik referans ve dosya pozisyonunu görsel olarak doğrular. Tek başına hiçbir yöntem %100 güvenilir değildir.'
),

-- ===== KONU 14: İrrigasyon Solüsyonları =====
(
  (SELECT id FROM public.topics WHERE title = 'İrrigasyon Solüsyonları'),
  'Sodyum hipoklorit (NaOCl)''in endodontik irriganda sahip olduğu TEK özellik hangisidir?',
  '["Smear layer''ı kaldırma","Anorganik madde çözme","Organik doku (pulpa) çözme","Antibiyotiksiz antibakteriyal etki","pH tamponlama"]',
  2,
  'NaOCl endodontik irriganlar arasında organik dokuları (pulpa artıkları, kollajen) çözebilen tek maddedir. Bu özelliği onu vazgeçilmez kılar. EDTA ise anorganik smear layer''ı çözer. İkisi birbirini tamamlar.'
),
(
  (SELECT id FROM public.topics WHERE title = 'İrrigasyon Solüsyonları'),
  'EDTA ve NaOCl aynı anda/hemen arka arkaya kullanıldığında ne olur?',
  '["Sinerjistik antibakteriyal etki","NaOCl''in dentin tübüllerine penetrasyonu artar","NaOCl etkisizleşir (EDTA NaOCl''ü nötralize eder)","Renk değişimi olur","Hiçbir etkileşim olmaz"]',
  2,
  'EDTA NaOCl''ü hızla nötralize eder (EDTA''nın şelat yapısı kloru bağlar). Bu nedenle sıralama önemlidir: önce NaOCl → ardından EDTA (son flush) → tekrar NaOCl. Bu sıra hem organik hem anorganik temizliği sağlar.'
),
(
  (SELECT id FROM public.topics WHERE title = 'İrrigasyon Solüsyonları'),
  'Klorheksidin (%2 CHX) NaOCl ile karıştırıldığında ne oluşur?',
  '["Güçlü antibakteriyal madde","Toksik para-kloroanilin (PCA) çökelti","Renksiz çökelti","Köpük","Hiçbir şey"]',
  1,
  'NaOCl + CHX karışımı toksik para-kloroanilin (PCA) içeren turuncu-kahverengi çökelti oluşturur. Bu madde genotoksik ve karsinojenik potansiyele sahiptir. Bu iki irrigan asla doğrudan karıştırılmamalıdır; arada distile su ile yıkama yapılmalıdır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'İrrigasyon Solüsyonları'),
  'Pasif ultrasonik irrigasyon (PUI)''ın standart irrigasyona üstünlüğü nedir?',
  '["Daha az NaOCl kullanımı","Daha hızlı işlem","Akustik akış ile apikale daha iyi penetrasyon ve debris uzaklaştırma","Daha ucuz","Daha az dentin kaldırımı"]',
  2,
  'PUI''da ultrasonik dosya titreşimi irrigan sıvıda akustik mikro-akış (acoustic streaming) ve kavitasyon oluşturur. Bu etki irriganın kanal içinde daha etkin dağılmasını, debris ve biyofilm uzaklaştırılmasını sağlar. Standart syringe irrigasyonuna kıyasla üstün temizlik gücü vardır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'İrrigasyon Solüsyonları'),
  'Hipoklorit kazası (NaOCl accident) en sık hangi hatadan kaynaklanır?',
  '["Yanlış konsantrasyon kullanımı","İrigasyon iğnesinin kanala kilitlenmesi ve zorla itme","Çok fazla hacim kullanımı","NaOCl''ün ısıtılması","Yanlış pH"]',
  1,
  'NaOCl kazası, irrigation iğnesinin kanal içine kilitlenmesi (binding) ve zorla basınçla itilmesi sonucu sıvının periapikale taşması ile oluşur. Komplikasyonlar: ani şiddetli ağrı, şişlik, ekimoz, parestezi. Önlem: iğne serbestçe hareket etmeli, aspire ederek irrigasyon yapılmalıdır.'
),

-- ===== KONU 15: Süt Dişi Pulpa Tedavisi =====
(
  (SELECT id FROM public.topics WHERE title = 'Süt Dişi Pulpa Tedavisi'),
  'Süt dişinde pulpotomi endikasyonu nedir?',
  '["Apikal apse","Koronal pulpa çürüğe açılmış, radiküler pulpa sağlıklı","Tüm pulpa nekrotik","Radiküler kanal kalsifikasyonu","Kökte iç rezorpsiyon"]',
  1,
  'Pulpotomide koronal pulpa uzaklaştırılır, ancak radiküler pulpa vital ve iltihapsız olmalıdır. Apikal patoloji, radiküler iltihap veya nekroz varsa pulpektomi endikedir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Süt Dişi Pulpa Tedavisi'),
  'Süt dişi kanalı neden rezorbe olabilir materyalle doldurulmalıdır?',
  '["Daha ucuz olduğu için","Uygulanması kolay olduğu için","Fizyolojik kök rezorpsiyonunun zamanla süt dişini elimine etmesi gerektiği için","Daha iyi antibakteriyal etki","Radyoopak olduğu için"]',
  2,
  'Süt dişi kökü daimi diş sürerken fizyolojik olarak rezorbe olur. Kanal, bu rezorpsiyon sırasında dağılabilen ZOE gibi rezorbe olabilir materyal ile doldurulmalıdır. Gutta-percha gibi rezorbe olmayan materyaller daimi diş gelişimini engelleyebilir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Süt Dişi Pulpa Tedavisi'),
  'Formokrezol pulpotomide klinisyenin temel endişesi nedir?',
  '["Etkinlik düşüklüğü","Sitotoksisite ve potansiyel sistemik etkiler (formaldehit içeriği)","Uygulaması zor","Pahalı olması","Radyoopak olmaması"]',
  1,
  'Formaldehit içeren formokrezol sitotoksik, mutajenik ve potansiyel karsinojenik özellikleri nedeniyle tartışmalıdır. Bu nedenle MTA veya ferrik sülfat gibi alternatifler önerilmektedir. Formokrezol hala bazı bölgelerde kullanılmakla birlikte kullanımı azalmaktadır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Süt Dişi Pulpa Tedavisi'),
  'Pulpotomi sonrası süt dişi en uygun şekilde nasıl restore edilir?',
  '["Kompozit","Amalgam","Paslanmaz çelik kron","Cam iyonomer","Geçici dolgu"]',
  2,
  'Pulpotomi yapılan süt dişi, kalan doku kaybı ve kırık riski nedeniyle paslanmaz çelik kron (SSC) ile restore edilmelidir. SSC, dişi tam olarak sarar ve kırılmayı önler. Posterior süt dişlerinde amalgam veya kompozit yeterli kuvvete sahip değildir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Süt Dişi Pulpa Tedavisi'),
  'İndirekt pulpa tedavisinde (IPT) kalan çürük dentin neden tamamen kaldırılmaz?',
  '["Zaman tasarrufu","Pulpaya yakın etkilenmiş dentinin uzaklaştırılması pulpayı açabilir, remineralizasyon olasıdır","Hastanın ağrı eşiği düşük","Materyal yeterli değil","Radyografik kontrol yeterli"]',
  1,
  'IPT''de derin çürükte pulpaya en yakın yumuşak dentin bırakılır çünkü bu tabakanın kaldırılması pulpayı açabilir. Üzerine kalsiyum hidroksit veya MTA gibi remineralize edici materyal uygulandığında, bırakılan etkilenmiş dentin zamanla remineralize olur.'
),

-- ===== KONU 16: Yer Tutucu Apareyler =====
(
  (SELECT id FROM public.topics WHERE title = 'Yer Tutucu Apareyler'),
  'Aşağıdaki durumlardan hangisinde yer tutucu endike DEĞİLDİR?',
  '["Süt 2. moların erken kaybı","Daimi dişin sürmesine 6 aydan az kaldığında","Süt 1. moların erken kaybı","İkinci süt moların bilateral erken kaybı","Süt kaninin erken kaybı"]',
  1,
  'Daimi diş sürmesine 6 aydan az kaldığında ark boyu korunması için yeterli süre yoktur ve yer tutucu genellikle gerekli değildir. Bu durumda sürenin dolmasını beklemek daha mantıklıdır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Yer Tutucu Apareyler'),
  'Band-loop yer tutucunun endikasyonu nedir?',
  '["Bilateral çok diş kaybı","Tek taraflı tek diş kaybı","Anterior diş kaybı","Tüm ark için yer tutma","Alt anterior segment için"]',
  1,
  'Band-loop, tek taraflı bir diş kaybında tercih edilen basit sabit yer tutucudur. Destek dişe bant uygulanır ve loop eksik dişin meziogingival bölgesinden geçerek mesio-distal aralığı korur.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Yer Tutucu Apareyler'),
  'Nance apareyi hangi durumda kullanılır?',
  '["Alt çenede unilateral kayıp","Üst çenede bilateral posterior kayıp","Anterior açık kapanış","Anterior tek diş kaybı","Tüm dişler çürüklü"]',
  1,
  'Nance apareyi üst çenede bilateral posterior diş kaybında kullanılan sabit yer tutucudur. Her iki taraftaki molar dişlere bantlar uygulanır, palatal bölgeyi geçen tel damakta akrilik topuzla destek alır.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Yer Tutucu Apareyler'),
  'Yer tutucu yapımında en kritik karar hangisidir?',
  '["Kullanılacak materyalin rengi","Hangi dişin kaybolduğu ve ne zaman kaybolduğu","Hastanın ekonomik durumu","Diş sayısı","Hastanın yaşı"]',
  1,
  'Hangi dişin erken kaybolduğu ve daimi diş sürmesine ne kadar süre kaldığı, yer tutucunun tipini, süresini ve hatta gerekip gerekmediğini belirler. Erken kayıp + uzun bekleme süresi → yer tutucu şarttır; geç kayıp + daimi diş yakın → gerekmeyebilir.'
),
(
  (SELECT id FROM public.topics WHERE title = 'Yer Tutucu Apareyler'),
  'Lingual ark yer tutucusu nerede kullanılır?',
  '["Üst çenede unilateral","Alt çenede bilateral posterior kayıp","Ön bölge kayıplarında","Süt kesici dişlerde","Tüm ark restorasyonunda"]',
  1,
  'Lingual ark, her iki alt molar dişe bantlanır ve alt ön dişlerin lingualinden geçen tel kanallarıyla bilateral posterior kayıplarda yer korur. Özellikle erken karışık dişlenme döneminde alt çenede sıkça kullanılır.'
);
