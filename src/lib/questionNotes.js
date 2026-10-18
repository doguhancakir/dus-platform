import { supabase, fetchAllRows } from './supabase'

// Yıldızlı sorular + kişisel notlar (question_notes tablosu).
// Bir satırın olması = soru yıldızlı; note boş olabilir.

export async function loadNotes(userId) {
  try {
    const rows = await fetchAllRows(q => q
      .from('question_notes').select('question_id, note, updated_at').eq('user_id', userId))
    const map = {}
    rows.forEach(r => { map[r.question_id] = r.note || '' })
    return { map, rows, available: true }
  } catch {
    return { map: {}, rows: [], available: false }
  }
}

export async function saveNote(userId, questionId, note) {
  const { error } = await supabase.from('question_notes').upsert({
    user_id: userId,
    question_id: questionId,
    note: note || '',
    updated_at: new Date().toISOString(),
  })
  return error
}

export async function removeNote(userId, questionId) {
  const { error } = await supabase.from('question_notes').delete()
    .eq('user_id', userId).eq('question_id', questionId)
  return error
}

export function notesErrorMessage(error) {
  if (/question_notes|relation|schema cache|PGRST205|42P01/i.test(`${error?.code} ${error?.message}`)) {
    return 'Yıldız/not tablosu yok — SQL çalıştırılmalı'
  }
  return 'Kaydedilemedi'
}
