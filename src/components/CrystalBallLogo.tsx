export function CrystalBallLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="ballGradient" cx="40%" cy="35%">
          <stop offset="0%" stopColor="oklch(0.85 0.12 280)" stopOpacity="0.9" />
          <stop offset="50%" stopColor="oklch(0.65 0.15 270)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="oklch(0.45 0.18 260)" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="innerGlow" cx="45%" cy="40%">
          <stop offset="0%" stopColor="oklch(0.95 0.08 85)" stopOpacity="0.6" />
          <stop offset="40%" stopColor="oklch(0.80 0.12 280)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="standGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.35 0.08 280)" />
          <stop offset="100%" stopColor="oklch(0.25 0.10 270)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <circle
        cx="50"
        cy="45"
        r="30"
        fill="url(#ballGradient)"
        filter="url(#glow)"
        opacity="0.95"
      />
      
      <circle
        cx="50"
        cy="45"
        r="30"
        fill="url(#innerGlow)"
      />
      
      <ellipse
        cx="42"
        cy="38"
        rx="12"
        ry="15"
        fill="oklch(0.95 0.05 280)"
        opacity="0.3"
      />
      
      <ellipse
        cx="38"
        cy="35"
        rx="6"
        ry="8"
        fill="oklch(1 0 0)"
        opacity="0.5"
      />
      
      <path
        d="M 35 73 Q 35 75 37 76 L 42 78 Q 50 80 58 78 L 63 76 Q 65 75 65 73 L 63 70 Q 62 68 60 68 L 40 68 Q 38 68 37 70 Z"
        fill="url(#standGradient)"
        opacity="0.9"
      />
      
      <ellipse
        cx="50"
        cy="68"
        rx="12"
        ry="3"
        fill="oklch(0.20 0.08 275)"
        opacity="0.8"
      />
      
      <path
        d="M 45 45 Q 48 42 50 45 Q 52 48 50 50 Q 48 48 45 45"
        fill="oklch(0.85 0.15 85)"
        opacity="0.4"
      />
      <circle
        cx="55"
        cy="50"
        r="2"
        fill="oklch(0.90 0.12 85)"
        opacity="0.3"
      />
      <circle
        cx="48"
        cy="52"
        r="1.5"
        fill="oklch(0.88 0.10 85)"
        opacity="0.35"
      />
    </svg>
  )
}
