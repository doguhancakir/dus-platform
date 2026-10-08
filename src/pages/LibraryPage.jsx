import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Loader2, Search } from 'lucide-react'
import { BRANCHES, TEMEL_BILIMLER } from '../lib/data'
import { loadBooks } from '../lib/books'
import BookGrid from '../components/BookGrid'
import Layout from '../components/Layout'

const ALL_BRANCHES = [...BRANCHES, ...TEMEL_BILIMLER]
const shortName = id => ALL_BRANCHES.find(b => b.id === id)?.name ?? 'Karma'

export default function LibraryPage() {
  const [books, setBooks] = useState([])
  const [available, setAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [branch, setBranch] = useState('all') // 'all' | 'karma' | branch id
  const [query, setQuery] = useState('')

  useEffect(() => {
    loadBooks().then(({ books, available }) => {
      setBooks(books)
      setAvailable(available)
      setLoading(false)
    })
  }, [])

  const branchOptions = useMemo(() => {
    const ids = new Set(books.map(b => b.branch_id))
    const list = ALL_BRANCHES.filter(b => ids.has(b.id))
    return ids.has(null) ? [...list, { id: 'karma', name: 'Karma' }] : list
  }, [books])

  const q = query.trim().toLocaleLowerCase('tr-TR')
  const filtered = books.filter(b => {
    if (branch === 'karma' && b.branch_id !== null) return false
    if (branch !== 'all' && branch !== 'karma' && b.branch_id !== branch) return false
    if (q && !b.title.toLocaleLowerCase('tr-TR').includes(q)) return false
    return true
  })

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-sm" style={{ color: '#6b7a8f' }}>
          <ChevronLeft size={15} /> Ana sayfa
        </Link>

        <h1 className="text-3xl sm:text-4xl font-semibold text-white">Kütüphane</h1>
        <p className="mt-1 text-[14px]" style={{ color: '#6b7a8f' }}>
          {loading ? 'yükleniyor…' : `${books.length} kitap · kapağa ya da İndir'e basınca iner`}
        </p>

        {!loading && !available && (
          <div className="mt-6 rounded-lg p-4 text-sm" style={{ background: 'rgba(240,192,64,0.06)', border: '1px solid rgba(240,192,64,0.3)', color: '#f0c040' }}>
            Kitap listesi henüz veritabanına eklenmemiş (supabase_migration_books.sql çalıştırılmalı).
          </div>
        )}

        {!loading && available && (
          <>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4f5e72' }} />
                <input
                  className="w-full h-10 pl-9 pr-3 rounded-md text-[14px] outline-none"
                  style={{ background: '#0b1626', border: '1px solid #1c2a3e', color: '#e1e5ec' }}
                  placeholder="Kitap ara…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              <select
                className="h-10 px-3 rounded-md text-[14px] outline-none"
                style={{ background: '#0b1626', border: '1px solid #1c2a3e', color: '#e1e5ec' }}
                value={branch}
                onChange={e => setBranch(e.target.value === 'all' || e.target.value === 'karma' ? e.target.value : Number(e.target.value))}
              >
                <option value="all">Tüm branşlar</option>
                {branchOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="mt-6">
              <BookGrid
                key={`${branch}-${q}`}
                books={filtered}
                metaFor={branch === 'all' ? (b => (b.branch_id === null ? 'Karma' : shortName(b.branch_id))) : undefined}
              />
            </div>
          </>
        )}

        {loading && <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: '#0891b2' }} /></div>}
      </div>
    </Layout>
  )
}
