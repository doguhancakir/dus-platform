/**
 * StudyTimerContext
 *
 * Kurallar:
 * - Timer yalnızca bir soru cevaplanınca BAŞLAR veya DEVAM EDER
 * - 2 dakika hareketsizlikte DURUR (paused)
 * - Durunca yalnızca yeni bir soru cevaplanınca devam eder
 * - Gün değişince o güne ait süre DB'ye kaydedilir, sıfırlanır
 * - Çoklu cihaz desteği: Supabase source of truth, localStorage sadece cache.
 *   Her cihaz sadece KENDİ saydığı saniyeleri (delta) add_study_seconds ile
 *   toplama ekler → telefon + PC süreleri birleşir. Dönen toplam ekranda
 *   gösterilir; sayaç dururken toplam düzenli olarak DB'den tazelenir.
 *   add_study_seconds yoksa eski davranış (GREATEST) kullanılır.
 */
import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const INACTIVITY_MS = 2 * 60 * 1000   // 2 dakika
const AUTOSAVE_S    = 30               // her 30 saniyede bir kayıt
const SYNC_MS       = 60 * 1000        // sayaç dururken DB'den tazeleme sıklığı

export const StudyTimerContext = createContext(null)

function todayKey() {
  return new Date().toLocaleDateString('sv-SE')
}

export function formatTimerDisplay(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

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

  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)

  const secRef       = useRef(0)
  const runningRef   = useRef(false)
  const dateRef      = useRef(todayKey())
  const intervalRef  = useRef(null)
  const inactiveRef  = useRef(null)
  const lastMoveRef  = useRef(0)
  const loadedRef    = useRef(false)  // DB yüklemesi tamamlandı mı
  const pendingRef   = useRef(0)      // bu cihazda sayılıp henüz DB'ye eklenmemiş saniye
  const additiveRef  = useRef(true)   // add_study_seconds var mı (yoksa GREATEST'e düş)

  // ── Kullanıcı hazır olunca DB'den yükle ────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    const today = todayKey()

    // Önceki günden kalan localStorage verisi → önce DB'ye kaydet
    const localDate = localStorage.getItem('study_date')
    const localSec  = parseInt(localStorage.getItem('study_seconds') ?? '0')
    if (localDate && localDate < today && localSec > 0) {
      saveToDB(user.id, localDate, localSec)
    }

    // Supabase + localStorage'dan en büyüğünü al
    supabase
      .from('study_sessions')
      .select('seconds')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => {
        const dbSec    = data?.seconds ?? 0
        const localTodaySec = localDate === today ? Math.max(0, localSec) : 0
        const bestSec  = Math.max(dbSec, localTodaySec)

        secRef.current = bestSec
        dateRef.current = today

        if (bestSec > 0) {
          setSeconds(bestSec)
          setStarted(true)
        }

        // localStorage'ı DB ile senkronize et
        localStorage.setItem('study_date',    today)
        localStorage.setItem('study_seconds', String(bestSec))

        loadedRef.current = true
      })
      .catch(() => {
        // DB erişilemiyorsa localStorage'a düş
        if (localDate === today && localSec > 0) {
          secRef.current = localSec
          setSeconds(localSec)
          setStarted(true)
        }
        dateRef.current = today
        loadedRef.current = true
      })
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Gece 12 kontrolü (30 sn'de bir) ────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const today = todayKey()
      if (today === dateRef.current) return

      if (user && secRef.current > 0) {
        flush()
      }
      dateRef.current = today
      secRef.current  = 0
      pendingRef.current = 0
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

  // ── Aktivite dinleyicileri ──────────────────────────────────────────
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

  // ── Cihazlar arası senkron ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    const id = setInterval(() => { if (!runningRef.current) syncFromDB() }, SYNC_MS)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
      else syncFromDB()
    }
    const onFocus = () => syncFromDB()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pagehide', flush)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pagehide', flush)
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Yardımcı fonksiyonlar ────────────────────────────────────────────
  function resetInactivity() {
    clearTimeout(inactiveRef.current)
    inactiveRef.current = setTimeout(pauseTimer, INACTIVITY_MS)
  }

  function startInterval() {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      secRef.current += 1
      pendingRef.current += 1
      setSeconds(secRef.current)
      if (pendingRef.current >= AUTOSAVE_S) {
        localStorage.setItem('study_seconds', String(secRef.current))
        flush()
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
    flush()
  }

  // Bu cihazın biriktirdiği saniyeleri DB'deki günlük toplama ekle.
  async function flush() {
    if (!user?.id) return
    const date = dateRef.current
    const delta = pendingRef.current
    if (delta <= 0) return
    pendingRef.current = 0
    if (additiveRef.current) {
      const { data, error } = await supabase.rpc('add_study_seconds', {
        p_user_id: user.id, p_date: date, p_delta: delta,
      })
      if (!error && typeof data === 'number') {
        // Diğer cihazların süresi de dahil toplam; bekleme sırasında sayılanları ekle
        if (date === dateRef.current) {
          secRef.current = Math.max(secRef.current, data + pendingRef.current)
          setSeconds(secRef.current)
          localStorage.setItem('study_seconds', String(secRef.current))
        }
        return
      }
      if (error && (error.code === 'PGRST202' || /could not find the function/i.test(error.message || ''))) {
        additiveRef.current = false
      } else {
        // Geçici hata: saniyeleri kaybetme, sonraki kayıtta tekrar dene
        pendingRef.current += delta
        return
      }
    }
    if (date === dateRef.current) saveToDB(user.id, date, secRef.current)
  }

  // Sayaç dururken diğer cihazda çalışılan süreyi çek
  async function syncFromDB() {
    if (!user?.id || !loadedRef.current) return
    const date = dateRef.current
    const { data, error } = await supabase
      .from('study_sessions')
      .select('seconds')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle()
    if (error || !data || date !== dateRef.current) return
    const total = data.seconds + pendingRef.current
    if (total > secRef.current) {
      secRef.current = total
      setSeconds(total)
      setStarted(true)
      localStorage.setItem('study_seconds', String(total))
    }
  }

  // GREATEST semantics: DB'deki değeri asla küçültme
  async function saveToDB(userId, date, sec) {
    if (!userId || sec <= 0) return
    try {
      await supabase.rpc('upsert_study_seconds', {
        p_user_id: userId,
        p_date:    date,
        p_seconds: sec,
      })
    } catch (e) {
      // RPC yoksa fallback: klasik upsert
      try {
        await supabase
          .from('study_sessions')
          .upsert(
            { user_id: userId, date, seconds: sec, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,date' }
          )
      } catch (e2) {
        console.error('StudyTimer DB save error:', e2)
      }
    }
  }

  // ── Public API ──────────────────────────────────────────────────────
  function triggerQuestion() {
    if (!runningRef.current) {
      runningRef.current = true
      setRunning(true)
      setStarted(true)
      startInterval()
    }
    resetInactivity()

    const today = todayKey()
    if (today !== dateRef.current) {
      if (user && secRef.current > 0) flush()
      dateRef.current = today
      secRef.current  = 0
      pendingRef.current = 0
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
