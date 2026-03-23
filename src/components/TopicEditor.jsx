import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Save, Eye, Code2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '../lib/supabase'

export default function TopicEditor({ topic, onClose, onSaved }) {
  const [content, setContent] = useState(topic.content || '')
  const [tab, setTab] = useState('edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from('topics')
        .update({ content })
        .eq('id', topic.id)
      if (err) throw err
      onSaved(content)
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#0a0a0a' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 h-14 flex-shrink-0 relative"
        style={{ borderBottom: '1px solid #1a1a1a', background: '#0a0a0a' }}
      >
        {/* Left red accent */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ff1744]" />

        <div className="flex items-center gap-2 pl-3">
          <button
            onClick={() => setTab('edit')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: tab === 'edit' ? 'rgba(255,23,68,0.1)' : 'transparent',
              color: tab === 'edit' ? '#ff1744' : '#555',
              border: `1px solid ${tab === 'edit' ? 'rgba(255,23,68,0.25)' : 'transparent'}`,
            }}
          >
            <Code2 size={14} />
            Düzenle
          </button>
          <button
            onClick={() => setTab('preview')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: tab === 'preview' ? 'rgba(255,23,68,0.1)' : 'transparent',
              color: tab === 'preview' ? '#ff1744' : '#555',
              border: `1px solid ${tab === 'preview' ? 'rgba(255,23,68,0.25)' : 'transparent'}`,
            }}
          >
            <Eye size={14} />
            Önizleme
          </button>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <span className="text-[#ff6b6b] text-xs hidden sm:block uppercase tracking-wider">{error}</span>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-bebas tracking-widest text-white
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: '#ff1744' }}
          >
            <Save size={14} />
            {saving ? 'KAYDEDİLİYOR…' : 'KAYDET'}
          </motion.button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-600 hover:text-gray-200 transition-colors"
            style={{ background: '#111', border: '1px solid #1a1a1a' }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Topic title strip */}
      <div
        className="px-5 sm:px-7 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid #111', background: '#080808' }}
      >
        <p className="text-[9px] text-gray-700 uppercase tracking-[0.2em] mb-0.5">Düzenleniyor</p>
        <h2 className="text-gray-400 font-medium text-sm truncate">{topic.title}</h2>
      </div>

      {/* Error banner (mobile) */}
      {error && (
        <div
          className="sm:hidden px-4 py-2 text-[#ff6b6b] text-xs uppercase tracking-wider"
          style={{ background: 'rgba(255,23,68,0.08)', borderBottom: '1px solid rgba(255,23,68,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Editor / Preview */}
      <div className="flex-1 overflow-hidden">
        {tab === 'edit' ? (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full h-full bg-transparent text-gray-300 text-sm font-mono p-4 sm:p-6
              resize-none outline-none leading-relaxed placeholder-gray-700"
            placeholder="Markdown içerik girin…"
            spellCheck={false}
            autoFocus
          />
        ) : (
          <div className="h-full overflow-y-auto p-4 sm:p-8">
            {content ? (
              <div className="markdown-content max-w-3xl mx-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-700 text-xs uppercase tracking-wider">İçerik yok.</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
