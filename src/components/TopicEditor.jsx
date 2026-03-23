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
      className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-[#1e1e1e] flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${tab === 'edit'
                ? 'bg-[#1e1e1e] text-gray-200 border border-[#2a2a2a]'
                : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Code2 size={14} />
            Düzenle
          </button>
          <button
            onClick={() => setTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${tab === 'preview'
                ? 'bg-[#1e1e1e] text-gray-200 border border-[#2a2a2a]'
                : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Eye size={14} />
            Önizleme
          </button>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <span className="text-red-400 text-xs hidden sm:block">{error}</span>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent text-white text-sm font-medium
              hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={14} />
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </motion.button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#1e1e1e] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Topic title strip */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-[#1e1e1e] bg-[#0f0f0f] flex-shrink-0">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-0.5">Düzenleniyor</p>
        <h2 className="text-gray-300 font-medium text-sm truncate">{topic.title}</h2>
      </div>

      {/* Error banner (mobile) */}
      {error && (
        <div className="sm:hidden px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Editor / Preview */}
      <div className="flex-1 overflow-hidden">
        {tab === 'edit' ? (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full h-full bg-transparent text-gray-200 text-sm font-mono p-4 sm:p-6
              resize-none outline-none leading-relaxed placeholder-gray-700"
            placeholder="Markdown içerik girin…"
            spellCheck={false}
            autoFocus
          />
        ) : (
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            {content ? (
              <div className="markdown-content max-w-3xl mx-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">İçerik yok.</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
