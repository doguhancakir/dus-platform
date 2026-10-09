import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit3, Save, X, Loader2, Upload, FileText, Copy, Download, KeyRound, UserPlus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { supabase, fetchAllRows } from '../lib/supabase'
import { BRANCHES, TEMEL_BILIMLER } from '../lib/data'
import { questionsToText, downloadTextFile, toFileSlug } from '../lib/questionText'
import { DEFAULT_STUDY_PROMPT } from '../lib/defaultStudyPrompt'
import { loadBooks, r2Url, formatSize, BOOK_CATEGORIES } from '../lib/books'

const ALL_BRANCHES = [...BRANCHES, ...TEMEL_BILIMLER].sort((a, b) => a.id - b.id)
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
        <div className="flex items-center mb-6 overflow-x-auto" style={{ borderBottom: '2px solid #1a2d45' }}>
          {[
            { id: 'topics', label: 'KONULAR & SORULAR' },
            { id: 'branches', label: 'BRANŞLAR' },
            { id: 'books', label: 'KİTAPLAR' },
            { id: 'users', label: 'KULLANICILAR' },
            { id: 'prompt', label: 'PROMPT' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="font-bebas tracking-[0.12em] px-5 py-2.5 text-sm transition-all duration-150 relative whitespace-nowrap"
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
          {activeTab === 'branches' && <BranchesTab key="branches" />}
          {activeTab === 'books' && <BooksTab key="books" />}
          {activeTab === 'users' && <UsersTab key="users" adminNickname={user?.nickname} />}
          {activeTab === 'prompt' && <PromptTab key="prompt" />}
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
  const [form, setForm] = useState({ title: '', sort_order: 0, json: '' })
  const [saving, setSaving] = useState(false)
  const [openTopicId, setOpenTopicId] = useState(null) // soruları açık olan konu
  const [questionCounts, setQuestionCounts] = useState({})

  useEffect(() => { loadTopics(); setOpenTopicId(null) }, [selectedBranch])

  async function loadTopics() {
    setLoading(true)
    const { data } = await supabase
      .from('topics')
      .select('*')
      .eq('branch_id', selectedBranch)
      .order('sort_order')
    setTopics(data || [])
    await refreshCounts((data || []).map(t => t.id))
    setLoading(false)
  }

  // Sadece soru sayılarını tazeler (listeyi yeniden yüklemez → açık panel kapanmaz)
  async function refreshCounts(ids = topics.map(t => t.id)) {
    if (!ids.length) { setQuestionCounts({}); return }
    let qs = []
    try { qs = await fetchAllRows(q => q.from('questions').select('topic_id').in('topic_id', ids)) } catch { /* sayılar boş kalır */ }
    const counts = {}
    ;(qs || []).forEach(q => { counts[q.topic_id] = (counts[q.topic_id] || 0) + 1 })
    setQuestionCounts(counts)
  }

  // JSON'u konu oluşturmadan ÖNCE doğrula → hatalı JSON'da boş konu açılmaz
  function parseQuestionsJson(text) {
    if (!text.trim()) return []
    const data = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('JSON bir dizi ([ ... ]) olmalı')
    data.forEach((q, i) => {
      if (!q?.question_text || !Array.isArray(q.options)) throw new Error(`${i + 1}. soruda question_text veya options eksik`)
    })
    return data
  }

  async function saveTopic() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase.from('topics').update({
          title: form.title.trim(),
          sort_order: parseInt(form.sort_order) || 0,
        }).eq('id', editingId)
        if (error) throw error
        toast.success('Konu güncellendi')
      } else {
        let questions
        try { questions = parseQuestionsJson(form.json) }
        catch (err) { toast.error(`JSON hatası: ${err.message}`); setSaving(false); return }
        const { data: topic, error } = await supabase.from('topics').insert({
          branch_id: selectedBranch,
          title: form.title.trim(),
          content: '',
          sort_order: parseInt(form.sort_order) || topics.length,
        }).select().single()
        if (error) throw error
        if (questions.length) {
          const { error: qErr } = await supabase.from('questions').insert(questions.map(q => ({ ...q, topic_id: topic.id })))
          if (qErr) {
            toast.error(`Konu açıldı ama sorular eklenemedi: ${qErr.message}`)
            setOpenTopicId(topic.id)
          } else toast.success(`"${topic.title}" açıldı, ${questions.length} soru eklendi`)
        } else toast.success(`"${topic.title}" açıldı`)
      }
      setEditingId(null)
      setShowNew(false)
      setForm({ title: '', sort_order: 0, json: '' })
      loadTopics()
    } catch (err) {
      toast.error(err.message || 'Kaydedilemedi')
    }
    setSaving(false)
  }

  async function deleteTopic(id) {
    if (!confirm('Bu konuyu silmek istiyor musunuz?')) return
    await supabase.from('topics').delete().eq('id', id)
    loadTopics()
  }

  function startEdit(topic) {
    setEditingId(topic.id)
    setForm({ title: topic.title, sort_order: topic.sort_order, json: '' })
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
          {ALL_BRANCHES.map(b => (
            <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
          ))}
        </select>
        <button
          className="btn-primary flex items-center gap-1.5 text-sm"
          onClick={() => { setShowNew(true); setEditingId(null); setForm({ title: '', sort_order: topics.length, json: '' }) }}
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
              {!editingId && (
                <>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                    Sorular (JSON, opsiyonel) — konu açılırken hepsi birlikte eklenir
                  </p>
                  <textarea className="input min-h-[220px] font-mono text-xs resize-y"
                    placeholder={'[\n  {\n    "question_text": "Soru metni",\n    "options": ["A", "B", "C", "D", "E"],\n    "correct_answer": 0,\n    "explanation": "Açıklama"\n  }\n]'}
                    value={form.json} onChange={e => setForm(f => ({ ...f, json: e.target.value }))} />
                </>
              )}
              <div className="flex gap-2">
                <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={saveTopic}
                  disabled={saving || !form.title.trim()}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {editingId ? 'Kaydet' : 'Konuyu Aç'}
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
            <div key={topic.id}>
            <div className="flex items-center justify-between gap-3 p-4 cursor-pointer"
              onClick={() => setOpenTopicId(openTopicId === topic.id ? null : topic.id)}
              style={{ background: openTopicId === topic.id ? '#10243f' : '#0d1e35', border: '1px solid #1a2d45' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{topic.title}</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">
                  Sıra: {topic.sort_order} · {questionCounts[topic.id] || 0} soru
                </p>
              </div>
              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                <button onClick={() => setOpenTopicId(openTopicId === topic.id ? null : topic.id)}
                  className="px-2.5 py-1.5 text-xs transition-colors"
                  style={{ color: openTopicId === topic.id ? '#fff' : '#8aa4c0', background: openTopicId === topic.id ? '#0891b2' : '#0a1628', border: '1px solid #1a2d45' }}>
                  Sorular
                </button>
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
            {openTopicId === topic.id && (
              <div className="p-3 sm:p-4 mb-2" style={{ background: '#081322', borderLeft: '3px solid #0891b2', borderRight: '1px solid #1a2d45', borderBottom: '1px solid #1a2d45' }}>
                <QuestionsTab fixedTopicId={topic.id} fixedTopicTitle={topic.title} onChanged={() => refreshCounts()} />
              </div>
            )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ── QUESTIONS TAB ── */
function QuestionsTab({ fixedTopicId, fixedTopicTitle, onChanged } = {}) {
  const [topics, setTopics] = useState(fixedTopicId ? [{ id: fixedTopicId, title: fixedTopicTitle }] : [])
  const [selectedTopic, setSelectedTopic] = useState(fixedTopicId ? String(fixedTopicId) : '')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showTextView, setShowTextView] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [form, setForm] = useState({
    question_text: '',
    options: ['', '', '', '', ''],
    correct_answer: 0,
    explanation: '',
  })

  useEffect(() => {
    if (fixedTopicId) return
    supabase.from('topics').select('id, title, branch_id').order('branch_id').order('sort_order')
      .then(({ data }) => setTopics(data || []))
  }, [])

  useEffect(() => {
    setShowTextView(false)
    if (selectedTopic) loadQuestions()
  }, [selectedTopic])

  async function loadQuestions() {
    setLoading(true)
    const { data } = await supabase.from('questions').select('*').eq('topic_id', selectedTopic).order('id')
    setQuestions(data || [])
    setLoading(false)
    onChanged?.()
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
        {!fixedTopicId && <select className="input w-auto flex-1 max-w-sm" value={selectedTopic}
          onChange={e => setSelectedTopic(e.target.value)}>
          <option value="">Konu seçin...</option>
          {ALL_BRANCHES.map(branch => (
            <optgroup key={branch.id} label={`${branch.icon} ${branch.name}`}>
              {topics.filter(t => t.branch_id === branch.id).map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </optgroup>
          ))}
        </select>}
        {selectedTopic && (
          <button className="btn-primary flex items-center gap-1.5 text-sm"
            onClick={() => { setShowForm(true); setEditingId(null); resetForm() }}>
            <Plus size={15} />
            Yeni Soru
          </button>
        )}
        {selectedTopic && (
          <button className="btn-ghost flex items-center gap-1.5 text-sm"
            onClick={() => setShowImport(v => !v)}>
            <Upload size={15} />
            {showImport ? 'İçe Aktarmayı Kapat' : 'JSON İçe Aktar'}
          </button>
        )}
        {selectedTopic && questions.length > 0 && (
          <button className="btn-ghost flex items-center gap-1.5 text-sm"
            onClick={() => setShowTextView(v => !v)}>
            <FileText size={15} />
            {showTextView ? 'Metin Görünümünü Kapat' : 'Tümünü Metin Olarak Gör'}
          </button>
        )}
      </div>

      {showImport && selectedTopic && (
        <JsonImportPanel
          key={selectedTopic}
          topicId={selectedTopic}
          topicTitle={topics.find(t => String(t.id) === String(selectedTopic))?.title}
          onImported={loadQuestions}
        />
      )}

      <AnimatePresence>
        {showTextView && selectedTopic && questions.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-4 space-y-3" style={{ background: '#0d1e35', border: '1px solid #1e3050', borderLeft: '3px solid #0891b2' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                  {questions.length} soru — telefonda kopyalama yarıda kesilirse dosya olarak indir
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(questionsToText(questions))
                        toast.success('Kopyalandı')
                      } catch {
                        toast.error('Kopyalanamadı')
                      }
                    }}
                  >
                    <Copy size={13} />
                    Tümünü Kopyala
                  </button>
                  <button
                    className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5"
                    onClick={() => {
                      const topicTitle = topics.find(t => String(t.id) === String(selectedTopic))?.title
                      downloadTextFile(`${toFileSlug(topicTitle)}.txt`, questionsToText(questions))
                    }}
                  >
                    <Download size={13} />
                    .txt Olarak İndir
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                className="input font-mono text-xs resize-y w-full"
                style={{ minHeight: 320 }}
                value={questionsToText(questions)}
                onFocus={e => e.target.select()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {ALL_BRANCHES.map(branch => (
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

/* ── JSON IMPORT (Sorular sekmesinin içinde, seçili konuya) ── */
function JsonImportPanel({ topicId, topicTitle, onImported }) {
  const [jsonText, setJsonText] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const exampleJson = JSON.stringify([
    {
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
      const withTopic = data.map(q => ({ ...q, topic_id: Number(topicId) }))
      const { data: inserted, error } = await supabase.from('questions').insert(withTopic).select()
      if (error) throw error
      setResult({ success: true, count: inserted.length })
      setJsonText('')
      onImported?.()
    } catch (err) {
      setResult({ success: false, message: err.message })
    }
    setImporting(false)
  }

  return (
    <div className="p-5 space-y-4" style={{ background: '#0d1e35', border: '1px solid #1a2d45', borderLeft: '3px solid #0891b2' }}>
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-[#0891b2]" />
        <h3 className="font-bebas tracking-widest text-white">JSON İLE TOPLU SORU EKLE{topicTitle ? ` → ${topicTitle}` : ''}</h3>
      </div>
      <p className="text-[10px] text-gray-600 uppercase tracking-wider">
        Sorular aşağıdaki formatta JSON olarak yapıştırın (seçili konuya eklenir):
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
  )
}

/* ── USERS TAB ── */
// Kullanıcı oluşturma / şifre değiştirme veritabanındaki admin fonksiyonlarıyla yapılır
// (supabase_migration_overhaul.sql). Dışarıdan kayıt kapalı kalır.
function rpcErrorMessage(error) {
  if (!error) return null
  if (error.code === 'PGRST202' || /could not find the function/i.test(error.message || '')) {
    return 'Veritabanı fonksiyonu yok — supabase_migration_overhaul.sql henüz çalıştırılmamış.'
  }
  return error.message || 'Bilinmeyen hata'
}

function UsersTab({ adminNickname }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminPassword, setAdminPassword] = useState(() => {
    try { return sessionStorage.getItem('dus_admin_pw') || '' } catch { return '' }
  })
  const [newNick, setNewNick] = useState('')
  const [newPw, setNewPw] = useState('')
  const [creating, setCreating] = useState(false)
  const [resetFor, setResetFor] = useState(null) // user id
  const [resetPw, setResetPw] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => { loadUsers() }, [])

  function rememberAdminPassword(v) {
    setAdminPassword(v)
    try { sessionStorage.setItem('dus_admin_pw', v) } catch { /* yoksay */ }
  }

  async function loadUsers() {
    setLoading(true)
    let { data, error } = await supabase.from('users').select('id, nickname, is_admin, created_at').order('created_at')
    if (error) {
      ;({ data, error } = await supabase.from('users').select('id, nickname, is_admin'))
    }
    if (error) toast.error('Kullanıcılar yüklenemedi')
    setUsers(data || [])
    setLoading(false)
  }

  async function createUser() {
    if (!adminPassword) { toast.error('Önce kendi admin şifreni gir'); return }
    if (newNick.trim().length < 2) { toast.error('Kullanıcı adı en az 2 karakter'); return }
    if (newPw.length < 4) { toast.error('Şifre en az 4 karakter'); return }
    setCreating(true)
    const { error } = await supabase.rpc('admin_create_user', {
      p_admin_nickname: adminNickname,
      p_admin_password: adminPassword,
      p_nickname: newNick.trim(),
      p_password: newPw,
    })
    setCreating(false)
    if (error) { toast.error(rpcErrorMessage(error)); return }
    toast.success(`${newNick.trim()} oluşturuldu`)
    setNewNick('')
    setNewPw('')
    loadUsers()
  }

  async function setPassword(u) {
    if (!adminPassword) { toast.error('Önce kendi admin şifreni gir'); return }
    if (resetPw.length < 4) { toast.error('Şifre en az 4 karakter'); return }
    setResetting(true)
    const { error } = await supabase.rpc('admin_set_password', {
      p_admin_nickname: adminNickname,
      p_admin_password: adminPassword,
      p_user_id: u.id,
      p_new_password: resetPw,
    })
    setResetting(false)
    if (error) { toast.error(rpcErrorMessage(error)); return }
    toast.success(`${u.nickname} şifresi değişti`)
    setResetFor(null)
    setResetPw('')
  }

  const box = { background: '#0d1e35', border: '1px solid #1a2d45' }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="p-4 space-y-2" style={{ ...box, borderLeft: '3px solid #f59e0b' }}>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
          <KeyRound size={12} /> Senin şifren ({adminNickname}) — işlemleri onaylamak için
        </p>
        <input
          className="input text-sm max-w-xs"
          type="password"
          autoComplete="current-password"
          placeholder="Kendi giriş şifren"
          value={adminPassword}
          onChange={e => rememberAdminPassword(e.target.value)}
        />
        <p className="text-[10px] text-gray-600">Sadece bu sekme açıkken tarayıcıda tutulur, hiçbir yere kaydedilmez.</p>
      </div>

      <div className="p-4 space-y-3" style={{ ...box, borderLeft: '3px solid #0891b2' }}>
        <h3 className="font-bebas tracking-widest text-white flex items-center gap-2"><UserPlus size={16} /> YENİ KULLANICI</h3>
        <div className="flex flex-wrap gap-2">
          <input className="input text-sm flex-1 min-w-[160px]" placeholder="Kullanıcı adı" autoComplete="off"
            value={newNick} onChange={e => setNewNick(e.target.value)} />
          <input className="input text-sm flex-1 min-w-[160px]" placeholder="Şifre (en az 4)" autoComplete="new-password"
            value={newPw} onChange={e => setNewPw(e.target.value)} />
          <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={createUser} disabled={creating}>
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Oluştur
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{users.length} kullanıcı</p>
        <button className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5" onClick={loadUsers}>
          <RefreshCw size={12} /> Yenile
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[#0891b2]" /></div>
      ) : (
        <div className="space-y-[2px]">
          {users.map(u => (
            <div key={u.id} className="p-3 sm:p-4" style={box}>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-medium">
                    {u.nickname}
                    {u.is_admin && <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5" style={{ color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }}>admin</span>}
                  </p>
                  {u.created_at && (
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {new Date(u.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <button
                  className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5"
                  onClick={() => { setResetFor(resetFor === u.id ? null : u.id); setResetPw('') }}
                >
                  <KeyRound size={12} /> Şifre Değiştir
                </button>
              </div>
              {resetFor === u.id && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <input className="input text-sm flex-1 min-w-[160px]" placeholder={`${u.nickname} için yeni şifre`}
                    autoComplete="new-password" value={resetPw} onChange={e => setResetPw(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') setPassword(u) }} />
                  <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={() => setPassword(u)} disabled={resetting}>
                    {resetting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Kaydet
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ── PROMPT TAB ── */
// Çalışma promptunun yedeği. app_settings tablosu yoksa varsayılan metin gösterilir (kopyalanabilir).
function PromptTab() {
  const [text, setText] = useState('')
  const [savedText, setSavedText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tableMissing, setTableMissing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    supabase.from('app_settings').select('value, updated_at').eq('key', 'study_prompt').maybeSingle()
      .then(({ data, error }) => {
        if (error) setTableMissing(true)
        const v = data?.value || DEFAULT_STUDY_PROMPT
        setText(v)
        setSavedText(data?.value || '')
        setUpdatedAt(data?.updated_at || null)
        setLoading(false)
      })
  }, [])

  async function save() {
    setSaving(true)
    const now = new Date().toISOString()
    const { error } = await supabase.from('app_settings').upsert({ key: 'study_prompt', value: text, updated_at: now })
    setSaving(false)
    if (error) {
      toast.error('Kaydedilemedi — supabase_migration_overhaul.sql çalıştırılmış mı?')
      return
    }
    setTableMissing(false)
    setSavedText(text)
    setUpdatedAt(now)
    toast.success('Prompt kaydedildi')
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Prompt kopyalandı')
    } catch {
      toast.error('Kopyalanamadı')
    }
  }

  const dirty = text !== savedText

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="p-4 space-y-3" style={{ background: '#0d1e35', border: '1px solid #1a2d45', borderLeft: '3px solid #0891b2' }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bebas tracking-widest text-white">ÇALIŞMA PROMPTU</h3>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">
              {tableMissing
                ? 'Veritabanı tablosu yok — SQL çalıştırılınca kaydedilebilir'
                : updatedAt
                  ? `Son kayıt: ${new Date(updatedAt).toLocaleString('tr-TR')}`
                  : 'Henüz kaydedilmedi'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5" onClick={copy} disabled={loading}>
              <Copy size={13} /> Kopyala
            </button>
            <button className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5" onClick={save} disabled={loading || saving || !dirty}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {dirty ? 'Kaydet' : 'Kayıtlı'}
            </button>
            <button className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5" disabled={loading}
              onClick={() => downloadTextFile('calisma-promptu.txt', text)}>
              <Download size={13} /> .txt
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-[#0891b2]" /></div>
        ) : (
          <textarea
            className="input font-mono text-xs resize-y w-full"
            style={{ minHeight: 480 }}
            value={text}
            onChange={e => setText(e.target.value)}
          />
        )}
      </div>
    </motion.div>
  )
}

/* ── BOOKS TAB ── */
// Kitap listesi (R2'deki dosyalar). Dosyanın kendisini silmek için rclone gerekir;
// burada sadece sitedeki kaydı düzenler/gizler/siler.
function BooksTab() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(true)
  const [filter, setFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { books, available } = await loadBooks({ includeHidden: true })
    setBooks(books)
    setAvailable(available)
    setLoading(false)
  }

  async function patch(id, changes) {
    setSavingId(id)
    const { error } = await supabase.from('books').update(changes).eq('id', id)
    setSavingId(null)
    if (error) { toast.error('Kaydedilemedi'); return false }
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b))
    return true
  }

  async function remove(b) {
    if (!confirm(`"${b.title}" siteden kaldırılsın mı?\n(R2'deki dosya silinmez.)`)) return
    const { error } = await supabase.from('books').delete().eq('id', b.id)
    if (error) { toast.error('Silinemedi'); return }
    setBooks(prev => prev.filter(x => x.id !== b.id))
    toast.success('Kaldırıldı')
  }

  const q = filter.trim().toLocaleLowerCase('tr-TR')
  const shown = books.filter(b => {
    if (branchFilter === 'hidden' && !b.hidden) return false
    if (branchFilter === 'karma' && b.branch_id !== null) return false
    if (!['all', 'hidden', 'karma'].includes(branchFilter) && b.branch_id !== Number(branchFilter)) return false
    if (q && !b.title.toLocaleLowerCase('tr-TR').includes(q) && !b.file_key.toLocaleLowerCase('tr-TR').includes(q)) return false
    return true
  })

  if (!loading && !available) {
    return (
      <div className="p-4 text-xs uppercase tracking-wider" style={{ background: '#0d1e35', borderLeft: '3px solid #f0c040', color: '#f0c040' }}>
        Kitap tablosu yok — supabase_migration_books.sql çalıştırılmalı.
      </div>
    )
  }

  const selectStyle = { background: '#0a1628', border: '1px solid #1a2d45', color: '#e2e8f0', padding: '0.35rem 0.5rem', fontSize: '0.75rem' }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <input className="input text-sm flex-1 min-w-[180px] max-w-sm" placeholder="Kitap ara…" value={filter} onChange={e => setFilter(e.target.value)} />
        <select style={selectStyle} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
          <option value="all">Tüm branşlar</option>
          {ALL_BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          <option value="karma">Karma</option>
          <option value="hidden">Sadece gizliler</option>
        </select>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">{shown.length} / {books.length} kitap</span>
      </div>
      <p className="text-[11px] text-gray-600">
        Ad, branş ve tür değişikliği anında kaydedilir. "Gizle" kitabı sitede göstermez. Dosyayı R2'den tamamen silmek için bana söyle.
      </p>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[#0891b2]" /></div>
      ) : (
        <div className="space-y-[2px]">
          {shown.map(b => (
            <div key={b.id} className="p-3 flex gap-3 items-start" style={{ background: '#0d1e35', border: '1px solid #1a2d45', opacity: b.hidden ? 0.5 : 1 }}>
              <a href={r2Url(b.file_key)} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                {b.cover_key
                  ? <img src={r2Url(b.cover_key)} alt="" loading="lazy" style={{ width: 48, height: 64, objectFit: 'cover', border: '1px solid #1a2d45' }} />
                  : <div style={{ width: 48, height: 64, background: '#0a1628', border: '1px solid #1a2d45' }} />}
              </a>
              <div className="flex-1 min-w-0 space-y-1.5">
                <input
                  className="input text-sm py-1"
                  defaultValue={b.title}
                  onBlur={e => { const v = e.target.value.trim(); if (v && v !== b.title) patch(b.id, { title: v }).then(ok => ok && toast.success('Ad kaydedildi')) }}
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <select style={selectStyle} value={b.branch_id ?? 'karma'}
                    onChange={e => patch(b.id, { branch_id: e.target.value === 'karma' ? null : Number(e.target.value) })}>
                    {ALL_BRANCHES.map(br => <option key={br.id} value={br.id}>{br.name}</option>)}
                    <option value="karma">Karma</option>
                  </select>
                  <select style={selectStyle} value={b.category} onChange={e => patch(b.id, { category: e.target.value })}>
                    {BOOK_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <span className="text-[10px] text-gray-600">{formatSize(b.size_bytes)}</span>
                  {savingId === b.id && <Loader2 size={12} className="animate-spin text-[#0891b2]" />}
                </div>
                <p className="text-[10px] text-gray-700 truncate" title={b.file_key}>{b.file_key}</p>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button className="btn-ghost text-xs px-2.5 py-1" onClick={() => patch(b.id, { hidden: !b.hidden })}>
                  {b.hidden ? 'Göster' : 'Gizle'}
                </button>
                <button className="text-xs px-2.5 py-1" style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }} onClick={() => remove(b)}>
                  <Trash2 size={12} className="inline" /> Kaldır
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
