import { supabase } from './supabase'

// Kitap PDF'leri ve kapakları Cloudflare R2'de (dus-kitaplar bucket'ı).
export const BOOKS_BASE_URL = 'https://pub-5e055e036bec4de1a7ca28d23caa2540.r2.dev'

export const BOOK_CATEGORIES = [
  { id: 'konu-anlatimi', label: 'Konu Anlatımı' },
  { id: 'soru-bankasi', label: 'Soru Bankası' },
  { id: 'deneme', label: 'Deneme' },
]

export function categoryLabel(id) {
  return BOOK_CATEGORIES.find(c => c.id === id)?.label ?? id
}

export function r2Url(key) {
  if (!key) return null
  return `${BOOKS_BASE_URL}/${key.split('/').map(encodeURIComponent).join('/')}`
}

export function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// { books, available } — tablo yoksa available=false (SQL çalıştırılmamış)
export async function loadBooks({ branchId, includeHidden = false } = {}) {
  let q = supabase
    .from('books')
    .select('*')
    .order('category')
    .order('sort_order')
  if (branchId !== undefined) q = branchId === null ? q.is('branch_id', null) : q.eq('branch_id', branchId)
  if (!includeHidden) q = q.eq('hidden', false)
  const { data, error } = await q
  if (error) return { books: [], available: false }
  return { books: data || [], available: true }
}
