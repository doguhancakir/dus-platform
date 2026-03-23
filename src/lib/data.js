/**
 * Sabit branş verileri
 */
export const BRANCHES = [
  {
    id: 1,
    name: 'Restoratif Diş Tedavisi',
    icon: '🦷',
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/20',
  },
  {
    id: 2,
    name: 'Protetik Diş Tedavisi',
    icon: '🔩',
    color: '#8b5cf6',
    gradient: 'from-violet-500/20 to-violet-600/5',
    border: 'border-violet-500/20',
  },
  {
    id: 3,
    name: 'Ağız, Diş ve Çene Cerrahisi',
    icon: '⚕️',
    color: '#ef4444',
    gradient: 'from-red-500/20 to-red-600/5',
    border: 'border-red-500/20',
  },
  {
    id: 4,
    name: 'Ağız, Diş ve Çene Radyolojisi',
    icon: '🔬',
    color: '#f97316',
    gradient: 'from-orange-500/20 to-orange-600/5',
    border: 'border-orange-500/20',
  },
  {
    id: 5,
    name: 'Periodontoloji',
    icon: '🌿',
    color: '#22c55e',
    gradient: 'from-green-500/20 to-green-600/5',
    border: 'border-green-500/20',
  },
  {
    id: 6,
    name: 'Ortodonti',
    icon: '😁',
    color: '#14b8a6',
    gradient: 'from-teal-500/20 to-teal-600/5',
    border: 'border-teal-500/20',
  },
  {
    id: 7,
    name: 'Endodonti',
    icon: '🔧',
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-amber-600/5',
    border: 'border-amber-500/20',
  },
  {
    id: 8,
    name: 'Pedodonti (Çocuk Diş Hekimliği)',
    icon: '👶',
    color: '#ec4899',
    gradient: 'from-pink-500/20 to-pink-600/5',
    border: 'border-pink-500/20',
  },
]

export function getBranchById(id) {
  return BRANCHES.find(b => b.id === Number(id))
}
