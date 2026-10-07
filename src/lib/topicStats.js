import { isDue } from './sm2'

// Bayraklı sorular yeni/bekliyor/öğrenildi sayımına girmez (normal sıradan çıkarılmış sayılır).
export function computeTopicStats(questionIds, cardsMap) {
  let newCount = 0
  let dueCount = 0
  let learnedCount = 0
  let flaggedCount = 0
  for (const qId of questionIds) {
    const c = cardsMap[qId]
    if (c?.flagged) { flaggedCount++; continue }
    if (!c || c.status === 'new') newCount++
    else if (isDue(c)) dueCount++
    else if (c.status === 'review') learnedCount++
  }
  const totalCount = questionIds.length
  const isMastered = totalCount > 0 && newCount === 0 && dueCount === 0 && learnedCount > 0
  return { totalCount, newCount, dueCount, learnedCount, flaggedCount, isMastered }
}
