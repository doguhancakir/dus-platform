import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit3, Save, X, Loader2, Upload, FileText, Image } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { BRANCHES } from '../lib/data'
import Layout from '../components/Layout'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

export default function AdminPage() {
  const { user } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [adminPw, setAdminPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [activeTab, setActiveTab] = useState('topics')

  if (!user?.is_admin && !unlocked) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-6 py-16">
          <div style={{ background: '#0d1e35', border: '1px solid #1e3050', borderLeft: '3px solid #0891b2', padding: '2rem' }}>
            <h2 className="font-bebas text-2xl text-white tracking-widest mb-2">ADMİN PANELİ</h2>
            <p className="text-gray-600 text-xs uppercase tracking-wider mb-6">Erişim için şifre girin</p>
            <input
              className="input mb-3"
              type="password"
              placeholder="Admin şifresi"
              value={adminPw}
              onChange={e => setAdminPw(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (adminPw === ADMIN_PASSWORD) setUnlocked(true)
                  else setPwError('Hatalı şifre')
                }
              }}
            />
            {pwError && <p className="text-[#0891b2] text-xs mb-3 uppercase tracking-wider">{pwError}</p>}
            <button
              className="btn-primary w-full font-bebas tracking-widest"
              onClick={() => {
                if (adminPw === ADMIN_PASSWORD) setUnlocked(true)
                else setPwError('Hatalı şifre')
              }}
            >
              GİRİŞ
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-8 pb-20">
        <div className="mb-6 relative pl-4">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2]" />
          <h1 className="font-bebas text-3xl text-white tracking-widest">ADMİN PANELİ</h1>
          <p className="text-gray-600 text-[10px] uppercase tracking-widest mt-0.5">İçerik yönetimi</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center mb-6" style={{ borderBottom: '2px solid #1a2d45' }}>
          {[
            { id: 'topics', label: 'KONULAR' },
            { id: 'questions', label: 'SORULAR' },
            { id: 'branches', label: 'BRANŞLAR' },
            { id: 'import', label: 'İÇE AKTAR' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="font-bebas tracking-[0.12em] px-5 py-2.5 text-sm transition-all duration-150 relative"
              style={{
                color: activeTab === tab.id ? '#0891b2' : '#555',
                borderBottom: activeTab === tab.id ? '2px solid #0891b2' : '2px solid transparent',
                marginBottom: -2,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'topics' && <TopicsTab key="topics" />}
          {activeTab === 'questions' && <QuestionsTab key="questions" />}
          {activeTab === 'branches' && <BranchesTab key="branches" />}
          {activeTab === 'import' && <ImportTab key="import" />}
        </AnimatePresence>
      </div>
    </Layout>
  )
}

/* ── TOPICS TAB ── */
function TopicsTab() {
  const [topics, setTopics] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(1)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', sort_order: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadTopics() }, [selectedBranch])

  async function loadTopics() {
    setLoading(true)
    const { data } = await supabase
      .from('topics')
      .select('*')
      .eq('branch_id', selectedBranch)
      .order('sort_order')
    setTopics(data || [])
    setLoading(false)
  }

  async function saveTopic() {
    if (!form.title.trim()) return
    setSaving(true)
    if (editingId) {
      await supabase.from('topics').update({
        title: form.title,
        content: form.content,
        sort_order: parseInt(form.sort_order) || 0,
      }).eq('id', editingId)
    } else {
      await supabase.from('topics').insert({
        branch_id: selectedBranch,
        title: form.title,
        content: form.content,
        sort_order: parseInt(form.sort_order) || topics.length,
      })
    }
    setSaving(false)
    setEditingId(null)
    setShowNew(false)
    setForm({ title: '', content: '', sort_order: 0 })
    loadTopics()
  }

  async function deleteTopic(id) {
    if (!confirm('Bu konuyu silmek istiyor musunuz?')) return
    await supabase.from('topics').delete().eq('id', id)
    loadTopics()
  }

  function startEdit(topic) {
    setEditingId(topic.id)
    setForm({ title: topic.title, content: topic.content || '', sort_order: topic.sort_order })
    setShowNew(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          className="input w-auto"
          value={selectedBranch}
          onChange={e => setSelectedBranch(Number(e.target.value))}
        >
          {BRANCHES.map(b => (
            <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
          ))}
        </select>
        <button
          className="btn-primary flex items-center gap-1.5 text-sm"
          onClick={() => { setShowNew(true); setEditingId(null); setForm({ title: '', content: '', sort_order: topics.length }) }}
        >
          <Plus size={15} />
          Yeni Konu
        </button>
      </div>

      <AnimatePresence>
        {(showNew || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-3" style={{ background: '#0d1e35', border: '1px solid #1e3050', borderLeft: '3px solid #0891b2' }}>
              <div className="flex items-center justify-between">
                <h3 className="font-bebas tracking-widest text-white">{editingId ? 'KONUYU DÜZENLE' : 'YENİ KONU'}</h3>
                <button onClick={() => { setEditingId(null); setShowNew(false) }} className="text-gray-600 hover:text-gray-300">
                  <X size={16} />
                </button>
              </div>
              <input className="input" placeholder="Konu başlığı" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <input className="input" type="number" placeholder="Sıralama" value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
              <textarea className="input min-h-[200px] font-mono text-xs resize-y" placeholder="İçerik (Markdown)..."
                value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              <div className="flex gap-2">
                <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={saveTopic}
                  disabled={saving || !form.title.trim()}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Kaydet
                </button>
                <button className="btn-ghost text-sm" onClick={() => { setEditingId(null); setShowNew(false) }}>İptal</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-[#0891b2]" />
        </div>
      ) : topics.length === 0 ? (
        <div className="p-8 text-center text-gray-600 text-xs uppercase tracking-widest" style={{ background: '#0d1e35', border: '1px solid #1a2d45' }}>
          Bu branşta henüz konu yok.
        </div>
      ) : (
        <div className="space-y-[2px]">
          {topics.map(topic => (
            <div key={topic.id} className="flex items-center justify-between gap-3 p-4"
              style={{ background: '#0d1e35', border: '1px solid #1a2d45' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{topic.title}</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">Sıra: {topic.sort_order}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => startEdit(topic)}
                  className="p-2 text-gray-600 hover:text-gray-300 transition-colors"
                  style={{ background: '#0a1628', border: '1px solid #1a2d45' }}>
                  <Edit3 size={13} />
                </button>
                <button onClick={() => deleteTopic(topic.id)}
                  className="p-2 text-gray-600 hover:text-[#0891b2] transition-colors"
                  style={{ background: '#0a1628', border: '1px solid #1a2d45' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ── QUESTIONS TAB ── */
function QuestionsTab() {
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    question_text: '',
    options: ['', '', '', '', ''],
    correct_answer: 0,
    explanation: '',
  })

  useEffect(() => {
    supabase.from('topics').select('id, title, branch_id').order('branch_id').order('sort_order')
      .then(({ data }) => setTopics(data || []))
  }, [])

  useEffect(() => {
    if (selectedTopic) loadQuestions()
  }, [selectedTopic])

  async function loadQuestions() {
    setLoading(true)
    const { data } = await supabase.from('questions').select('*').eq('topic_id', selectedTopic).order('id')
    setQuestions(data || [])
    setLoading(false)
  }

  async function saveQuestion() {
    if (!form.question_text.trim() || !selectedTopic) return
    setSaving(true)
    const payload = {
      topic_id: parseInt(selectedTopic),
      question_text: form.question_text,
      options: form.options.filter(o => o.trim()),
      correct_answer: parseInt(form.correct_answer),
      explanation: form.explanation,
    }
    if (editingId) {
      await supabase.from('questions').update(payload).eq('id', editingId)
    } else {
      await supabase.from('questions').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    resetForm()
    loadQuestions()
  }

  function resetForm() {
    setForm({ question_text: '', options: ['', '', '', '', ''], correct_answer: 0, explanation: '' })
  }

  async function deleteQuestion(id) {
    if (!confirm('Bu soruyu silmek istiyor musunuz?')) return
    await supabase.from('questions').delete().eq('id', id)
    loadQuestions()
  }

  function startEdit(q) {
    setEditingId(q.id)
    setForm({
      question_text: q.question_text,
      options: [...(q.options || []), '', '', '', '', ''].slice(0, 5),
      correct_answer: q.correct_answer || 0,
      explanation: q.explanation || '',
    })
    setShowForm(true)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select className="input w-auto flex-1 max-w-sm" value={selectedTopic}
          onChange={e => setSelectedTopic(e.target.value)}>
          <option value="">Konu seçin...</option>
          {BRANCHES.map(branch => (
            <optgroup key={branch.id} label={`${branch.icon} ${branch.name}`}>
              {topics.filter(t => t.branch_id === branch.id).map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedTopic && (
          <button className="btn-primary flex items-center gap-1.5 text-sm"
            onClick={() => { setShowForm(true); setEditingId(null); resetForm() }}>
            <Plus size={15} />
            Yeni Soru
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-5 space-y-4" style={{ background: '#0d1e35', border: '1px solid #1e3050', borderLeft: '3px solid #0891b2' }}>
              <div className="flex items-center justify-between">
                <h3 className="font-bebas tracking-widest text-white">{editingId ? 'SORUYU DÜZENLE' : 'YENİ SORU'}</h3>
                <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-gray-600 hover:text-gray-300"><X size={16} /></button>
              </div>
              <textarea className="input min-h-[100px] resize-y" placeholder="Soru metni..."
                value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} />
              <div className="space-y-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">Şıklar (doğru şıkkı işaretle)</p>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={form.correct_answer === i}
                      onChange={() => setForm(f => ({ ...f, correct_answer: i }))}
                      className="accent-[#0891b2]" />
                    <span className="text-xs text-gray-600 w-5">{String.fromCharCode(65 + i)}.</span>
                    <input className="input text-sm" placeholder={`${String.fromCharCode(65 + i)} şıkkı`}
                      value={opt} onChange={e => {
                        const opts = [...form.options]
                        opts[i] = e.target.value
                        setForm(f => ({ ...f, options: opts }))
                      }} />
                  </div>
                ))}
              </div>
              <textarea className="input resize-y" placeholder="Açıklama (opsiyonel)..."
                value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} />
              <div className="flex gap-2">
                <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={saveQuestion}
                  disabled={saving || !form.question_text.trim()}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Kaydet
                </button>
                <button className="btn-ghost text-sm" onClick={() => { setShowForm(false); setEditingId(null) }}>İptal</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedTopic && (
        loading ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[#0891b2]" /></div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-xs uppercase tracking-widest" style={{ background: '#0d1e35', border: '1px solid #1a2d45' }}>
            Bu konuda henüz soru yok.
          </div>
        ) : (
          <div className="space-y-[2px]">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4" style={{ background: '#0d1e35', border: '1px solid #1a2d45' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-700 mb-1 uppercase tracking-wider">#{idx + 1}</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{q.question_text}</p>
                    {q.options?.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {q.options.map((opt, i) => (
                          <p key={i} className={`text-xs ${i === q.correct_answer ? 'text-emerald-400 font-medium' : 'text-gray-600'}`}>
                            {String.fromCharCode(65 + i)}. {opt}{i === q.correct_answer && ' ✓'}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => startEdit(q)} className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors"
                      style={{ background: '#0a1628', border: '1px solid #1a2d45' }}><Edit3 size={13} /></button>
                    <button onClick={() => deleteQuestion(q.id)} className="p-1.5 text-gray-600 hover:text-[#0891b2] transition-colors"
                      style={{ background: '#0a1628', border: '1px solid #1a2d45' }}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </motion.div>
  )
}

/* ── BRANCHES TAB (image URLs) ── */
function BranchesTab() {
  const [images, setImages] = useState({})
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})

  useEffect(() => {
    supabase.from('branch_images').select('branch_id, image_url').then(({ data }) => {
      if (data) {
        const map = {}
        data.forEach(r => { map[r.branch_id] = r.image_url || '' })
        setImages(map)
      }
    })
  }, [])

  async function saveImage(branchId) {
    setSaving(s => ({ ...s, [branchId]: true }))
    await supabase.from('branch_images').upsert({
      branch_id: branchId,
      image_url: images[branchId] || null,
    })
    setSaving(s => ({ ...s, [branchId]: false }))
    setSaved(s => ({ ...s, [branchId]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [branchId]: false })), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="p-4 text-xs text-gray-600 uppercase tracking-wider"
        style={{ background: '#111', borderLeft: '3px solid #0891b2', border: '1px solid #1a1a1a' }}>
        Her branş için bir arka plan görseli URL'si girebilirsiniz. Boş bırakırsanız varsayılan gradient kullanılır.
      </div>

      {BRANCHES.map(branch => (
        <div key={branch.id} className="p-4 flex items-center gap-4"
          style={{ background: '#0d1e35', border: '1px solid #1a2d45' }}>
          <div className="flex-shrink-0">
            <span className="text-xl">{branch.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-300 mb-2">{branch.name}</p>
            <input
              className="input text-sm"
              type="url"
              placeholder="https://... (görsel URL)"
              value={images[branch.id] || ''}
              onChange={e => setImages(prev => ({ ...prev, [branch.id]: e.target.value }))}
            />
          </div>
          <button
            onClick={() => saveImage(branch.id)}
            disabled={saving[branch.id]}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50"
            style={{
              background: saved[branch.id] ? '#166534' : '#0891b2',
              color: 'white',
              border: 'none',
            }}
          >
            {saving[branch.id] ? (
              <Loader2 size={13} className="animate-spin" />
            ) : saved[branch.id] ? (
              '✓ Kaydedildi'
            ) : (
              <>
                <Save size={13} />
                Kaydet
              </>
            )}
          </button>
        </div>
      ))}
    </motion.div>
  )
}

/* ── IMPORT TAB ── */
function ImportTab() {
  const [jsonText, setJsonText] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const exampleJson = JSON.stringify([
    {
      "topic_id": 1,
      "question_text": "Örnek soru metni",
      "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
      "correct_answer": 0,
      "explanation": "Açıklama metni"
    }
  ], null, 2)

  async function handleImport() {
    setImporting(true)
    setResult(null)
    try {
      const data = JSON.parse(jsonText)
      if (!Array.isArray(data)) throw new Error('JSON array olmalı')
      const { data: inserted, error } = await supabase.from('questions').insert(data).select()
      if (error) throw error
      setResult({ success: true, count: inserted.length })
    } catch (err) {
      setResult({ success: false, message: err.message })
    }
    setImporting(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="p-5 space-y-4" style={{ background: '#0d1e35', border: '1px solid #1a2d45', borderLeft: '3px solid #0891b2' }}>
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[#0891b2]" />
          <h3 className="font-bebas tracking-widest text-white">JSON İLE TOPLU SORU İÇE AKTARMA</h3>
        </div>
        <p className="text-[10px] text-gray-600 uppercase tracking-wider">
          Sorular aşağıdaki formatta JSON olarak yapıştırın:
        </p>
        <pre className="text-xs p-3 text-gray-500 overflow-x-auto"
          style={{ background: '#0a1628', border: '1px solid #1a2d45', fontFamily: 'monospace' }}>
          {exampleJson}
        </pre>
        <textarea className="input min-h-[200px] font-mono text-xs resize-y" placeholder="JSON verisi buraya yapıştırın..."
          value={jsonText} onChange={e => setJsonText(e.target.value)} />
        {result && (
          <div className={`text-xs px-3 py-2 uppercase tracking-wider ${result.success ? 'text-emerald-400' : 'text-[#ff6b6b]'}`}
            style={{
              background: result.success ? 'rgba(16,185,129,0.08)' : 'rgba(8,145,178,0.08)',
              borderLeft: `3px solid ${result.success ? '#22c55e' : '#0891b2'}`,
            }}>
            {result.success ? `✓ ${result.count} soru başarıyla içe aktarıldı!` : `Hata: ${result.message}`}
          </div>
        )}
        <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={handleImport}
          disabled={importing || !jsonText.trim()}>
          {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          İçe Aktar
        </button>
      </div>
    </motion.div>
  )
}
