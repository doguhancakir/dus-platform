import { supabase } from './supabase'

// "Çalışma günü": günlük sayaçlar, hedef, seri, takvim ve çalışma süresi gece 00:00 yerine
// kullanıcının seçtiği saatte (ör. 07:00) sıfırlanır. 02:00'de çözülen soru önceki güne sayılır.
// Saat kullanıcı başına app_settings'te `day_start_hour:<userId>` anahtarında tutulur;
// ayar yoksa 0 (gece yarısı) — eski davranış.

const LS_KEY = 'day_start_hour'
let hour = readCached()

function readCached() {
  try {
    const v = parseInt(localStorage.getItem(LS_KEY), 10)
    return Number.isInteger(v) && v >= 0 && v <= 23 ? v : 0
  } catch {
    return 0
  }
}

function setCached(h) {
  hour = h
  try { localStorage.setItem(LS_KEY, String(h)) } catch { /* yoksay */ }
}

export function getDayStartHour() { return hour }

function settingKey(userId) { return `day_start_hour:${userId}` }

// DB'den okur ve önbelleğe yazar. Değer değiştiyse true döner.
export async function loadDayStartHour(userId) {
  if (!userId) return false
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', settingKey(userId)).maybeSingle()
  if (error) return false
  const v = parseInt(data?.value ?? '0', 10)
  const h = Number.isInteger(v) && v >= 0 && v <= 23 ? v : 0
  const changed = h !== hour
  setCached(h)
  return changed
}

export async function saveDayStartHour(userId, h) {
  const { error } = await supabase.from('app_settings').upsert({
    key: settingKey(userId), value: String(h), updated_at: new Date().toISOString(),
  })
  if (!error) setCached(h)
  return error
}

function localKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Şu anki çalışma gününün başladığı an (ör. bugün 07:00; saat 07'den önceyse dün 07:00)
export function studyDayStart(now = new Date()) {
  const d = new Date(now)
  d.setHours(hour, 0, 0, 0)
  if (now < d) d.setDate(d.getDate() - 1)
  return d
}

// Bir zamanın (Date ya da ISO metin) ait olduğu çalışma günü: 'YYYY-MM-DD'
export function studyDayKey(t = new Date()) {
  return localKey(studyDayStart(new Date(t)))
}

// Çalışma gününün takvim tarihi, yerel gece yarısı olarak (takvim bileşeni için)
export function studyToday() {
  const d = studyDayStart()
  d.setHours(0, 0, 0, 0)
  return d
}
