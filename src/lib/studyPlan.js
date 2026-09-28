// DUS 2027 Çalışma Planı — faz/hafta hesaplama

const P1_START = new Date('2026-06-15T00:00:00')
const P2_START = new Date('2026-09-01T00:00:00')
const P3_START = new Date('2027-02-01T00:00:00')
const P4_START = new Date('2027-07-01T00:00:00')
const P4_END   = new Date('2027-09-16T00:00:00')

function floor(d) { const r = new Date(d); r.setHours(0,0,0,0); return r }
function daysBetween(a, b) { return Math.floor((floor(b) - floor(a)) / 86400000) }

export function getPhaseInfo(date) {
  const d = floor(date)
  if (d >= floor(P1_START) && d < floor(P2_START)) {
    const weekNum = Math.floor(daysBetween(P1_START, d) / 7) + 1
    return { phase: 1, label: 'Faz 1 — Yaz Sprint', weekNum, totalWeeks: 11 }
  }
  if (d >= floor(P2_START) && d < floor(P3_START)) {
    const weekNum = Math.floor(daysBetween(P2_START, d) / 7) + 1
    return { phase: 2, label: 'Faz 2 — Güz/Kış Turu', weekNum, totalWeeks: 22 }
  }
  if (d >= floor(P3_START) && d < floor(P4_START)) {
    const weekNum = Math.floor(daysBetween(P3_START, d) / 7) + 1
    return { phase: 3, label: 'Faz 3 — Bahar Turu', weekNum, totalWeeks: 21 }
  }
  if (d >= floor(P4_START) && d < floor(P4_END)) {
    const weekNum = Math.floor(daysBetween(P4_START, d) / 7) + 1
    return { phase: 4, label: 'Faz 4 — Final Sprint', weekNum, totalWeeks: 11 }
  }
  return null
}
