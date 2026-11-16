import { useEffect, useState } from 'react'
import { EXAM_LABEL, timeLeft } from '../lib/examDate'

function useTimeLeft(intervalMs) {
  const [t, setT] = useState(() => timeLeft())
  useEffect(() => {
    const id = setInterval(() => setT(timeLeft()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return t
}

// Üst menüdeki küçük sayaç: "342 GÜN"
export function ExamCountdownBadge() {
  const t = useTimeLeft(60_000)
  return (
    <span
      title={`DUS: ${EXAM_LABEL}`}
      className="font-barlow font-bold text-[11px] tracking-[0.14em] uppercase px-2 py-1 whitespace-nowrap"
      style={{ color: '#f0c040', border: '1px solid rgba(240,192,64,0.35)', background: 'rgba(240,192,64,0.06)' }}
    >
      {t.done ? 'DUS GÜNÜ' : `DUS · ${t.days} GÜN`}
    </span>
  )
}

// Ana sayfadaki büyük geri sayım
export default function ExamCountdown() {
  const t = useTimeLeft(1000)
  const pad = n => String(n).padStart(2, '0')
  const cells = [
    { v: t.days, l: 'GÜN' },
    { v: pad(t.hours), l: 'SAAT' },
    { v: pad(t.minutes), l: 'DAKİKA' },
    { v: pad(t.seconds), l: 'SANİYE' },
  ]
  return (
    <div className="inline-flex flex-col gap-1.5">
      <span className="font-barlow font-bold text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(240,192,64,0.7)' }}>
        DUS'a kalan · {EXAM_LABEL}
      </span>
      {t.done ? (
        <span className="font-bebas text-3xl tracking-widest" style={{ color: '#f0c040' }}>BUGÜN SINAV GÜNÜ — BOL ŞANS!</span>
      ) : (
        <div className="flex items-stretch gap-1.5">
          {cells.map(c => (
            <div
              key={c.l}
              className="flex flex-col items-center justify-center px-2.5 py-1.5 min-w-[58px]"
              style={{ background: 'rgba(240,192,64,0.06)', border: '1px solid rgba(240,192,64,0.3)' }}
            >
              <span className="font-bebas leading-none tabular-nums" style={{ fontSize: 30, color: '#f0c040' }}>{c.v}</span>
              <span className="font-barlow font-bold text-[9px] tracking-[0.16em] mt-0.5" style={{ color: 'rgba(240,192,64,0.6)' }}>{c.l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
