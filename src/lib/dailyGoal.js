// Günlük soru hedefi 18.09.2026'da 50'den 100'e çıkarıldı.
// 04.10.2026'dan itibaren hedef 200'e çıktı; bu 200'ün 100'ü "yeni" (daha önce
// hiç çözülmemiş) soru olmak zorunda, diğer 100'ü fark etmez (tekrar da olabilir,
// ilk 100 yeni tamamlandıktan sonraki yeniler de bu 100'e sayılır).
// Geçmiş günler (değişim tarihi dahil) eski hedefle değerlendirilmeye devam eder,
// böylece geçmiş streak/görev kayıtları bozulmaz. Bu tarihlerden SONRAKİ günler yeni hedefi kullanır.
export const DAILY_GOAL_CHANGE_DATE = '2026-09-19'
export const DAILY_GOAL_CHANGE_DATE_2 = '2026-10-04'

// 06.10.2026'dan itibaren "TEKRAR" (Again) ile cevaplanan sorular bugünkü/toplam
// sayaçlara ve günlük hedefe sayılmıyor — sadece Zor/İyi/Kolay sayılıyor.
// Bu tarihten ÖNCEKİ günler eski davranışla (her değerlendirme sayılır)
// değerlendirilmeye devam eder, geçmiş streak'ler bozulmaz.
export const AGAIN_EXCLUDED_FROM_DATE = '2026-10-06'

export const DAILY_GOAL_TEXTS = ['50 Soru Çöz', '100 Soru Çöz', '200 Soru Çöz']

export function getDailyGoal(dateKey) {
  if (dateKey < DAILY_GOAL_CHANGE_DATE) return { threshold: 50, newThreshold: 0, text: '50 Soru Çöz' }
  if (dateKey < DAILY_GOAL_CHANGE_DATE_2) return { threshold: 100, newThreshold: 0, text: '100 Soru Çöz' }
  return { threshold: 200, newThreshold: 100, text: '200 Soru Çöz' }
}
