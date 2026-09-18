// Günlük soru hedefi 18.09.2026'da 50'den 100'e çıkarıldı.
// Geçmiş günler (bugün dahil) eski hedefle (50) değerlendirilmeye devam eder,
// böylece geçmiş streak/görev kayıtları bozulmaz. Bu tarihten SONRAKİ günler 100 kullanır.
export const DAILY_GOAL_CHANGE_DATE = '2026-09-19'

export const DAILY_GOAL_TEXTS = ['50 Soru Çöz', '100 Soru Çöz']

export function getDailyGoal(dateKey) {
  if (dateKey < DAILY_GOAL_CHANGE_DATE) return { threshold: 50, text: '50 Soru Çöz' }
  return { threshold: 100, text: '100 Soru Çöz' }
}
