import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronRight, Loader2, Upload, FileText } from 'lucide-react'
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
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-100 mb-2">Admin Paneli</h2>
            <p className="text-gray-500 text-sm mb-6">Erişim için şifre girin</p>
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
            {pwError && <p className="text-red-400 text-sm mb-3">{pwError}</p>}
            <button
              className="btn-primary w-full"
              onClick={() => {
                if (adminPw === ADMIN_PASSWORD) setUnlocked(true)
                else setPwError('Hatalı şifre')
              }}
            >
              Giriş
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-100">Admin Paneli</h1>
          <p className="text-gray-500 text-sm mt-0.5">İçerik yönetimi</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] rounded-xl mb-6 w-fit">
          {['topics', 'questions', 'import'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab
                  ? 'bg-[#2a2a2a] text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'topics' ? 'Konular' : tab === 'questions' ? 'Sorular' : 'İçe Aktar'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'topics' && <TopicsTab key="topics" />}
          {activeTab === 'questions' && <QuestionsTab key="questions" />}
          {activeTab === 'import' && <ImportTab key="import" />}
        </AnimatePresence>
      </div>
    </Layout>
  )
}

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
      {/* Branch Select */}
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
          <span>Yeni Konu</span>
        </button>
      </div>

      {/* New / Edit Form */}
      <AnimatePresence>
        {(showNew || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">
                {editingId ? 'Konuyu Düzenle' : 'Yeni Konu'}
              </h3>
              <button onClick={() => { setEditingId(null); setShowNew(false) }} className="text-gray-600 hover:text-gray-400">
                <X size={16} />
              </button>
            </div>
            <input
              className="input"
              placeholder="Konu başlığı"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <input
              className="input"
              type="number"
              placeholder="Sıralama"
              value={form.sort_order}
              onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
            />
            <textarea
              className="input min-h-[200px] font-mono text-xs resize-y"
              placeholder="İçerik (Markdown formatında)..."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            />
            <div className="flex gap-2">
              <button
                className="btn-primary flex items-center gap-1.5 text-sm"
                onClick={saveTopic}
                disabled={saving || !form.title.trim()}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Kaydet</span>
              </button>
              <button
                className="btn-ghost text-sm"
                onClick={() => { setEditingId(null); setShowNew(false) }}
              >
                İptal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topics List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-600" />
        </div>
      ) : topics.length === 0 ? (
        <div className="card p-8 text-center text-gray-500 text-sm">Bu branşta henüz konu yok.</div>
      ) : (
        <div className="space-y-2">
          {topics.map(topic => (
            <div key={topic.id} className="card p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{topic.title}</p>
                <p className="text-xs text-gray-600">Sıra: {topic.sort_order}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => startEdit(topic)} className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2a] transition-colors">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => deleteTopic(topic.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

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
        <select
          className="input w-auto flex-1 max-w-sm"
          value={selectedTopic}
          onChange={e => setSelectedTopic(e.target.value)}
        >
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
          <button
            className="btn-primary flex items-center gap-1.5 text-sm"
            onClick={() => { setShowForm(true); setEditingId(null); resetForm() }}
          >
            <Plus size={15} />
            <span>Yeni Soru</span>
          </button>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">{editingId ? 'Soruyu Düzenle' : 'Yeni Soru'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-gray-600 hover:text-gray-400">
                <X size={16} />
              </button>
            </div>

            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Soru metni..."
              value={form.question_text}
              onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
            />

            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Şıklar (doğru şıkkı işaretle)</p>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={form.correct_answer === i}
                    onChange={() => setForm(f => ({ ...f, correct_answer: i }))}
                    className="accent-accent"
                  />
                  <span className="text-xs text-gray-500 w-5">{String.fromCharCode(65 + i)}.</span>
                  <input
                    className="input text-sm"
                    placeholder={`${String.fromCharCode(65 + i)} şıkkı`}
                    value={opt}
                    onChange={e => {
                      const opts = [...form.options]
                      opts[i] = e.target.value
                      setForm(f => ({ ...f, options: opts }))
                    }}
                  />
                </div>
              ))}
            </div>

            <textarea
              className="input resize-y"
              placeholder="Açıklama (opsiyonel)..."
              value={form.explanation}
              onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
            />

            <div className="flex gap-2">
              <button
                className="btn-primary flex items-center gap-1.5 text-sm"
                onClick={saveQuestion}
                disabled={saving || !form.question_text.trim()}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Kaydet</span>
              </button>
              <button className="btn-ghost text-sm" onClick={() => { setShowForm(false); setEditingId(null) }}>
                İptal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions List */}
      {selectedTopic && (
        loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-gray-600" />
          </div>
        ) : questions.length === 0 ? (
          <div className="card p-8 text-center text-gray-500 text-sm">Bu konuda henüz soru yok.</div>
        ) : (
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <div key={q.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-1">#{idx + 1}</p>
                    <p className="text-sm text-gray-200 leading-relaxed">{q.question_text}</p>
                    {q.options?.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {q.options.map((opt, i) => (
                          <p key={i} className={`text-xs ${i === q.correct_answer ? 'text-emerald-400 font-medium' : 'text-gray-600'}`}>
                            {String.fromCharCode(65 + i)}. {opt}
                            {i === q.correct_answer && ' ✓'}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => startEdit(q)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2a] transition-colors">
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => deleteQuestion(q.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
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

      const { data: inserted, error } = await supabase
        .from('questions')
        .insert(data)
        .select()

      if (error) throw error
      setResult({ success: true, count: inserted.length })
    } catch (err) {
      setResult({ success: false, message: err.message })
    }
    setImporting(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-gray-300">JSON ile Toplu Soru İçe Aktarma</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Sorular aşağıdaki formatta JSON olarak yapıştırın:
        </p>
        <pre className="text-xs bg-[#141414] p-3 rounded-lg border border-[#2a2a2a] text-gray-400 overflow-x-auto mb-4">
          {exampleJson}
        </pre>
        <textarea
          className="input min-h-[200px] font-mono text-xs resize-y mb-3"
          placeholder="JSON verisi buraya yapıştırın..."
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
        />
        {result && (
          <div className={`mb-3 text-sm px-3 py-2 rounded-lg border ${
            result.success
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-red-400 bg-red-500/10 border-red-500/20'
          }`}>
            {result.success ? `✓ ${result.count} soru başarıyla içe aktarıldı!` : `Hata: ${result.message}`}
          </div>
        )}
        <button
          className="btn-primary flex items-center gap-1.5 text-sm"
          onClick={handleImport}
          disabled={importing || !jsonText.trim()}
        >
          {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          <span>İçe Aktar</span>
        </button>
      </div>
    </motion.div>
  )
}
