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

// Hedef görevi "<N> Soru Çöz" metniyle tutuluyor (kişisel hedefle N değişebilir).
const GOAL_TEXT_RE = /^\d+ Soru Çöz$/
export function isGoalTodoText(text) {
  return GOAL_TEXT_RE.test(text || '')
}
export function goalTodoText(total) {
  return `${total} Soru Çöz`
}

// Kişisel hedef (user_goal_settings): kullanıcı hedefini değiştirdiğinde o günün
// tarihiyle yeni satır yazılır. Bir gün için, effective_date <= o gün olan EN SON
// satır geçerlidir; hiç satır yoksa aşağıdaki varsayılan takvim kullanılır.
// Böylece hedef değişikliği geçmiş günleri/streak'i etkilemez.
// goalHistory: effective_date'e göre artan sıralı dizi.
export function getDailyGoal(dateKey, goalHistory = []) {
  let custom = null
  for (const g of goalHistory || []) {
    if (g.effective_date <= dateKey) custom = g
    else break
  }
  if (custom) {
    return { threshold: custom.total_goal, newThreshold: custom.new_goal || 0, text: goalTodoText(custom.total_goal) }
  }
  if (dateKey < DAILY_GOAL_CHANGE_DATE) return { threshold: 50, newThreshold: 0, text: '50 Soru Çöz' }
  if (dateKey < DAILY_GOAL_CHANGE_DATE_2) return { threshold: 100, newThreshold: 0, text: '100 Soru Çöz' }
  return { threshold: 200, newThreshold: 100, text: '200 Soru Çöz' }
}

// Tablo yoksa (SQL çalıştırılmadıysa) boş dizi döner → varsayılan takvim.
export async function loadGoalHistory(supabase, userId) {
  const { data, error } = await supabase
    .from('user_goal_settings')
    .select('effective_date, total_goal, new_goal')
    .eq('user_id', userId)
    .order('effective_date')
  if (error) return { history: [], available: false }
  return { history: data || [], available: true }
}
