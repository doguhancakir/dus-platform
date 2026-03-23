/**
 * Anki SM-2 Algorithm Implementation
 * Birebir Anki'nin SM-2 tabanlı algoritması
 */

export const CARD_STATUS = {
  NEW: 'new',
  LEARNING: 'learning',
  REVIEW: 'review',
  RELEARNING: 'relearning',
}

export const RATINGS = {
  AGAIN: 0,  // Tekrar
  HARD: 1,   // Zor
  GOOD: 2,   // İyi
  EASY: 3,   // Kolay
}

// Öğrenme adımları (dakika cinsinden) — Anki varsayılanı
const LEARNING_STEPS = [1, 10]
const RELEARNING_STEPS = [10]

const MIN_EASE = 1.3
const DEFAULT_EASE = 2.5

/**
 * Sonraki gösterim zamanını hesapla
 * @param {Object} card - Mevcut kart verisi
 * @param {number} rating - RATINGS enum değeri
 * @returns {Object} - Güncellenmiş kart verisi
 */
export function processCard(card, rating) {
  const now = new Date()
  const updated = { ...card, last_review: now.toISOString() }

  switch (card.status) {
    case CARD_STATUS.NEW:
    case CARD_STATUS.LEARNING:
      return processLearning(updated, rating, LEARNING_STEPS)

    case CARD_STATUS.REVIEW:
      return processReview(updated, rating)

    case CARD_STATUS.RELEARNING:
      return processLearning(updated, rating, RELEARNING_STEPS, true)

    default:
      return processLearning(updated, rating, LEARNING_STEPS)
  }
}

function processLearning(card, rating, steps, isRelearning = false) {
  const now = new Date()
  let { learning_step = 0 } = card

  switch (rating) {
    case RATINGS.AGAIN:
      // Birinci adıma dön
      return {
        ...card,
        status: isRelearning ? CARD_STATUS.RELEARNING : CARD_STATUS.LEARNING,
        learning_step: 0,
        due_date: addMinutes(now, steps[0]).toISOString(),
        ease_factor: Math.max(MIN_EASE, (card.ease_factor || DEFAULT_EASE) - 0.20),
        repetitions: 0,
        interval: 0,
      }

    case RATINGS.HARD: {
      // Mevcut ve bir sonraki adımın ortalaması
      const currentStep = steps[learning_step] || steps[steps.length - 1]
      const nextStep = steps[learning_step + 1] || steps[steps.length - 1]
      const avgMinutes = (currentStep + nextStep) / 2
      return {
        ...card,
        status: isRelearning ? CARD_STATUS.RELEARNING : CARD_STATUS.LEARNING,
        learning_step,
        due_date: addMinutes(now, avgMinutes).toISOString(),
        ease_factor: Math.max(MIN_EASE, (card.ease_factor || DEFAULT_EASE) - 0.15),
      }
    }

    case RATINGS.GOOD: {
      const nextStep = learning_step + 1
      if (nextStep >= steps.length) {
        // Son adım tamamlandı → Review'a geç
        const interval = isRelearning ? Math.max(1, Math.floor((card.interval || 1) * 0.5)) : 1
        return {
          ...card,
          status: CARD_STATUS.REVIEW,
          learning_step: 0,
          interval,
          repetitions: (card.repetitions || 0) + 1,
          ease_factor: card.ease_factor || DEFAULT_EASE,
          due_date: addDays(now, interval).toISOString(),
        }
      }
      return {
        ...card,
        status: isRelearning ? CARD_STATUS.RELEARNING : CARD_STATUS.LEARNING,
        learning_step: nextStep,
        due_date: addMinutes(now, steps[nextStep]).toISOString(),
      }
    }

    case RATINGS.EASY:
      // Hemen review'a geç
      return {
        ...card,
        status: CARD_STATUS.REVIEW,
        learning_step: 0,
        interval: 4,
        repetitions: (card.repetitions || 0) + 1,
        ease_factor: Math.min(card.ease_factor || DEFAULT_EASE, DEFAULT_EASE + 0.15),
        due_date: addDays(now, 4).toISOString(),
      }

    default:
      return card
  }
}

function processReview(card, rating) {
  const now = new Date()
  const ease = card.ease_factor || DEFAULT_EASE
  const interval = card.interval || 1
  const reps = card.repetitions || 0

  switch (rating) {
    case RATINGS.AGAIN:
      // Yeniden öğrenme aşamasına gir
      return {
        ...card,
        status: CARD_STATUS.RELEARNING,
        learning_step: 0,
        interval: 1,
        ease_factor: Math.max(MIN_EASE, ease - 0.20),
        repetitions: 0,
        due_date: addMinutes(now, RELEARNING_STEPS[0]).toISOString(),
      }

    case RATINGS.HARD: {
      const newInterval = Math.max(interval + 1, Math.round(interval * 1.2))
      return {
        ...card,
        status: CARD_STATUS.REVIEW,
        interval: newInterval,
        ease_factor: Math.max(MIN_EASE, ease - 0.15),
        due_date: addDays(now, newInterval).toISOString(),
      }
    }

    case RATINGS.GOOD: {
      let newInterval
      if (reps === 0) newInterval = 1
      else if (reps === 1) newInterval = 6
      else newInterval = Math.round(interval * ease)
      newInterval = Math.max(interval + 1, newInterval)
      return {
        ...card,
        status: CARD_STATUS.REVIEW,
        interval: newInterval,
        ease_factor: ease,
        repetitions: reps + 1,
        due_date: addDays(now, newInterval).toISOString(),
      }
    }

    case RATINGS.EASY: {
      const newInterval = Math.max(interval + 1, Math.round(interval * ease * 1.3))
      return {
        ...card,
        status: CARD_STATUS.REVIEW,
        interval: newInterval,
        ease_factor: Math.min(ease + 0.15, 4.0),
        repetitions: reps + 1,
        due_date: addDays(now, newInterval).toISOString(),
      }
    }

    default:
      return card
  }
}

// Yeni kart başlangıç değerleri
export function newCard(userId, questionId) {
  return {
    user_id: userId,
    question_id: questionId,
    status: CARD_STATUS.NEW,
    interval: 0,
    ease_factor: DEFAULT_EASE,
    repetitions: 0,
    due_date: new Date().toISOString(),
    learning_step: 0,
    last_review: null,
  }
}

/**
 * Buton için tahmini süreyi döndür
 */
export function getEstimatedTime(card, rating) {
  const status = card.status || CARD_STATUS.NEW
  const interval = card.interval || 0
  const ease = card.ease_factor || DEFAULT_EASE

  if (status === CARD_STATUS.NEW || status === CARD_STATUS.LEARNING) {
    switch (rating) {
      case RATINGS.AGAIN: return '<1dk'
      case RATINGS.HARD: return '6dk'
      case RATINGS.GOOD: return '10dk'
      case RATINGS.EASY: return '4gün'
    }
  }

  if (status === CARD_STATUS.RELEARNING) {
    switch (rating) {
      case RATINGS.AGAIN: return '<1dk'
      case RATINGS.HARD: return '6dk'
      case RATINGS.GOOD: return '10dk'
      case RATINGS.EASY: return '4gün'
    }
  }

  // Review
  switch (rating) {
    case RATINGS.AGAIN: return '10dk'
    case RATINGS.HARD: return formatDays(Math.round(interval * 1.2))
    case RATINGS.GOOD: {
      const reps = card.repetitions || 0
      let d = reps <= 1 ? (reps === 0 ? 1 : 6) : Math.round(interval * ease)
      return formatDays(Math.max(interval + 1, d))
    }
    case RATINGS.EASY:
      return formatDays(Math.max(interval + 1, Math.round(interval * ease * 1.3)))
    default: return '?'
  }
}

function formatDays(days) {
  if (days < 30) return `${days}gün`
  if (days < 365) return `${Math.round(days / 30)}ay`
  return `${Math.round(days / 365)}yıl`
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

/**
 * Kart durumuna göre Türkçe label
 */
export function getStatusLabel(status) {
  switch (status) {
    case CARD_STATUS.NEW: return 'Yeni'
    case CARD_STATUS.LEARNING: return 'Öğrenme'
    case CARD_STATUS.REVIEW: return 'İnceleme'
    case CARD_STATUS.RELEARNING: return 'Yeniden Öğrenme'
    default: return 'Bilinmeyen'
  }
}

/**
 * Due olan kartları kontrol et
 */
export function isDue(card) {
  if (!card.due_date) return true
  return new Date(card.due_date) <= new Date()
}
