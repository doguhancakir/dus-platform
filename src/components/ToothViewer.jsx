import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

/* ─────────────────────────────────────────────
   FDI TOOTH DATA
───────────────────────────────────────────── */
const TOOTH_DATA = {
  '11': { name: 'Sağ Üst Santral Kesici',        type: 'Kesici',   roots: 1,     cusps: 0,     notes: 'En uzun üst anterior diş. Labial yüzde kalkınım çıkıntıları belirgin. Singulum ve marjinal sırtlar iyi gelişmiş.' },
  '12': { name: 'Sağ Üst Lateral Kesici',         type: 'Kesici',   roots: 1,     cusps: 0,     notes: 'Variasyonlar sık. Peg-shaped lateral anomalisi burada görülür. Palatinalda derin fossası olabilir (dens invaginatus riski).' },
  '13': { name: 'Sağ Üst Kanin',                  type: 'Kanin',    roots: 1,     cusps: 1,     notes: 'Ağızdaki en uzun köke sahip diş. Kök uzunluğu ~17 mm. Kanin yüksekliği (canine rise) en fazla burada.' },
  '14': { name: 'Sağ Üst 1. Premolar',            type: 'Premolar', roots: 2,     cusps: 2,     notes: 'Buccal ve palatal kökü var (en sık 2 köklü üst premolar). Buccal cusp daha uzun. Okluzal fossa dar.' },
  '15': { name: 'Sağ Üst 2. Premolar',            type: 'Premolar', roots: 1,     cusps: 2,     notes: "Çoğunlukla tek köklü. Buccal ve lingual kusplar eşit yükseklikte. Oklüzal yüzey 14'ten daha düzgün." },
  '16': { name: 'Sağ Üst 1. Molar',               type: 'Molar',    roots: 3,     cusps: 4,     notes: 'İlk çıkan daimi diş (6 yaş molari). 3 kök: MB, DB, Palatal. Carabelli tüberkülü burada görülür. MB kökünde 2 kanal sık (%60+).' },
  '17': { name: 'Sağ Üst 2. Molar',               type: 'Molar',    roots: 3,     cusps: 4,     notes: "16'ya benzer ama daha küçük. Kökler daha birbirine yakın ve distal eğimli. Carabelli tüberkülü genellikle yok." },
  '18': { name: 'Sağ Üst 3. Molar (Yirmilik)',    type: 'Molar',    roots: '1-4', cusps: '3-5', notes: 'En değişken diş. Gömülü kalma en sık burada. Kök sayısı ve şekli öngörülemez; füzyon sık.' },
  '21': { name: 'Sol Üst Santral Kesici',          type: 'Kesici',   roots: 1,     cusps: 0,     notes: '11 ile simetrik. Orta hat diastemi varlığında boyut farkı olabilir. Kronun mezial yüzü distalden daha düz.' },
  '22': { name: 'Sol Üst Lateral Kesici',          type: 'Kesici',   roots: 1,     cusps: 0,     notes: '12 ile simetrik. Peg-shaped, konik veya yokluğu (agenezi) en sık lateral kesicide görülür.' },
  '23': { name: 'Sol Üst Kanin',                   type: 'Kanin',    roots: 1,     cusps: 1,     notes: '13 ile simetrik. Palatinal yerleşimli impaksiyon üst kaninlerde sık. Fenestrasyon ve dehisans riski var.' },
  '24': { name: 'Sol Üst 1. Premolar',             type: 'Premolar', roots: 2,     cusps: 2,     notes: '14 ile simetrik. Ekstraksiyonda ortodonti planlamasında ilk tercih. Buccal kök daha uzun ve kalın.' },
  '25': { name: 'Sol Üst 2. Premolar',             type: 'Premolar', roots: 1,     cusps: 2,     notes: '15 ile simetrik. Oklüzal yüzey düzgün, santral fossa belirgin. Tek kökte 2 kanal nadiren görülür.' },
  '26': { name: 'Sol Üst 1. Molar',                type: 'Molar',    roots: 3,     cusps: 4,     notes: '16 ile simetrik. Üst sinüse en yakın molar. MB2 kanalı sık gözden kaçar.' },
  '27': { name: 'Sol Üst 2. Molar',                type: 'Molar',    roots: 3,     cusps: 4,     notes: '17 ile simetrik. Kökler tek füze olabilir. Erüpsiyon geç olduğundan kariyer daha az.' },
  '28': { name: 'Sol Üst 3. Molar (Yirmilik)',     type: 'Molar',    roots: '1-4', cusps: '3-5', notes: '18 ile simetrik. Tuberozite kırığı riski ekstraksiyonda en fazla burada. Perikoroneitis en sık.' },
  '31': { name: 'Sol Alt Santral Kesici',          type: 'Kesici',   roots: 1,     cusps: 0,     notes: 'Ağızdaki en küçük daimi diş. Labiolingal yönde ince, mesiodistal yönde geniş. İki kanal bulunabilir.' },
  '32': { name: 'Sol Alt Lateral Kesici',          type: 'Kesici',   roots: 1,     cusps: 0,     notes: "31'den biraz büyük. Kök distale eğimli. Nadiren 2 kanal." },
  '33': { name: 'Sol Alt Kanin',                   type: 'Kanin',    roots: 1,     cusps: 1,     notes: 'Üst kaninlerden daha düz ve ince. Kök genellikle tek. Linguale doğru tilt sık.' },
  '34': { name: 'Sol Alt 1. Premolar',             type: 'Premolar', roots: 1,     cusps: 2,     notes: 'Alt premolarların en karmaşığı. Buccal cusp çok daha uzun (fonksiyonel cusp). Transvers sırt belirgin.' },
  '35': { name: 'Sol Alt 2. Premolar',             type: 'Premolar', roots: 1,     cusps: '2-3', notes: 'Daha simetrik kusplar. Y-tipi veya H-tipi oklüzal patern. 3 kusplu varyasyon (trifid) görülebilir.' },
  '36': { name: 'Sol Alt 1. Molar',                type: 'Molar',    roots: 2,     cusps: 5,     notes: "Alt çenede 2 kök (mesial-distal). 5 cusp. Mesial kökte 2 kanal neredeyse kesin. DUS'ta en sık sorulan molar." },
  '37': { name: 'Sol Alt 2. Molar',                type: 'Molar',    roots: 2,     cusps: 4,     notes: "36'ya benzer. 4 cusp (Dryopithecus paterni). Distal cusp sık yoktur. Kökler daha yakın." },
  '38': { name: 'Sol Alt 3. Molar (Yirmilik)',     type: 'Molar',    roots: '1-3', cusps: '4-5', notes: "Alt gömük dişlerin %90'ı burada. Mesioangular impaksiyon en sık. 7. sinir hasarı riski." },
  '41': { name: 'Sağ Alt Santral Kesici',          type: 'Kesici',   roots: 1,     cusps: 0,     notes: "31 ile neredeyse aynı. Ağzın en küçük daimi dişi. Linguale tilt sık, çapraşıklık burada başlar." },
  '42': { name: 'Sağ Alt Lateral Kesici',          type: 'Kesici',   roots: 1,     cusps: 0,     notes: "32 ile simetrik. 31'den geniş, 33'ten dar. Kök distale eğimli." },
  '43': { name: 'Sağ Alt Kanin',                   type: 'Kanin',    roots: 1,     cusps: 1,     notes: '33 ile simetrik. Uzun kök, tek kanal. Çenelerde en stabil pozisyonu olan diş.' },
  '44': { name: 'Sağ Alt 1. Premolar',             type: 'Premolar', roots: 1,     cusps: 2,     notes: '34 ile simetrik. Buccal cusp dominant. Transvers sırt mesial ve distal fossa ayırır.' },
  '45': { name: 'Sağ Alt 2. Premolar',             type: 'Premolar', roots: 1,     cusps: '2-3', notes: '35 ile simetrik. Oklüzal morfolojisi en çok varyasyon gösteren premolar.' },
  '46': { name: 'Sağ Alt 1. Molar',                type: 'Molar',    roots: 2,     cusps: 5,     notes: "36 ile simetrik. DUS'ta en sık sorulan dişlerden biri. Mesial kökte 2 kanal (MB+ML)." },
  '47': { name: 'Sağ Alt 2. Molar',                type: 'Molar',    roots: 2,     cusps: 4,     notes: '37 ile simetrik. C-şekilli kök kanalı varyasyonu alt 2. molarlarda görülebilir.' },
  '48': { name: 'Sağ Alt 3. Molar (Yirmilik)',     type: 'Molar',    roots: '1-3', cusps: '4-5', notes: "38 ile simetrik. İmpaksiyon sınıflandırması: Winter, Pell & Gregory." },
}

const TYPE_COLOR = {
  Kesici:   '#0891b2',
  Kanin:    '#f0c040',
  Premolar: '#10b981',
  Molar:    '#ff6600',
}

/* ── Mesh name → FDI ── */
function meshNameToFDI(name = '') {
  const m = name.match(/([UuLl][LlRr])([1-8])/i)
  if (!m) return null
  const quad = m[1].toUpperCase()
  const n    = Number(m[2])
  if (quad === 'LL') return String(30 + n)
  if (quad === 'UL') return String(20 + n)
  if (quad === 'UR') return String(10 + n)
  if (quad === 'LR') return String(40 + n)
  return null
}

function getFDI(obj) {
  let cur = obj
  while (cur) {
    const fdi = meshNameToFDI(cur.name)
    if (fdi && TOOTH_DATA[fdi]) return fdi
    cur = cur.parent
  }
  return null
}

/* ─────────────────────────────────────────────
   TOOTH POPUP — P5 design
───────────────────────────────────────────── */
function ToothPopup({ id, tooth, accentColor, viewerX, viewerY, onClose }) {
  const onRight  = viewerX < 0.6
  const onBottom = viewerY < 0.6
  const posStyle = {
    position: 'absolute', zIndex: 30,
    ...(onRight  ? { left:  '8px' } : { right:  '8px' }),
    ...(onBottom ? { bottom: '8px' } : { top: '8px' }),
    maxWidth: 'min(320px, 90%)', width: 300,
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: onRight ? -12 : 12, y: onBottom ? 12 : -12 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={posStyle}
    >
      <div style={{
        background: 'rgba(6,10,22,0.97)',
        border: `1px solid ${accentColor}35`,
        borderLeft: `3px solid ${accentColor}`,
        backdropFilter: 'blur(8px)',
        clipPath: 'polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%)',
      }}>
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: `1px solid ${accentColor}18`, background: `${accentColor}08` }}>
          <div className="flex items-baseline gap-3">
            <span className="font-bebas leading-none" style={{ fontSize: '2.4rem', color: accentColor, letterSpacing: '0.05em' }}>{id}</span>
            <div>
              <div className="font-barlow font-bold text-[10px] uppercase tracking-[0.2em]" style={{ color: accentColor }}>FDI Notasyonu</div>
              <div className="text-white text-sm font-semibold leading-tight mt-0.5">{tooth.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors mt-0.5 flex-shrink-0"><X size={13} /></button>
        </div>

        <div className="grid grid-cols-3 text-center" style={{ borderBottom: `1px solid ${accentColor}12`, gap: '1px', background: `${accentColor}08` }}>
          {[{ label: 'TİP', value: tooth.type }, { label: 'KÖK', value: tooth.roots }, { label: 'CUSP', value: tooth.cusps }].map(s => (
            <div key={s.label} className="px-3 py-2.5" style={{ background: '#060a16' }}>
              <div className="font-bebas leading-none" style={{ fontSize: '1.15rem', color: accentColor }}>{s.value}</div>
              <div className="font-barlow font-bold uppercase tracking-wider mt-0.5" style={{ fontSize: '9px', color: '#2a3a50' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3">
          <p className="font-barlow font-bold text-[10px] uppercase tracking-[0.18em] mb-1.5" style={{ color: '#2a3a50' }}>Klinik Not</p>
          <p className="text-gray-400 text-[12px] leading-relaxed">{tooth.notes}</p>
        </div>

        <div className="px-4 pb-3 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 flex-shrink-0" style={{ background: accentColor, clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)' }} />
          <span className="font-barlow font-bold text-[10px] uppercase tracking-[0.18em]" style={{ color: `${accentColor}80` }}>{tooth.type} · Daimi Dişlenme</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   MAIN EXPORT — plain Three.js, no R3F
───────────────────────────────────────────── */
export default function ToothViewer() {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const [loaded,   setLoaded]   = useState(false)
  const [selected, setSelected] = useState(null)

  const tooth       = selected ? TOOTH_DATA[selected.id] : null
  const accentColor = tooth ? (TYPE_COLOR[tooth.type] || '#0891b2') : '#0891b2'

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x0a1628)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    /* ── Scene ── */
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1628)
    sceneRef.current = scene

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(0, 2, 18)

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xfff8f0, 1.4)
    key.position.set(4, 8, 6)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xb0d4e8, 0.35)
    fill.position.set(-6, 2, -3)
    scene.add(fill)
    const rim = new THREE.PointLight(0x0891b2, 0.5)
    rim.position.set(0, -6, 4)
    scene.add(rim)

    /* ── OrbitControls ── */
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan    = false
    controls.enableZoom   = true
    controls.minDistance  = 7
    controls.maxDistance  = 28
    controls.minPolarAngle = Math.PI * 0.15
    controls.maxPolarAngle = Math.PI * 0.85
    controls.update()

    /* ── FBX Load ── */
    const mgr = new THREE.LoadingManager()
    mgr.setURLModifier((url) => {
      // Don't redirect the main FBX file
      if (/\.fbx$/i.test(url)) return url
      // Redirect texture files (tif/tiff → local jpg)
      if (/\.tiff?$/i.test(url) || /^[A-Za-z]:[\\/]/.test(url)) {
        const file = url.split(/[/\\]/).pop().replace(/\.tiff?$/i, '.jpg')
        return `/teeth/textures/${file}`
      }
      return url
    })
    const loader = new FBXLoader(mgr)
    let model = null

    loader.load(
      '/teeth/source/All_Teeth.fbx',
      (fbx) => {
        /* Center + normalize scale */
        const box    = new THREE.Box3().setFromObject(fbx)
        const size   = new THREE.Vector3(); box.getSize(size)
        const center = new THREE.Vector3(); box.getCenter(center)
        const scale  = 9 / Math.max(size.x, size.y, size.z)
        fbx.scale.setScalar(scale)
        fbx.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

        /* Fix untextured meshes → fully replace material with ivory */
        const ivoryMat = new THREE.MeshPhongMaterial({
          color: 0xd4c4a0,
          shininess: 55,
          specular: new THREE.Color(0x333322),
        })
        fbx.traverse(child => {
          if (!child.isMesh) return
          if (Array.isArray(child.material)) {
            child.material = child.material.map(m => {
              if (m.map) { m.map.colorSpace = THREE.SRGBColorSpace; return m }
              return ivoryMat
            })
          } else {
            if (child.material.map) {
              child.material.map.colorSpace = THREE.SRGBColorSpace
            } else {
              child.material = ivoryMat
            }
          }
        })

        scene.add(fbx)
        model = fbx
        setLoaded(true)
      },
      undefined,
      (err) => {
        console.error('FBX load error:', err)
        setLoaded(true) // hide loader even on error
      },
    )

    /* ── Raycaster (click detection) ── */
    const raycaster = new THREE.Raycaster()
    const mouse     = new THREE.Vector2()

    function onCanvasClick(e) {
      const rect = container.getBoundingClientRect()
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const meshes = []
      scene.traverse(obj => { if (obj.isMesh) meshes.push(obj) })
      const hits = raycaster.intersectObjects(meshes)

      if (hits.length === 0) {
        setSelected(null)
        return
      }

      const fdi = getFDI(hits[0].object)
      if (fdi) {
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top)  / rect.height
        setSelected({ id: fdi, x, y })
      } else {
        setSelected(null)
      }
    }

    renderer.domElement.addEventListener('click', onCanvasClick)

    /* ── Resize observer ── */
    const ro = new ResizeObserver(() => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    })
    ro.observe(container)

    /* ── Animation loop ── */
    let rafId
    function animate() {
      rafId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      renderer.domElement.removeEventListener('click', onCanvasClick)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      if (model) scene.remove(model)
    }
  }, [])

  return (
    <div className="relative w-full h-full" style={{ minHeight: 420 }}>

      {/* Three.js canvas mount point */}
      <div ref={mountRef} className="w-full h-full" style={{ minHeight: 420, background: '#0a1628' }} />

      {/* Loading overlay */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5"
            style={{ background: '#0a1628', pointerEvents: 'none' }}
          >
            <div className="absolute top-0 right-0" style={{ width: '40%', height: '40%', background: 'rgba(8,145,178,0.04)', clipPath: 'polygon(100% 0,100% 100%,0 0)' }} />
            <div className="relative w-40 h-[2px]" style={{ background: '#1a2d45' }}>
              <motion.div
                className="absolute inset-y-0 left-0 w-full bg-[#0891b2]"
                animate={{ scaleX: [0, 1, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] }}
                style={{ transformOrigin: 'left' }}
              />
            </div>
            <p className="font-barlow font-bold text-[#0891b2] tracking-[0.28em] text-[10px] uppercase">
              3D Model Yükleniyor
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <AnimatePresence>
        {loaded && !selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-3 left-3 pointer-events-none"
          >
            <span className="font-barlow font-bold text-[10px] tracking-[0.2em] uppercase px-2.5 py-1.5"
              style={{ color: '#0891b2', background: 'rgba(6,16,30,0.85)', border: '1px solid rgba(8,145,178,0.25)' }}>
              ◈ Dişe tıkla · Döndür
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FDI Popup */}
      <AnimatePresence>
        {tooth && selected && (
          <ToothPopup
            key={selected.id}
            id={selected.id}
            tooth={tooth}
            accentColor={accentColor}
            viewerX={selected.x}
            viewerY={selected.y}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
