/**
 * Scan-line skeleton loaders — P5 aesthetic.
 * Horizontal wipe animation, no rounded corners, no pulse.
 */

export default function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: '#0a1525', padding: '1.25rem 1.5rem' }}
    >
      <div className="shimmer absolute inset-0" />
      <div className="relative z-10 space-y-2">
        <div style={{ height: 16, width: '60%', background: '#111e30' }} className="shimmer" />
        <div style={{ height: 11, width: '40%', background: '#111e30' }} className="shimmer" />
        <div style={{ height: 8, width: '100%', background: '#111e30', marginTop: 12 }} className="shimmer" />
        <div style={{ height: 8, width: '80%', background: '#111e30' }} className="shimmer" />
      </div>
      {/* Right diagonal slash */}
      <div
        className="absolute right-0 top-0 bottom-0 w-9"
        style={{ background: '#0f1d32', clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%)' }}
      />
    </div>
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-[3px] ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden"
          style={{
            height: 11,
            width: i === lines - 1 ? '65%' : '100%',
            background: '#0a1525',
          }}
        >
          <div className="shimmer absolute inset-0" style={{ animationDelay: `${i * 0.12}s` }} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonBranchCard() {
  return (
    <div
      className="relative overflow-hidden flex items-center px-5"
      style={{ height: 112, background: '#0a1525' }}
    >
      <div className="shimmer absolute inset-0" />
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: '#1a2d45' }} />
      <div className="relative z-10 space-y-2">
        <div style={{ height: 26, width: 180, background: '#111e30' }} className="shimmer" />
        <div style={{ height: 8, width: 100, background: '#111e30' }} className="shimmer" />
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-9"
        style={{ background: '#0f1d32', clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%)' }}
      />
    </div>
  )
}
