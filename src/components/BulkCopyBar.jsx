import { useState } from 'react'
import { Copy, Check, Share2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { downloadTextFile, toFileSlug } from '../lib/questionText'

// Telefonda pano / yapıştırılan uygulama uzun metni kesebiliyor. Metin uzunsa
// soru sınırlarından bölünmüş parçalar halinde kopyalatılır.
const PART_LIMIT = 12000

function splitParts(texts) {
  const parts = []
  let cur = [], len = 0, start = 0
  texts.forEach((t, i) => {
    if (cur.length && len + t.length + 2 > PART_LIMIT) {
      parts.push({ text: cur.join('\n\n'), from: start + 1, to: i })
      cur = []; len = 0; start = i
    }
    cur.push(t); len += t.length + 2
  })
  if (cur.length) parts.push({ text: cur.join('\n\n'), from: start + 1, to: texts.length })
  return parts
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // eski tarayıcılar için yedek yöntem
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }
}

export default function BulkCopyBar({ texts, title, color = '#0891b2', buttonLabel = 'Hepsini Kopyala' }) {
  const [copied, setCopied] = useState(() => new Set())
  const full = texts.join('\n\n')
  const parts = splitParts(texts)
  const filename = `${toFileSlug(title)}.txt`

  async function copy(text, key, msg) {
    if (await writeClipboard(text)) {
      setCopied(prev => new Set(prev).add(key))
      toast.success(msg)
    } else toast.error('Kopyalanamadı — .txt indir')
  }

  async function share() {
    try {
      const file = new File([full], filename, { type: 'text/plain' })
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title })
      else await navigator.share({ title, text: full })
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('Paylaşılamadı')
    }
  }

  const btn = 'flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-md transition-colors'

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        <button
          onClick={() => copy(full, 'all', `${texts.length} soru kopyalandı`)}
          className={btn}
          style={{ color: '#fff', background: color }}
        >
          {copied.has('all') ? <Check size={13} /> : <Copy size={13} />}
          {buttonLabel}
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button onClick={share} className={btn} style={{ color: '#c8d0dc', border: '1px solid #2a3a50' }} title="Telefonun paylaş menüsüyle .txt olarak gönder">
            <Share2 size={13} /> Paylaş
          </button>
        )}
        <button onClick={() => downloadTextFile(filename, full)} className={btn} style={{ color: '#c8d0dc', border: '1px solid #2a3a50' }} title=".txt olarak indir">
          <Download size={13} /> .txt
        </button>
      </div>
      {parts.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className="text-[11px]" style={{ color: '#6b7a8f' }}>Telefonda yarısı geliyorsa parça parça kopyala:</span>
          {parts.map((p, i) => (
            <button
              key={i}
              onClick={() => copy(p.text, i, `Parça ${i + 1}/${parts.length} kopyalandı (soru ${p.from}–${p.to})`)}
              className={btn}
              style={copied.has(i)
                ? { color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.5)', background: 'rgba(16,185,129,0.08)' }
                : { color: '#c8d0dc', border: '1px solid #2a3a50' }}
              title={`Soru ${p.from}–${p.to}`}
            >
              {copied.has(i) ? <Check size={12} /> : <Copy size={12} />}
              {i + 1}/{parts.length}
              <span style={{ opacity: 0.6 }}>({p.from}–{p.to})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
