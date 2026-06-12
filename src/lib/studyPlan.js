// DUS 2027 Çalışma Planı — hesaplama motoru

const P1_START = new Date('2026-06-08T00:00:00')
const P2_START = new Date('2026-09-01T00:00:00')
const P3_START = new Date('2027-02-01T00:00:00')
const P4_START = new Date('2027-07-01T00:00:00')
const P4_END   = new Date('2027-09-16T00:00:00')

function floor(d) { const r = new Date(d); r.setHours(0,0,0,0); return r }
function daysBetween(a, b) { return Math.floor((floor(b) - floor(a)) / 86400000) }
// 0=Pazartesi … 6=Pazar
function dow(date) { return (date.getDay() + 6) % 7 }
function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ── İkon & isim tabloları ────────────────────────────────────────────────────

const ICONS = {
  yeni_konu:'📖', soru_bankasi:'❓', srs_tekrar:'🔄', haftalik_deneme:'📝',
  hata_analizi:'🔍', zayif_nokta_tekrar:'⚡', planlama:'📋',
  srs_tekrar_soru:'🔄', ileri_konu_vaka:'📖', karma_soru:'❓',
  hata_defteri_tekrar:'🔍', vaka_soru_seti:'🏥', tam_deneme:'📝',
  deneme_analizi:'🔍', deneme_hata_tekrari:'🔍',
}

const DERS = {
  anatomi:'Anatomi', histoloji_embriyoloji:'Histoloji/Embriyoloji',
  fizyoloji_biyokimya:'Fizyoloji/Biyokimya', mikrobiyoloji_patoloji:'Mikrobiyoloji/Patoloji',
  karma_temel_bilimler:'Karma TB', karma:'Karma', karma_genel:'Karma (Genel)',
  tum_dersler:'Tüm Dersler', temel_bilimler:'Temel Bilimler', genel:'Genel',
  periodontoloji:'Periodontoloji', ortodonti:'Ortodonti', protetik:'Protetik',
  farmakoloji:'Farmakoloji', restoratif:'Restoratif', acbh_tmd:'AÇBH/TMD',
  biyoistatistik_etik:'Biyoistatistik/Etik', patoloji_oral:'Oral Patoloji',
  pedodonti:'Pedodonti', endodonti:'Endodonti', oral_cerrahi:'Oral Cerrahi',
  radyoloji:'Radyoloji', tukuruk_bezi:'Tükürük Bezi',
}

const TYPE_LABEL = {
  yeni_konu:'Yeni konu', soru_bankasi:'Soru bankası', srs_tekrar:'SRS tekrar',
  haftalik_deneme:'Haftalık deneme', hata_analizi:'Hata analizi',
  zayif_nokta_tekrar:'Zayıf nokta tekrar', planlama:'Haftalık planlama',
  srs_tekrar_soru:'SRS + soru', ileri_konu_vaka:'İleri konu/vaka',
  karma_soru:'Karma soru', hata_defteri_tekrar:'Hata defteri',
  vaka_soru_seti:'Vaka soru seti', tam_deneme:'Tam deneme (120s)',
  deneme_analizi:'Deneme analizi', deneme_hata_tekrari:'Deneme hata tekrarı',
}

// ── Faz 1 müfredat ──────────────────────────────────────────────────────────

const P1_TOPICS = {
  anatomi:[
    'Kafa iskeleti — nörokranyum ve viserokranyum kemikleri',
    'Mandibula ve maksilla detaylı anatomisi',
    'Temporomandibular eklem (TME) anatomisi',
    'Çiğneme kasları (masseter, temporalis, pterygoidler)',
    'Trigeminal sinir (N.V) — dallanma ve innervasyon alanları',
    'Fasiyal sinir (N.VII) ve diğer kraniyal sinirler (IX, X, XII)',
    'Baş-boyun arteriyel sistemi (a. carotis externa dalları)',
    'Baş-boyun venöz ve lenfatik drenaj',
    'Fasiyal aralık (spatium) anatomisi',
    'Tükürük bezleri anatomisi (parotis, submandibular, sublingual)',
    'Boyun üçgenleri ve klinik önemi',
  ],
  histoloji_embriyoloji:[
    'Diş gelişiminin embriyolojik evreleri (tomurcuk-kep-can)',
    'Mine (enamel) histolojisi ve mineralizasyon',
    'Dentin histolojisi ve dentin tipleri',
    'Pulpa dokusu histolojisi',
    'Sement histolojisi',
    'Periodontal ligament histolojisi',
    'Alveol kemiği histolojisi',
    'Oral mukoza histolojisi (keratinize/non-keratinize bölgeler)',
    'Tükürük bezleri histolojisi ve salgı tipleri',
    'TME histolojisi',
    'Kraniofasiyal gelişim ve yarık damak/dudak embriyolojisi',
  ],
  fizyoloji_biyokimya:[
    'Sinir hücresi fizyolojisi — aksiyon potansiyeli, sinaptik iletim',
    'Kas kasılma mekanizması (çizgili kas fizyolojisi)',
    'Kan fizyolojisi — hücreler, hemostaz, pıhtılaşma kaskadı',
    'Kardiyovasküler fizyoloji temelleri',
    'Solunum fizyolojisi temelleri',
    'Sindirim sistemi fizyolojisi ve tükürük salgısı kontrolü',
    'Endokrin sistem — hormonların diş-kemik metabolizmasına etkisi',
    'Karbonhidrat metabolizması (glikoliz, Krebs — sınav odaklı)',
    'Lipid ve protein metabolizması (kollajen sentezi dahil)',
    'Vitaminler ve mineraller — eksiklik durumlarının oral bulguları',
    'Asit-baz dengesi ve tükürük tamponlama sistemi',
  ],
  mikrobiyoloji_patoloji:[
    'Genel bakteriyoloji — gram pozitif/negatif, yapı',
    'Ağız florası ve dental plak mikrobiyolojisi',
    'Sterilizasyon ve dezenfeksiyon yöntemleri',
    'Viroloji — herpes ailesi ve oral bulgular',
    'Mikoloji — Candida ve oral kandidiazis',
    'İmmünoloji temelleri — hipersensitivite reaksiyonları',
    'Genel patoloji — inflamasyon (akut/kronik)',
    'Genel patoloji — yara iyileşmesi ve onarım',
    'Hücre hasarı, nekroz ve apoptoz',
    'Neoplazi — genel kavramlar, benign/malign ayrımı',
    'Oral lezyonlar — premalign ve malign oral lezyonlar genel bakış',
  ],
}

// ── Faz 2 haftalık ders ataması ─────────────────────────────────────────────

const P2_WEEKLY = [
  {z:'periodontoloji',g:'patoloji_oral'},{z:'ortodonti',g:'pedodonti'},
  {z:'protetik',g:'endodonti'},{z:'farmakoloji',g:'oral_cerrahi'},
  {z:'restoratif',g:'radyoloji'},{z:'acbh_tmd',g:'tukuruk_bezi'},
  {z:'biyoistatistik_etik',g:'patoloji_oral'},{z:'periodontoloji',g:'pedodonti'},
  {z:'ortodonti',g:'endodonti'},{z:'protetik',g:'oral_cerrahi'},
  {z:'farmakoloji',g:'radyoloji'},{z:'restoratif',g:'tukuruk_bezi'},
  {z:'acbh_tmd',g:'patoloji_oral'},{z:'biyoistatistik_etik',g:'pedodonti'},
  {z:'periodontoloji',g:'endodonti'},{z:'ortodonti',g:'oral_cerrahi'},
  {z:'protetik',g:'radyoloji'},{z:'farmakoloji',g:'tukuruk_bezi'},
  {z:'restoratif',g:'patoloji_oral'},{z:'acbh_tmd',g:'pedodonti'},
  {z:'biyoistatistik_etik',g:'endodonti'},{z:'periodontoloji',g:'oral_cerrahi'},
]

const TB_ILERI = ['anatomi','histoloji_embriyoloji','fizyoloji_biyokimya','mikrobiyoloji_patoloji']

// Faz 3 zayıf dersler (7 ders, her hafta 1 kayar)
const P3_ZAYIF = ['periodontoloji','ortodonti','protetik','farmakoloji','restoratif','acbh_tmd','biyoistatistik_etik']
const P3_GUCLU = ['patoloji_oral','pedodonti','endodonti','oral_cerrahi','radyoloji','tukuruk_bezi']

// ── Günlük blok şablonları ──────────────────────────────────────────────────
// dow: 0=Pzt, 1=Sal, 2=Çar, 3=Per, 4=Cum, 5=Cmt, 6=Paz

const P1_DAYS = [
  [{t:'yeni_konu',d:'anatomi',s:90},{t:'soru_bankasi',d:'karma_temel_bilimler',s:30},{t:'srs_tekrar',d:'karma_temel_bilimler',s:30}],
  [{t:'yeni_konu',d:'histoloji_embriyoloji',s:90},{t:'soru_bankasi',d:'karma_temel_bilimler',s:30},{t:'srs_tekrar',d:'karma_temel_bilimler',s:30}],
  [{t:'yeni_konu',d:'fizyoloji_biyokimya',s:90},{t:'soru_bankasi',d:'karma_temel_bilimler',s:30},{t:'srs_tekrar',d:'karma_temel_bilimler',s:30}],
  [{t:'yeni_konu',d:'mikrobiyoloji_patoloji',s:90},{t:'soru_bankasi',d:'karma_temel_bilimler',s:30},{t:'srs_tekrar',d:'karma_temel_bilimler',s:30}],
  [{t:'soru_bankasi',d:'karma_temel_bilimler',s:90},{t:'zayif_nokta_tekrar',d:'karma_temel_bilimler',s:60}],
  [{t:'haftalik_deneme',d:'karma_temel_bilimler',s:120},{t:'hata_analizi',d:'karma_temel_bilimler',s:30}],
  [{t:'srs_tekrar',d:'karma_temel_bilimler',s:60},{t:'planlama',d:'genel',s:30}],
]

const P2_DAYS = [
  [{t:'yeni_konu',d:'Z',s:70},{t:'yeni_konu',d:'TB',s:50},{t:'soru_bankasi',d:'karma',s:30}],
  [{t:'srs_tekrar_soru',d:'G',s:60},{t:'yeni_konu',d:'Z',s:60},{t:'soru_bankasi',d:'karma',s:30}],
  [{t:'yeni_konu',d:'TB',s:70},{t:'yeni_konu',d:'Z',s:50},{t:'soru_bankasi',d:'karma',s:30}],
  [{t:'srs_tekrar_soru',d:'G',s:60},{t:'yeni_konu',d:'Z',s:60},{t:'soru_bankasi',d:'karma',s:30}],
  [{t:'soru_bankasi',d:'Z',s:80},{t:'soru_bankasi',d:'G',s:70}],
  [{t:'haftalik_deneme',d:'karma_genel',s:150},{t:'hata_analizi',d:'genel',s:30}],
  [{t:'srs_tekrar',d:'karma_genel',s:60},{t:'planlama',d:'genel',s:30}],
]

const P3_DAYS = [
  [{t:'ileri_konu_vaka',d:'A',s:60},{t:'karma_soru',d:'temel_bilimler',s:60},{t:'hata_defteri_tekrar',d:'genel',s:30}],
  [{t:'vaka_soru_seti',d:'GC',s:60},{t:'ileri_konu_vaka',d:'B',s:60},{t:'hata_defteri_tekrar',d:'genel',s:30}],
  [{t:'karma_soru',d:'temel_bilimler',s:70},{t:'ileri_konu_vaka',d:'A',s:50},{t:'hata_defteri_tekrar',d:'genel',s:30}],
  [{t:'vaka_soru_seti',d:'GC',s:60},{t:'ileri_konu_vaka',d:'B',s:60},{t:'hata_defteri_tekrar',d:'genel',s:30}],
  [{t:'karma_soru',d:'tum_dersler',s:150}],
  [{t:'tam_deneme',d:'tum_dersler',s:150},{t:'deneme_analizi',d:'genel',s:60}],
  [{t:'deneme_hata_tekrari',d:'genel',s:60},{t:'srs_tekrar',d:'tum_dersler',s:30}],
]

const P4_DAYS = [
  [{t:'karma_soru',d:'temel_bilimler',s:120,l:'Sabah — TB özet + karma soru'},{t:'ileri_konu_vaka',d:'karma_genel',s:120,l:'Öğleden sonra — Klinik dersler, hata defteri'},{t:'soru_bankasi',d:'karma_genel',s:90,l:'Akşam — Soru bankası'}],
  [{t:'karma_soru',d:'temel_bilimler',s:120,l:'Sabah — TB özet + karma soru'},{t:'ileri_konu_vaka',d:'karma_genel',s:120,l:'Öğleden sonra — Klinik dersler, hata defteri'},{t:'soru_bankasi',d:'karma_genel',s:90,l:'Akşam — Soru bankası'}],
  [{t:'karma_soru',d:'temel_bilimler',s:120,l:'Sabah — TB özet + karma soru'},{t:'tam_deneme',d:'tum_dersler',s:150,l:'Öğleden sonra — Tam deneme (120s)'},{t:'deneme_analizi',d:'genel',s:60,l:'Akşam — Deneme analizi'}],
  [{t:'karma_soru',d:'temel_bilimler',s:120,l:'Sabah — TB özet + karma soru'},{t:'ileri_konu_vaka',d:'karma_genel',s:120,l:'Öğleden sonra — Klinik dersler, hata defteri'},{t:'soru_bankasi',d:'karma_genel',s:90,l:'Akşam — Soru bankası'}],
  [{t:'karma_soru',d:'temel_bilimler',s:120,l:'Sabah — TB özet + karma soru'},{t:'ileri_konu_vaka',d:'karma_genel',s:120,l:'Öğleden sonra — Klinik dersler, hata defteri'},{t:'soru_bankasi',d:'karma_genel',s:90,l:'Akşam — Soru bankası'}],
  [{t:'tam_deneme',d:'tum_dersler',s:150,l:'Tam deneme (120s)'},{t:'deneme_analizi',d:'genel',s:60,l:'Deneme analizi'}],
  [{t:'deneme_hata_tekrari',d:'genel',s:60,l:'Deneme hata tekrarı'},{t:'srs_tekrar',d:'tum_dersler',s:30,l:'SRS tekrar — tüm dersler'}],
]

// ── Public API ───────────────────────────────────────────────────────────────

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

function resolveDers(code, phase, weekIdx) {
  if (phase === 2) {
    const row = P2_WEEKLY[Math.min(weekIdx, 21)]
    if (code === 'Z') return row.z
    if (code === 'G') return row.g
    if (code === 'TB') return TB_ILERI[weekIdx % 4]
  }
  if (phase === 3) {
    if (code === 'A')  return P3_ZAYIF[weekIdx % 7]
    if (code === 'B')  return P3_ZAYIF[(weekIdx + 1) % 7]
    if (code === 'GC') return P3_GUCLU[weekIdx % 6]
  }
  return code
}

function blockText(b, phase, weekIdx) {
  const icon = ICONS[b.t] || '•'
  const resolvedDers = resolveDers(b.d, phase, weekIdx)
  const dersName = DERS[resolvedDers] || resolvedDers
  const typeLabel = TYPE_LABEL[b.t] || b.t
  const label = b.l || typeLabel
  return `${icon} ${dersName} (${b.s}dk) — ${label}`
}

export function getDayBlocks(date) {
  const d = floor(date)
  const info = getPhaseInfo(d)
  if (!info) return []

  const dayIndex = dow(d)
  const weekIdx  = info.weekNum - 1

  if (info.phase === 1) {
    return P1_DAYS[dayIndex].map(b => {
      const icon = ICONS[b.t] || '•'

      // Pzt-Per: yeni konu bloğu — o haftanın spesifik konusuyla
      if (b.t === 'yeni_konu' && dayIndex < 4) {
        const dersName = DERS[b.d] || b.d
        const topic = P1_TOPICS[b.d]?.[weekIdx] || ''
        return `${icon} ${dersName} (${b.s}dk) — ${topic}`
      }

      // Pzt-Per: ikincil bloklar — JSON aciklama birebir
      if (dayIndex < 4 && b.t === 'soru_bankasi') {
        return `${icon} (${b.s}dk) — O güne kadar işlenen TB konularından soru`
      }
      if (dayIndex < 4 && b.t === 'srs_tekrar') {
        return `${icon} (${b.s}dk) — Önceki haftaların flashcard tekrarı`
      }

      // Cuma
      if (dayIndex === 4 && b.t === 'soru_bankasi') {
        return `${icon} (${b.s}dk) — Haftanın 4 konusundan karma soru (Anatomi, Histoloji, Fizyoloji, Mikrobiyoloji)`
      }
      if (dayIndex === 4 && b.t === 'zayif_nokta_tekrar') {
        return `${icon} (${b.s}dk) — Cuma soru sonuçlarına göre en çok hata yaptığın konuya ekstra zaman ver`
      }

      // Cumartesi
      if (dayIndex === 5 && b.t === 'haftalik_deneme') {
        return `${icon} (${b.s}dk) — Haftalık deneme: 40-50 soru, o haftaya kadar işlenen TB konuları`
      }
      if (dayIndex === 5 && b.t === 'hata_analizi') {
        return `${icon} (${b.s}dk) — Hata analizi: hata defterine ekle`
      }

      // Pazar
      if (dayIndex === 6 && b.t === 'srs_tekrar') {
        return `${icon} (${b.s}dk) — SRS tekrar: tüm geçmiş konulardan flashcard — hafif gün ama sıfır değil`
      }
      if (dayIndex === 6 && b.t === 'planlama') {
        return `${icon} (${b.s}dk) — Haftalık planlama: kaç soru çözdüm, en çok nerede hata yaptım, gelecek hafta odak ne`
      }

      const dersName = DERS[b.d] || b.d
      return `${icon} ${dersName} (${b.s}dk) — ${TYPE_LABEL[b.t] || b.t}`
    })
  }

  if (info.phase === 2) {
    return P2_DAYS[dayIndex].map(b => blockText(b, 2, weekIdx))
  }

  if (info.phase === 3) {
    return P3_DAYS[dayIndex].map(b => blockText(b, 3, weekIdx))
  }

  if (info.phase === 4) {
    return P4_DAYS[dayIndex].map(b => {
      const icon = ICONS[b.t] || '•'
      return `${icon} ${b.s}dk — ${b.l}`
    })
  }

  return []
}

export function getWeekMonday(date) {
  const d = floor(date)
  d.setDate(d.getDate() - dow(d))
  return d
}

// [{date: 'YYYY-MM-DD', texts: string[]}] — haftalık todo listesi
export function generateWeekTodoList(mondayDate) {
  const result = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate)
    d.setDate(d.getDate() + i)
    const blocks = getDayBlocks(d)
    if (blocks.length > 0) {
      result.push({ date: toKey(d), texts: blocks })
    }
  }
  return result
}
