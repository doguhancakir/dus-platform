export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="shimmer h-4 w-2/3 rounded mb-3" />
      <div className="shimmer h-3 w-1/2 rounded mb-4" />
      <div className="shimmer h-2 w-full rounded mb-2" />
      <div className="shimmer h-2 w-4/5 rounded" />
    </div>
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer h-3 rounded"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
    </div>
  )
}
