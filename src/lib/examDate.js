// DUS 2027 sınav günü: 24 Ekim 2027, Pazar (Türkiye saati). Geri sayım bu günün başlangıcına yapılır.
export const EXAM_DATE = new Date('2027-10-24T00:00:00+03:00')
export const EXAM_LABEL = '24 Ekim 2027, Pazar'

export function timeLeft(now = Date.now()) {
  const ms = Math.max(0, EXAM_DATE.getTime() - now)
  const s = Math.floor(ms / 1000)
  return {
    done: ms === 0,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}
