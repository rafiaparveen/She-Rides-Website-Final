import { useMemo } from 'react'

// Deterministic-ish pseudo-random sparkle field. Purely decorative,
// sits behind all page content with pointer-events disabled.
export default function BackgroundSparkles({ count = 28 }) {
  const sparkles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2.5,
      color: i % 3 === 0 ? '#EC4899' : i % 3 === 1 ? '#8B5CF6' : '#F9A8D4',
    }))
  }, [count])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Ambient gradient glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-neon-pink/20 rounded-full blur-[120px] animate-drift-slow" />
      <div
        className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] bg-neon-violet/20 rounded-full blur-[130px] animate-drift-slow"
        style={{ animationDelay: '2s' }}
      />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-neon-pink/10 rounded-full blur-[110px] animate-drift-slow" style={{ animationDelay: '4s' }} />

      {/* Sparkle dots */}
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full animate-sparkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.color,
            boxShadow: `0 0 6px ${s.color}`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
