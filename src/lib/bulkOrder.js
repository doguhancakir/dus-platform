import { supabase } from './supabase'

// Toplu çözde soru gruplarının sırası (kullanıcı başına; app_settings'te `bulk_order:<userId>`,
// cihazda localStorage önbelleği). Tek konunun "Çöz" butonu varsayılan sırayı kullanır.
export const ORDER_GROUPS = {
  new:        { label: 'Yeni',      color: '#4466ff' },
  review:     { label: 'İnceleme',  color: '#10b981' },
  learning:   { label: 'Öğreniyor', color: '#ff9800' },
  relearning: { label: 'Tekrar',    color: '#ff1744' },
}
export const DEFAULT_ORDER = ['new', 'review', 'learning', 'relearning']

const LS_KEY = 'bulk_order'

function valid(order) {
  return Array.isArray(order) && order.length === DEFAULT_ORDER.length &&
    DEFAULT_ORDER.every(k => order.includes(k))
}

export function getBulkOrder() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY))
    return valid(v) ? v : DEFAULT_ORDER
  } catch {
    return DEFAULT_ORDER
  }
}

function cache(order) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(order)) } catch { /* yoksay */ }
}

export async function loadBulkOrder(userId) {
  if (!userId) return getBulkOrder()
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', `bulk_order:${userId}`).maybeSingle()
  if (error || !data) return getBulkOrder()
  try {
    const v = JSON.parse(data.value)
    if (valid(v)) { cache(v); return v }
  } catch { /* bozuk değer → önbellek */ }
  return getBulkOrder()
}

export async function saveBulkOrder(userId, order) {
  cache(order)
  if (!userId) return null
  const { error } = await supabase.from('app_settings').upsert({
    key: `bulk_order:${userId}`, value: JSON.stringify(order), updated_at: new Date().toISOString(),
  })
  return error
}
