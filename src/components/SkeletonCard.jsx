export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`p-5 ${className}`} style={{ background: '#111', border: '1px solid #1a1a1a' }}>
      <div className="shimmer h-4 w-2/3 mb-3" />
      <div className="shimmer h-3 w-1/2 mb-4" />
      <div className="shimmer h-2 w-full mb-2" />
      <div className="shimmer h-2 w-4/5" />
    </div>
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer h-3"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
    </div>
  )
}
