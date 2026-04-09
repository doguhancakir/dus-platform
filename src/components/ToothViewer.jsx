import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus } from 'lucide-react'
import { SKETCHFAB_MODEL_UID, SKETCHFAB_API_VERSION } from '../lib/config'

/* ─────────────────────────────────────────────
   FDI TOOTH DATA (tam 32 diş)
───────────────────────────────────────────── */
const TOOTH_DATA = {
  // ── Üst Sağ (1. Quadrant) ──────────────────
  '11': { name: 'Sağ Üst Santral Kesici', type: 'Kesici', roots: 1, cusps: 0, notes: 'En uzun üst anterior diş. Labial yüzde kalkınım çıkıntıları belirgin. Singulum ve marjinal sırtlar iyi gelişmiş.' },
  '12': { name: 'Sağ Üst Lateral Kesici', type: 'Kesici', roots: 1, cusps: 0, notes: 'Variasyonlar sık. Peg-shaped lateral anomalisi burada görülür. Palatinalda derin fossası olabilir (dens invaginatus riski).' },
  '13': { name: 'Sağ Üst Kanin', type: 'Kanin', roots: 1, cusps: 1, notes: 'Ağızdaki en uzun köke sahip diş. Kök uzunluğu ~17 mm. Kanin yüksekliği (canine rise) en fazla burada.' },
  '14': { name: 'Sağ Üst 1. Premolar', type: 'Premolar', roots: 2, cusps: 2, notes: 'Buccal ve palatal kökü var (en sık 2 köklü üst premolar). Buccal cusp daha uzun. Okluzal fossa dar.' },
  '15': { name: 'Sağ Üst 2. Premolar', type: 'Premolar', roots: 1, cusps: 2, notes: 'Çoğunlukla tek köklü. Buccal ve lingual kusplar eşit yükseklikte. Oklüzal yüzey 14\'ten daha düzgün.' },
  '16': { name: 'Sağ Üst 1. Molar', type: 'Molar', roots: 3, cusps: 4, notes: 'İlk çıkan daimi diş (6 yaş molari). 3 kök: MB (mesiobuccal), DB, Palatal. Carabelli tüberkülü burada görülür. MB kökünde 2 kanal sık (%60+).' },
  '17': { name: 'Sağ Üst 2. Molar', type: 'Molar', roots: 3, cusps: 4, notes: '16\'ya benzer ama daha küçük. Kökler daha birbirine yakın ve distal eğimli. Carabelli tüberkülü genellikle yok.' },
  '18': { name: 'Sağ Üst 3. Molar (Yirmilik)', type: 'Molar', roots: '1-4', cusps: '3-5', notes: 'En değişken diş. Gömülü kalma en sık burada. Kök sayısı ve şekli öngörülemez; füzyon sık. DUS\'ta en sık "extracted" seçenek.' },

  // ── Üst Sol (2. Quadrant) ──────────────────
  '21': { name: 'Sol Üst Santral Kesici', type: 'Kesici', roots: 1, cusps: 0, notes: '11 ile simetrik. Orta hat diastemi varlığında boyut farkı olabilir. Kronun mezial yüzü distalden daha düz.' },
  '22': { name: 'Sol Üst Lateral Kesici', type: 'Kesici', roots: 1, cusps: 0, notes: '12 ile simetrik. Peg-shaped, konik veya yokluğu (agenezi) en sık lateral kesicide görülür.' },
  '23': { name: 'Sol Üst Kanin', type: 'Kanin', roots: 1, cusps: 1, notes: '13 ile simetrik. Palatinal yerleşimli impaksiyon üst kaninlerde sık. Fenestrasyon ve dehisans riski var.' },
  '24': { name: 'Sol Üst 1. Premolar', type: 'Premolar', roots: 2, cusps: 2, notes: '14 ile simetrik. Ekstraksiyonda ortodonti planlamasında ilk tercih. Buccal kök daha uzun ve kalın.' },
  '25': { name: 'Sol Üst 2. Premolar', type: 'Premolar', roots: 1, cusps: 2, notes: '15 ile simetrik. Oklüzal yüzey düzgün, santral fossa belirgin. Tek kökte 2 kanal nadiren görülür.' },
  '26': { name: 'Sol Üst 1. Molar', type: 'Molar', roots: 3, cusps: 4, notes: '16 ile simetrik. Üst sinüse en yakın molar. Sinüs kaldırma operasyonlarında sınırı belirler. MB2 kanalı sık gözden kaçar.' },
  '27': { name: 'Sol Üst 2. Molar', type: 'Molar', roots: 3, cusps: 4, notes: '17 ile simetrik. Kökler tek füze olabilir. Erüpsiyon geç olduğundan DU\'larda daha az kariyer.' },
  '28': { name: 'Sol Üst 3. Molar (Yirmilik)', type: 'Molar', roots: '1-4', cusps: '3-5', notes: '18 ile simetrik. Tuberozite kırığı riski ekstraksiyonda en fazla burada. Perikoroneitis en sık.' },

  // ── Alt Sol (3. Quadrant) ──────────────────
  '31': { name: 'Sol Alt Santral Kesici', type: 'Kesici', roots: 1, cusps: 0, notes: 'Ağızdaki en küçük daimi diş. Labiolingal yönde ince, mesiodistal yönde geniş. İki kanal bulunabilir (labial+lingual).' },
  '32': { name: 'Sol Alt Lateral Kesici', type: 'Kesici', roots: 1, cusps: 0, notes: '31\'den biraz büyük. Kök distale eğimli. Nadiren 2 kanal.' },
  '33': { name: 'Sol Alt Kanin', type: 'Kanin', roots: 1, cusps: 1, notes: 'Üst kaninlerden daha düz ve ince. Kök genellikle tek. Linguale doğru tilt sık.' },
  '34': { name: 'Sol Alt 1. Premolar', type: 'Premolar', roots: 1, cusps: 2, notes: 'Alt premolarların en karmaşığı. Buccal cusp çok daha uzun (fonksiyonel cusp). Transvers sırt belirgin.' },
  '35': { name: 'Sol Alt 2. Premolar', type: 'Premolar', roots: 1, cusps: '2-3', notes: 'Daha simetrik kusplar. Y-tipi veya H-tipi oklüzal patern. 3 kusplu varyasyon (trifid) görülebilir.' },
  '36': { name: 'Sol Alt 1. Molar', type: 'Molar', roots: 2, cusps: 5, notes: 'Alt çenede 2 kök (mesial-distal). 5 cusp: 3 buccal (MB, DB, distal), 2 lingual. Mesial kökte 2 kanal neredeyse kesin. DUS\'ta en sık sorulan molar.' },
  '37': { name: 'Sol Alt 2. Molar', type: 'Molar', roots: 2, cusps: 4, notes: '36\'ya benzer. 4 cusp (Dryopithecus paterni). Distal cusp sık yoktur. Kökler daha yakın.' },
  '38': { name: 'Sol Alt 3. Molar (Yirmilik)', type: 'Molar', roots: '1-3', cusps: '4-5', notes: 'Alt gömük dişlerin %90\'ı burada. Mesioangular impaksiyon en sık. 7. sinir hasarı riski ekstraksiyonda.' },

  // ── Alt Sağ (4. Quadrant) ──────────────────
  '41': { name: 'Sağ Alt Santral Kesici', type: 'Kesici', roots: 1, cusps: 0, notes: '31 ile neredeyse aynı. Ağzın en küçük daimi dişi. Linguale tilt sık, çapraşıklık burada başlar.' },
  '42': { name: 'Sağ Alt Lateral Kesici', type: 'Kesici', roots: 1, cusps: 0, notes: '32 ile simetrik. 31\'den geniş, 33\'ten dar. Kök distale eğimli.' },
  '43': { name: 'Sağ Alt Kanin', type: 'Kanin', roots: 1, cusps: 1, notes: '33 ile simetrik. Uzun kök, tek kanal. Çenelerde en stabil pozisyonu olan diş.' },
  '44': { name: 'Sağ Alt 1. Premolar', type: 'Premolar', roots: 1, cusps: 2, notes: '34 ile simetrik. Buccal cusp dominant. Transvers sırt mesial ve distal fossa ayırır.' },
  '45': { name: 'Sağ Alt 2. Premolar', type: 'Premolar', roots: 1, cusps: '2-3', notes: '35 ile simetrik. Oklüzal morfolojisi en çok varyasyon gösteren premolar.' },
  '46': { name: 'Sağ Alt 1. Molar', type: 'Molar', roots: 2, cusps: 5, notes: '36 ile simetrik. DUS\'ta en sık sorulan dişlerden biri. Mesial kökte 2 kanal (MB+ML). Distal kökte genellikle 1 geniş kanal.' },
  '47': { name: 'Sağ Alt 2. Molar', type: 'Molar', roots: 2, cusps: 4, notes: '37 ile simetrik. C-şekilli kök kanalı varyasyonu alt 2. molarlarda görülebilir.' },
  '48': { name: 'Sağ Alt 3. Molar (Yirmilik)', type: 'Molar', roots: '1-3', cusps: '4-5', notes: '38 ile simetrik. İmpaksiyon sınıflandırması: Winter (mesioangular, distoangular, vertikal, horizontal), Pell & Gregory.' },
}

/* tip → renk */
const TYPE_COLOR = {
  Kesici:  '#0891b2',
  Kanin:   '#f0c040',
  Premolar:'#10b981',
  Molar:   '#ff6600',
}

/* Sketchfab mesh adından FDI numarası çıkar */
function extractFDI(name = '') {
  // "Tooth_16", "tooth16", "Upper_Right_First_Molar_16" gibi formatlar
  const direct = name.match(/\b([1-4][1-8])\b/)
  if (direct && TOOTH_DATA[direct[1]]) return direct[1]

  // Sayısal token
  const nums = name.match(/\d+/g) || []
  for (const n of nums) {
    if (TOOTH_DATA[n]) return n
  }

  return null
}

/* ─────────────────────────────────────────────
   TOOTH VIEWER
───────────────────────────────────────────── */
export default function ToothViewer() {
  const iframeRef  = useRef(null)
  const apiRef     = useRef(null)
  const [loading, setLoading] = useState(true)
  const [apiReady, setApiReady] = useState(false)
  const [selectedTooth, setSelectedTooth] = useState(null) // { id, x, y }

  const handleClick = useCallback((info) => {
    if (info.instanceID == null) { setSelectedTooth(null); return }

    const meshName  = info.material?.name || ''
    const toothId   = extractFDI(meshName)

    if (toothId) {
      // info.position2D: [0-1, 0-1] relative to viewer
      const x = info.position2D?.[0] ?? 0.5
      const y = info.position2D?.[1] ?? 0.5
      setSelectedTooth({ id: toothId, x, y })
    } else {
      // Tıklama var ama diş tanınamadı → popupu kapat
      setSelectedTooth(null)
    }
  }, [])

  function initViewer() {
    const iframe = iframeRef.current
    if (!iframe || !window.Sketchfab) return

    const client = new window.Sketchfab(iframe)
    client.init(SKETCHFAB_MODEL_UID, {
      success(api) {
        apiRef.current = api
        api.start()
        api.addEventListener('viewerready', () => {
          setLoading(false)
          setApiReady(true)
          api.addEventListener('click', handleClick)
        })
      },
      error() {
        console.error('Sketchfab init failed')
        setLoading(false)
      },
      ui_controls:       0,
      ui_infos:          0,
      ui_watermark:      0,
      ui_watermark_link: 0,
      autostart:         1,
      camera:            0,
      transparent:       0,
    })
  }

  useEffect(() => {
    const SCRIPT_ID = 'sketchfab-viewer-api'
    if (document.getElementById(SCRIPT_ID)) {
      // Already loaded
      initViewer()
      return
    }
    const script = document.createElement('script')
    script.id  = SCRIPT_ID
    script.src = `https://static.sketchfab.com/api/sketchfab-viewer-${SKETCHFAB_API_VERSION}.js`
    script.onload = initViewer
    document.head.appendChild(script)
  }, [])

  const tooth = selectedTooth ? TOOTH_DATA[selectedTooth.id] : null
  const accentColor = tooth ? (TYPE_COLOR[tooth.type] || '#0891b2') : '#0891b2'

  return (
    <div className="relative w-full h-full" style={{ minHeight: 420 }}>

      {/* ── Scan-line loading overlay ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5"
            style={{ background: '#06101e' }}
          >
            {/* Diagonal corner accent */}
            <div
              className="absolute top-0 right-0 pointer-events-none"
              style={{
                width: '40%', height: '40%',
                background: 'rgba(8,145,178,0.04)',
                clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
              }}
            />
            <div className="relative w-40 h-[2px]" style={{ background: '#1a2d45' }}>
              <motion.div
                className="absolute inset-y-0 left-0 w-full bg-[#0891b2]"
                animate={{ scaleX: [0, 1, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] }}
                style={{ transformOrigin: 'left' }}
              />
            </div>
            <p className="font-barlow font-bold text-[#0891b2] tracking-[0.25em] text-xs uppercase">
              3D MODEL YÜKLENİYOR
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Iframe ── */}
      <iframe
        ref={iframeRef}
        title="Permanent Dentition 3D"
        src={`https://sketchfab.com/models/${SKETCHFAB_MODEL_UID}/embed?api_version=${SKETCHFAB_API_VERSION}&ui_controls=0&ui_infos=0&ui_watermark=0&ui_watermark_link=0&autostart=1&transparent=0&camera=0`}
        className="w-full h-full border-0"
        style={{ minHeight: 420, display: 'block' }}
        allowFullScreen
        allow="autoplay; fullscreen; xr-spatial-tracking"
      />

      {/* ── Hint label (görünür API hazır olunca) ── */}
      <AnimatePresence>
        {apiReady && !selectedTooth && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="absolute bottom-3 left-3 pointer-events-none"
          >
            <span
              className="font-barlow font-bold text-[10px] tracking-[0.2em] uppercase px-2.5 py-1.5"
              style={{
                color: '#0891b2',
                background: 'rgba(6,16,30,0.88)',
                border: '1px solid rgba(8,145,178,0.25)',
                backdropFilter: 'blur(4px)',
              }}
            >
              ◈ Dişe tıkla
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tooth Popup ── */}
      <AnimatePresence>
        {tooth && selectedTooth && (
          <ToothPopup
            key={selectedTooth.id}
            id={selectedTooth.id}
            tooth={tooth}
            accentColor={accentColor}
            viewerX={selectedTooth.x}
            viewerY={selectedTooth.y}
            onClose={() => setSelectedTooth(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─────────────────────────────────────────────
   TOOTH POPUP — P5 design
───────────────────────────────────────────── */
function ToothPopup({ id, tooth, accentColor, viewerX, viewerY, onClose }) {
  // Popup'ı viewer boyutuna göre konumlandır (basit 4-quadrant logic)
  const onRight  = viewerX < 0.6
  const onBottom = viewerY < 0.6

  const posStyle = {
    position: 'absolute',
    zIndex: 30,
    ...(onRight  ? { left:  '8px' } : { right:  '8px' }),
    ...(onBottom ? { bottom: '8px' } : { top: '8px' }),
    maxWidth: 'min(320px, 90%)',
    width: 300,
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: onRight ? -12 : 12, y: onBottom ? 12 : -12 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={posStyle}
    >
      <div
        style={{
          background: 'rgba(6, 10, 22, 0.97)',
          border: `1px solid ${accentColor}35`,
          borderLeft: `3px solid ${accentColor}`,
          backdropFilter: 'blur(8px)',
          clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${accentColor}18`, background: `${accentColor}08` }}
        >
          <div className="flex items-baseline gap-3">
            {/* FDI number — big pop */}
            <span
              className="font-bebas leading-none"
              style={{ fontSize: '2.4rem', color: accentColor, letterSpacing: '0.05em' }}
            >
              {id}
            </span>
            <div>
              <div
                className="font-barlow font-bold text-[10px] uppercase tracking-[0.2em]"
                style={{ color: accentColor }}
              >
                FDI Notasyonu
              </div>
              <div className="text-white text-sm font-semibold leading-tight mt-0.5">
                {tooth.name}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors mt-0.5 flex-shrink-0"
          >
            <X size={13} />
          </button>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-3 text-center"
          style={{ borderBottom: `1px solid ${accentColor}12`, gap: '1px', background: `${accentColor}08` }}
        >
          {[
            { label: 'TİP',    value: tooth.type },
            { label: 'KÖK',    value: tooth.roots },
            { label: 'CUSP',   value: tooth.cusps },
          ].map(s => (
            <div key={s.label} className="px-3 py-2.5 relative" style={{ background: '#060a16' }}>
              <div
                className="font-bebas leading-none"
                style={{ fontSize: '1.15rem', color: accentColor }}
              >
                {s.value}
              </div>
              <div
                className="font-barlow font-bold uppercase tracking-wider mt-0.5"
                style={{ fontSize: '9px', color: '#2a3a50' }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="px-4 py-3">
          <p
            className="font-barlow font-bold text-[10px] uppercase tracking-[0.18em] mb-1.5"
            style={{ color: '#2a3a50' }}
          >
            Klinik Not
          </p>
          <p className="text-gray-400 text-[12px] leading-relaxed">
            {tooth.notes}
          </p>
        </div>

        {/* Type badge bottom */}
        <div
          className="px-4 pb-3 flex items-center gap-1.5"
        >
          <div
            className="w-1.5 h-1.5 flex-shrink-0"
            style={{ background: accentColor, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
          <span
            className="font-barlow font-bold text-[10px] uppercase tracking-[0.18em]"
            style={{ color: `${accentColor}80` }}
          >
            {tooth.type} · Daimi Dişlenme
          </span>
        </div>
      </div>
    </motion.div>
  )
}
