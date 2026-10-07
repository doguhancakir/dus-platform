import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Copy, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { questionsToText, downloadTextFile, toFileSlug } from '../lib/questionText'

export default function QuestionsTextModal({ topic, onClose }) {
  const [text, setText] = useState('')
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase.from('questions').select('*').eq('topic_id', topic.id).order('id')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) toast.error('Sorular yüklenemedi')
        setText(questionsToText(data || []))
        setCount(data?.length || 0)
        setLoading(false)
      })
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { cancelled = true; window.removeEventListener('keydown', onKey) }
  }, [topic.id])

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${count} soru kopyalandı`)
    } catch {
      toast.error('Kopyalanamadı — .txt olarak indir')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(4,8,18,0.92)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-3xl flex flex-col"
        style={{ background: '#0d1e35', border: '1px solid #1e3050', borderLeft: '3px solid #0891b2', maxHeight: '92vh' }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: '1px solid #1a2d45' }}>
          <div className="min-w-0">
            <p className="font-bebas text-white tracking-widest text-lg leading-none truncate">{topic.title}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
              {loading ? 'yükleniyor…' : `${count} soru · doğru şık ✓ ile işaretli`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white flex-shrink-0" style={{ border: '1px solid #1e3555' }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
          <button className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2" onClick={copyAll} disabled={loading || !count}>
            <Copy size={14} />
            Tümünü Kopyala
          </button>
          <button
            className="btn-ghost flex items-center gap-1.5 text-sm px-4 py-2"
            disabled={loading || !count}
            onClick={() => downloadTextFile(`${toFileSlug(topic.title)}.txt`, text)}
          >
            <Download size={14} />
            .txt İndir
          </button>
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">telefonda kopyalama yarıda kesilirse .txt indir</span>
        </div>

        <div className="px-4 pb-4 flex-1 min-h-0 flex">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-[#0891b2]" />
            </div>
          ) : (
            <textarea
              readOnly
              className="input font-mono text-xs resize-none w-full flex-1"
              style={{ minHeight: 360 }}
              value={text}
              onFocus={e => e.target.select()}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
