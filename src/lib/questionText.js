const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

// Şıklar orijinal (karıştırılmamış) sırada, doğru şık ✓ ile işaretli.
export function questionToText(q, { index, topicTitle } = {}) {
  const lines = []
  if (topicTitle) lines.push(`[${topicTitle}]`)
  if (q.source) lines.push(`Kaynak: ${q.source}`)
  lines.push(index != null ? `${index}. ${q.question_text}` : q.question_text)
  ;(q.options || []).forEach((opt, oi) => {
    lines.push(`${LETTERS[oi] ?? oi + 1}) ${opt}${oi === q.correct_answer ? ' ✓' : ''}`)
  })
  if (q.explanation) lines.push(`Açıklama: ${q.explanation}`)
  return lines.join('\n')
}

export function questionsToText(questions) {
  return questions.map((q, i) => questionToText(q, { index: i + 1 })).join('\n\n')
}

export function toFileSlug(text, fallback = 'sorular') {
  return (text || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback
}

export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
