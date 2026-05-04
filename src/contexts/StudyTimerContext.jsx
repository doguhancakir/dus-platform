/**
 * StudyTimerContext
 *
 * Kurallar:
 * - Timer yalnızca bir soru cevaplanınca BAŞLAR veya DEVAM EDER
 * - 2 dakika hareketsizlikte DURUR (paused)
 * - Durunca yalnızca yeni bir soru cevaplanınca devam eder — başka hiçbir tıklama resume etmez
 * - Gün değişince (gece 12) o güne ait süre DB'ye kaydedilir, sıfırlanır
 * - Sayfa yeniden açılınca localStorage'dan kaldığı yerden yüklenir (paused halde)
 */
import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const INACTIVITY_MS = 2 * 60 * 1000   // 2 dakika
const AUTOSAVE_S    = 30               // her 30 saniyede bir localStorage + DB

export const StudyTimerContext = createContext(null)

/** "2026-05-04" formatında bugünün tarihi */
function todayKey() {
  return new Date().toLocaleDateString('sv-SE')
}

/** 90 → "01:30" | 3661 → "1:01:01" */
export function formatTimerDisplay(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 90 → "1 dakika çalışıldı" | 3661 → "1 saat 1 dk çalışıldı" */
export function formatTimerLabel(seconds) {
  if (seconds <= 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h} saat ${m} dk çalışıldı`
  if (h > 0)          return `${h} saat çalışıldı`
  if (m > 0)          return `${m} dakika çalışıldı`
  return `${seconds} saniye çalışıldı`
}

export function StudyTimerProvider({ children }) {
  const { user } = useAuth()

  // seconds: bugün biriken toplam saniye
  // running: şu an sayıyor mu
  // started: en az 1 soru cevaplanmış mı (widget görünsün mü)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)

  const secRef        = useRef(0)
  const runningRef    = useRef(false)
  const dateRef       = useRef(todayKey())
  const intervalRef   = useRef(null)
  const inactiveRef   = useRef(null)
  const lastMoveRef   = useRef(0)

  // ── Başlangıçta localStorage'dan yükle ──────────────────────────────
  useEffect(() => {
    const storedDate = localStorage.getItem('study_date')
    const storedSec  = parseInt(localStorage.getItem('study_seconds') ?? '0')
    const today      = todayKey()

    if (storedDate === today && storedSec > 0) {
      secRef.current = storedSec
      setSeconds(storedSec)
      setStarted(true)
      // Paused halinde başlar — yalnızca soru çözünce resume olur
    } else if (storedDate && storedDate < today && storedSec > 0) {
      // Önceki günden kalan veri → DB'ye kaydet
      if (user) saveToDB(user.id, storedDate, storedSec)
      localStorage.setItem('study_date',    today)
      localStorage.setItem('study_seconds', '0')
    } else {
      localStorage.setItem('study_date',    today)
      localStorage.setItem('study_seconds', '0')
    }
    dateRef.current = today
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Gece 12 kontrolü (30 sn'de bir) ────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const today = todayKey()
      if (today === dateRef.current) return

      // Gün değişti → kaydet ve sıfırla
      if (user && secRef.current > 0) {
        saveToDB(user.id, dateRef.current, secRef.current)
      }
      dateRef.current = today
      secRef.current  = 0
      setSeconds(0)
      setStarted(false)
      setRunning(false)
      runningRef.current = false
      clearInterval(intervalRef.current)
      clearTimeout(inactiveRef.current)
      localStorage.setItem('study_date',    today)
      localStorage.setItem('study_seconds', '0')
    }, 30_000)

    return () => clearInterval(id)
  }, [user])

  // ── Aktivite dinleyicileri (yalnızca running iken inactivity sıfırlar) ──
  useEffect(() => {
    const onActivity = () => {
      if (!runningRef.current) return
      resetInactivity()
    }
    const onMouseMove = () => {
      const now = Date.now()
      if (now - lastMoveRef.current < 5_000) return
      lastMoveRef.current = now
      onActivity()
    }

    window.addEventListener('click',      onActivity,  { passive: true })
    window.addEventListener('keydown',    onActivity,  { passive: true })
    window.addEventListener('touchstart', onActivity,  { passive: true })
    window.addEventListener('mousemove',  onMouseMove, { passive: true })
    return () => {
      window.removeEventListener('click',      onActivity)
      window.removeEventListener('keydown',    onActivity)
      window.removeEventListener('touchstart', onActivity)
      window.removeEventListener('mousemove',  onMouseMove)
    }
  }, [])

  // ── Yardımcı fonksiyonlar ────────────────────────────────────────────
  function resetInactivity() {
    clearTimeout(inactiveRef.current)
    inactiveRef.current = setTimeout(pauseTimer, INACTIVITY_MS)
  }

  function startInterval() {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      secRef.current += 1
      setSeconds(secRef.current)
      if (secRef.current % AUTOSAVE_S === 0) {
        localStorage.setItem('study_seconds', String(secRef.current))
        if (user) saveToDB(user.id, dateRef.current, secRef.current)
      }
    }, 1_000)
  }

  function pauseTimer() {
    if (!runningRef.current) return
    runningRef.current = false
    setRunning(false)
    clearInterval(intervalRef.current)
    clearTimeout(inactiveRef.current)
    localStorage.setItem('study_seconds', String(secRef.current))
    if (user) saveToDB(user.id, dateRef.current, secRef.current)
  }

  async function saveToDB(userId, date, sec) {
    if (!userId || sec <= 0) return
    try {
      await supabase
        .from('study_sessions')
        .upsert(
          { user_id: userId, date, seconds: sec, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,date' }
        )
    } catch (e) {
      console.error('StudyTimer DB save error:', e)
    }
  }

  // ── Public API ──────────────────────────────────────────────────────
  /** Bir soru cevaplanınca çağrılır → timer başlar veya devam eder */
  function triggerQuestion() {
    if (!runningRef.current) {
      runningRef.current = true
      setRunning(true)
      setStarted(true)
      startInterval()
    }
    resetInactivity()
    // Tarih tutarlılığı
    const today = todayKey()
    if (today !== dateRef.current) {
      if (user && secRef.current > 0) saveToDB(user.id, dateRef.current, secRef.current)
      dateRef.current = today
      secRef.current  = 0
      setSeconds(0)
      localStorage.setItem('study_date',    today)
      localStorage.setItem('study_seconds', '0')
    }
  }

  return (
    <StudyTimerContext.Provider value={{ seconds, running, started, triggerQuestion }}>
      {children}
    </StudyTimerContext.Provider>
  )
}

export function useStudyTimer() {
  const ctx = useContext(StudyTimerContext)
  if (!ctx) throw new Error('useStudyTimer must be used within StudyTimerProvider')
  return ctx
}
