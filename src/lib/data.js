/**
 * Sabit branş verileri
 */
export const BRANCHES = [
  {
    id: 1,
    name: 'Restoratif Diş Tedavisi',
    icon: '🦷',
    color: '#3b82f6',
    p5gradient: 'linear-gradient(135deg, #0d1525 0%, #0a0a0a 100%)',
    gradient: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/20',
  },
  {
    id: 2,
    name: 'Protetik Diş Tedavisi',
    icon: '🔩',
    color: '#8b5cf6',
    p5gradient: 'linear-gradient(135deg, #110d20 0%, #0a0a0a 100%)',
    gradient: 'from-violet-500/20 to-violet-600/5',
    border: 'border-violet-500/20',
  },
  {
    id: 3,
    name: 'Ağız, Diş ve Çene Cerrahisi',
    icon: '⚕️',
    color: '#ef4444',
    p5gradient: 'linear-gradient(135deg, #1a0808 0%, #0a0a0a 100%)',
    gradient: 'from-red-500/20 to-red-600/5',
    border: 'border-red-500/20',
  },
  {
    id: 4,
    name: 'Ağız, Diş ve Çene Radyolojisi',
    icon: '🔬',
    color: '#f97316',
    p5gradient: 'linear-gradient(135deg, #181200 0%, #0a0a0a 100%)',
    gradient: 'from-orange-500/20 to-orange-600/5',
    border: 'border-orange-500/20',
  },
  {
    id: 5,
    name: 'Periodontoloji',
    icon: '🌿',
    color: '#22c55e',
    p5gradient: 'linear-gradient(135deg, #081408 0%, #0a0a0a 100%)',
    gradient: 'from-green-500/20 to-green-600/5',
    border: 'border-green-500/20',
  },
  {
    id: 6,
    name: 'Ortodonti',
    icon: '😁',
    color: '#14b8a6',
    p5gradient: 'linear-gradient(135deg, #080f18 0%, #0a0a0a 100%)',
    gradient: 'from-teal-500/20 to-teal-600/5',
    border: 'border-teal-500/20',
  },
  {
    id: 7,
    name: 'Endodonti',
    icon: '🔧',
    color: '#f59e0b',
    p5gradient: 'linear-gradient(135deg, #180e00 0%, #0a0a0a 100%)',
    gradient: 'from-amber-500/20 to-amber-600/5',
    border: 'border-amber-500/20',
  },
  {
    id: 8,
    name: 'Pedodonti (Çocuk Diş Hekimliği)',
    icon: '👶',
    color: '#ec4899',
    p5gradient: 'linear-gradient(135deg, #180812 0%, #0a0a0a 100%)',
    gradient: 'from-pink-500/20 to-pink-600/5',
    border: 'border-pink-500/20',
  },
]

export const TEMEL_BILIMLER = [
  {
    id: 101,
    name: 'Anatomi',
    icon: '🦴',
    color: '#6366f1',
    p5gradient: 'linear-gradient(135deg, #0d0d20 0%, #0a0a0a 100%)',
    gradient: 'from-indigo-500/20 to-indigo-600/5',
    border: 'border-indigo-500/20',
  },
  {
    id: 102,
    name: 'Histoloji ve Embriyoloji',
    icon: '🔬',
    color: '#8b5cf6',
    p5gradient: 'linear-gradient(135deg, #110d20 0%, #0a0a0a 100%)',
    gradient: 'from-violet-500/20 to-violet-600/5',
    border: 'border-violet-500/20',
  },
  {
    id: 103,
    name: 'Fizyoloji',
    icon: '💓',
    color: '#ec4899',
    p5gradient: 'linear-gradient(135deg, #180812 0%, #0a0a0a 100%)',
    gradient: 'from-pink-500/20 to-pink-600/5',
    border: 'border-pink-500/20',
  },
  {
    id: 104,
    name: 'Tıbbi Biyokimya',
    icon: '⚗️',
    color: '#f59e0b',
    p5gradient: 'linear-gradient(135deg, #180e00 0%, #0a0a0a 100%)',
    gradient: 'from-amber-500/20 to-amber-600/5',
    border: 'border-amber-500/20',
  },
  {
    id: 105,
    name: 'Tıbbi Mikrobiyoloji',
    icon: '🦠',
    color: '#22c55e',
    p5gradient: 'linear-gradient(135deg, #081408 0%, #0a0a0a 100%)',
    gradient: 'from-green-500/20 to-green-600/5',
    border: 'border-green-500/20',
  },
  {
    id: 106,
    name: 'Tıbbi Patoloji',
    icon: '🧫',
    color: '#ef4444',
    p5gradient: 'linear-gradient(135deg, #1a0808 0%, #0a0a0a 100%)',
    gradient: 'from-red-500/20 to-red-600/5',
    border: 'border-red-500/20',
  },
  {
    id: 107,
    name: 'Tıbbi Farmakoloji',
    icon: '💊',
    color: '#14b8a6',
    p5gradient: 'linear-gradient(135deg, #080f18 0%, #0a0a0a 100%)',
    gradient: 'from-teal-500/20 to-teal-600/5',
    border: 'border-teal-500/20',
  },
  {
    id: 108,
    name: 'Tıbbi Biyoloji ve Genetik',
    icon: '🧬',
    color: '#f97316',
    p5gradient: 'linear-gradient(135deg, #181200 0%, #0a0a0a 100%)',
    gradient: 'from-orange-500/20 to-orange-600/5',
    border: 'border-orange-500/20',
  },
  {
    id: 109,
    name: 'Shayla',
    icon: '💻',
    color: '#0ea5e9',
    p5gradient: 'linear-gradient(135deg, #001522 0%, #0a0a0a 100%)',
    gradient: 'from-sky-500/20 to-sky-600/5',
    border: 'border-sky-500/20',
    restricted: true,
  },
]

export function getBranchById(id) {
  return BRANCHES.find(b => b.id === Number(id)) || TEMEL_BILIMLER.find(b => b.id === Number(id))
}

/**
 * restricted branşlar sadece admin ve nickname'i "ezgisu" olan kullanıcıya görünür.
 */
export function isBranchVisible(branch, user) {
  if (!branch?.restricted) return true
  if (user?.is_admin) return true
  return user?.nickname?.trim().toLowerCase() === 'ezgisu'
}
