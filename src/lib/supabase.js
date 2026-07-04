import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Please create .env file.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

/**
 * PostgREST varsayılan olarak tek sorguda en fazla 1000 satır döndürür.
 * Toplam say fazlaysa sonuç sessizce kesilir — bu yardımcı .range() ile
 * sayfalayıp tüm satırları toplar. Sadece satır verisine ihtiyaç olan
 * yerlerde kullan; salt sayım için { count: 'exact', head: true } yeterli.
 */
export async function fetchAllRows(buildQuery, pageSize = 1000) {
  let all = []
  let from = 0
  while (true) {
    const { data, error } = await buildQuery(supabase).range(from, from + pageSize - 1)
    if (error) throw error
    all = all.concat(data || [])
    if (!data || data.length < pageSize) break
    from += pageSize
  }
  return all
}
