import { AspectPattern } from '@/lib/aspect-patterns'
import { PLANET_SYMBOLS } from '@/lib/astrology-types'

interface AspectPatternDiagramProps {
  pattern: AspectPattern
}

export function AspectPatternDiagram({ pattern }: AspectPatternDiagramProps) {
  const size = 200
  const center = size / 2
  const radius = 70

  const renderTSquare = () => {
    const apex = pattern.planets[2]
    const base1 = pattern.planets[0]
    const base2 = pattern.planets[1]

    const apexPos = { x: center, y: center - radius }
    const base1Pos = { x: center - radius, y: center + radius }
    const base2Pos = { x: center + radius, y: center + radius }

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <line 
          x1={base1Pos.x} y1={base1Pos.y} 
          x2={base2Pos.x} y2={base2Pos.y} 
          stroke="oklch(0.55 0.22 25)" 
          strokeWidth="2" 
          strokeDasharray="4 2"
        />
        
        <line 
          x1={apexPos.x} y1={apexPos.y} 
          x2={base1Pos.x} y2={base1Pos.y} 
          stroke="oklch(0.60 0.22 40)" 
          strokeWidth="2"
        />
        
        <line 
          x1={apexPos.x} y1={apexPos.y} 
          x2={base2Pos.x} y2={base2Pos.y} 
          stroke="oklch(0.60 0.22 40)" 
          strokeWidth="2"
        />

        <circle cx={apexPos.x} cy={apexPos.y} r="20" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
        <text x={apexPos.x} y={apexPos.y + 6} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="18">
          {PLANET_SYMBOLS[apex]}
        </text>

        <circle cx={base1Pos.x} cy={base1Pos.y} r="20" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
        <text x={base1Pos.x} y={base1Pos.y + 6} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="18">
          {PLANET_SYMBOLS[base1]}
        </text>

        <circle cx={base2Pos.x} cy={base2Pos.y} r="20" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
        <text x={base2Pos.x} y={base2Pos.y + 6} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="18">
          {PLANET_SYMBOLS[base2]}
        </text>

        <text x={center} y={base1Pos.y + 25} textAnchor="middle" fill="oklch(0.55 0.22 25)" fontSize="10">
          Opposition
        </text>
        <text x={apexPos.x - 45} y={center - 5} textAnchor="middle" fill="oklch(0.60 0.22 40)" fontSize="10">
          Square
        </text>
        <text x={apexPos.x + 45} y={center - 5} textAnchor="middle" fill="oklch(0.60 0.22 40)" fontSize="10">
          Square
        </text>
      </svg>
    )
  }

  const renderGrandTrine = () => {
    const positions = pattern.planets.slice(0, 3).map((_, i) => {
      const angle = (i * 120 - 90) * Math.PI / 180
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      }
    })

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon 
          points={positions.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={pattern.color}
          strokeWidth="2"
        />

        {positions.map((pos, i) => (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r="20" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
            <text x={pos.x} y={pos.y + 6} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="18">
              {PLANET_SYMBOLS[pattern.planets[i]]}
            </text>
          </g>
        ))}

        <text x={center} y={center + 5} textAnchor="middle" fill={pattern.color} fontSize="10" fontWeight="600">
          Trines
        </text>
      </svg>
    )
  }

  const renderGrandCross = () => {
    const positions = pattern.planets.slice(0, 4).map((_, i) => {
      const angle = (i * 90 - 90) * Math.PI / 180
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      }
    })

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <line x1={positions[0].x} y1={positions[0].y} x2={positions[2].x} y2={positions[2].y} stroke="oklch(0.55 0.22 25)" strokeWidth="2" strokeDasharray="4 2" />
        <line x1={positions[1].x} y1={positions[1].y} x2={positions[3].x} y2={positions[3].y} stroke="oklch(0.55 0.22 25)" strokeWidth="2" strokeDasharray="4 2" />
        
        <line x1={positions[0].x} y1={positions[0].y} x2={positions[1].x} y2={positions[1].y} stroke="oklch(0.60 0.22 40)" strokeWidth="2" />
        <line x1={positions[1].x} y1={positions[1].y} x2={positions[2].x} y2={positions[2].y} stroke="oklch(0.60 0.22 40)" strokeWidth="2" />
        <line x1={positions[2].x} y1={positions[2].y} x2={positions[3].x} y2={positions[3].y} stroke="oklch(0.60 0.22 40)" strokeWidth="2" />
        <line x1={positions[3].x} y1={positions[3].y} x2={positions[0].x} y2={positions[0].y} stroke="oklch(0.60 0.22 40)" strokeWidth="2" />

        {positions.map((pos, i) => (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r="20" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
            <text x={pos.x} y={pos.y + 6} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="18">
              {PLANET_SYMBOLS[pattern.planets[i]]}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  const renderYod = () => {
    const apex = pattern.planets[2]
    const base1 = pattern.planets[0]
    const base2 = pattern.planets[1]

    const apexPos = { x: center, y: center - radius }
    const base1Pos = { x: center - radius * 0.7, y: center + radius }
    const base2Pos = { x: center + radius * 0.7, y: center + radius }

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <line 
          x1={base1Pos.x} y1={base1Pos.y} 
          x2={base2Pos.x} y2={base2Pos.y} 
          stroke="oklch(0.70 0.20 150)" 
          strokeWidth="2"
        />
        
        <line 
          x1={apexPos.x} y1={apexPos.y} 
          x2={base1Pos.x} y2={base1Pos.y} 
          stroke={pattern.color} 
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        
        <line 
          x1={apexPos.x} y1={apexPos.y} 
          x2={base2Pos.x} y2={base2Pos.y} 
          stroke={pattern.color} 
          strokeWidth="2"
          strokeDasharray="4 2"
        />

        <circle cx={apexPos.x} cy={apexPos.y} r="20" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
        <text x={apexPos.x} y={apexPos.y + 6} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="18">
          {PLANET_SYMBOLS[apex]}
        </text>

        <circle cx={base1Pos.x} cy={base1Pos.y} r="20" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
        <text x={base1Pos.x} y={base1Pos.y + 6} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="18">
          {PLANET_SYMBOLS[base1]}
        </text>

        <circle cx={base2Pos.x} cy={base2Pos.y} r="20" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
        <text x={base2Pos.x} y={base2Pos.y + 6} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="18">
          {PLANET_SYMBOLS[base2]}
        </text>

        <text x={center} y={base1Pos.y + 25} textAnchor="middle" fill="oklch(0.70 0.20 150)" fontSize="10">
          Sextile
        </text>
        <text x={apexPos.x - 35} y={center} textAnchor="middle" fill={pattern.color} fontSize="9">
          Quincunx
        </text>
        <text x={apexPos.x + 35} y={center} textAnchor="middle" fill={pattern.color} fontSize="9">
          Quincunx
        </text>
      </svg>
    )
  }

  const renderKite = () => {
    const kiteTop = pattern.planets[3]
    const trinePositions = pattern.planets.slice(0, 3).map((_, i) => {
      const angle = (i * 120 + 30) * Math.PI / 180
      return {
        x: center + radius * 0.8 * Math.cos(angle),
        y: center + radius * 0.8 * Math.sin(angle)
      }
    })
    const topPos = { x: center, y: center - radius * 1.1 }

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon 
          points={trinePositions.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="oklch(0.70 0.20 150)"
          strokeWidth="2"
        />

        <line 
          x1={topPos.x} y1={topPos.y} 
          x2={trinePositions[0].x} y2={trinePositions[0].y} 
          stroke="oklch(0.55 0.22 25)" 
          strokeWidth="2"
          strokeDasharray="4 2"
        />

        <line 
          x1={topPos.x} y1={topPos.y} 
          x2={trinePositions[1].x} y2={trinePositions[1].y} 
          stroke="oklch(0.70 0.20 150)" 
          strokeWidth="2"
        />

        <line 
          x1={topPos.x} y1={topPos.y} 
          x2={trinePositions[2].x} y2={trinePositions[2].y} 
          stroke="oklch(0.70 0.20 150)" 
          strokeWidth="2"
        />

        {trinePositions.map((pos, i) => (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r="18" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
            <text x={pos.x} y={pos.y + 5} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="16">
              {PLANET_SYMBOLS[pattern.planets[i]]}
            </text>
          </g>
        ))}

        <circle cx={topPos.x} cy={topPos.y} r="20" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
        <text x={topPos.x} y={topPos.y + 6} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="18">
          {PLANET_SYMBOLS[kiteTop]}
        </text>
      </svg>
    )
  }

  const renderMysticRectangle = () => {
    const positions = pattern.planets.slice(0, 4).map((_, i) => {
      const angle = (i * 90 - 45) * Math.PI / 180
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      }
    })

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <line x1={positions[0].x} y1={positions[0].y} x2={positions[2].x} y2={positions[2].y} stroke="oklch(0.55 0.22 25)" strokeWidth="2" strokeDasharray="4 2" />
        <line x1={positions[1].x} y1={positions[1].y} x2={positions[3].x} y2={positions[3].y} stroke="oklch(0.55 0.22 25)" strokeWidth="2" strokeDasharray="4 2" />

        <line x1={positions[0].x} y1={positions[0].y} x2={positions[1].x} y2={positions[1].y} stroke="oklch(0.70 0.20 150)" strokeWidth="2" />
        <line x1={positions[2].x} y1={positions[2].y} x2={positions[3].x} y2={positions[3].y} stroke="oklch(0.70 0.20 150)" strokeWidth="2" />

        <line x1={positions[1].x} y1={positions[1].y} x2={positions[2].x} y2={positions[2].y} stroke="oklch(0.70 0.18 100)" strokeWidth="2" />
        <line x1={positions[3].x} y1={positions[3].y} x2={positions[0].x} y2={positions[0].y} stroke="oklch(0.70 0.18 100)" strokeWidth="2" />

        {positions.map((pos, i) => (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r="20" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
            <text x={pos.x} y={pos.y + 6} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="18">
              {PLANET_SYMBOLS[pattern.planets[i]]}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  const renderGrandSextile = () => {
    const positions = pattern.planets.slice(0, 6).map((_, i) => {
      const angle = (i * 60 - 90) * Math.PI / 180
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      }
    })

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {positions.map((pos, i) => {
          const nextPos = positions[(i + 1) % 6]
          return (
            <line 
              key={`sextile-${i}`}
              x1={pos.x} y1={pos.y} 
              x2={nextPos.x} y2={nextPos.y} 
              stroke="oklch(0.70 0.18 100)" 
              strokeWidth="2"
            />
          )
        })}

        {positions.map((pos, i) => {
          const altPos = positions[(i + 2) % 6]
          return (
            <line 
              key={`trine-${i}`}
              x1={pos.x} y1={pos.y} 
              x2={altPos.x} y2={altPos.y} 
              stroke="oklch(0.70 0.20 150)" 
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
          )
        })}

        {positions.map((pos, i) => (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r="18" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
            <text x={pos.x} y={pos.y + 5} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="16">
              {PLANET_SYMBOLS[pattern.planets[i]]}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  const renderStellium = () => {
    const planetCount = pattern.planets.length
    const spacing = 40

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <ellipse 
          cx={center} 
          cy={center} 
          rx={radius * 1.2} 
          ry={radius * 0.6} 
          fill="none" 
          stroke={pattern.color} 
          strokeWidth="2"
          strokeDasharray="5 3"
        />

        {pattern.planets.slice(0, 5).map((planet, i) => {
          const totalWidth = Math.min(planetCount - 1, 4) * spacing
          const x = center - totalWidth / 2 + i * spacing
          return (
            <g key={i}>
              <circle cx={x} cy={center} r="18" fill="oklch(0.20 0.06 265)" stroke={pattern.color} strokeWidth="2" />
              <text x={x} y={center + 5} textAnchor="middle" fill="oklch(0.98 0 0)" fontSize="16">
                {PLANET_SYMBOLS[planet]}
              </text>
            </g>
          )
        })}

        {planetCount > 5 && (
          <text x={center + (spacing * 2.5)} y={center + 5} textAnchor="middle" fill={pattern.color} fontSize="14" fontWeight="600">
            +{planetCount - 5}
          </text>
        )}
      </svg>
    )
  }

  const renderDiagram = () => {
    switch (pattern.type) {
      case 'T-Square':
        return renderTSquare()
      case 'Grand Trine':
        return renderGrandTrine()
      case 'Grand Cross':
        return renderGrandCross()
      case 'Yod':
        return renderYod()
      case 'Kite':
        return renderKite()
      case 'Mystic Rectangle':
        return renderMysticRectangle()
      case 'Grand Sextile':
        return renderGrandSextile()
      case 'Stellium':
        return renderStellium()
      default:
        return null
    }
  }

  return (
    <div className="flex items-center justify-center p-4 bg-muted/20 rounded-lg border border-border/50">
      {renderDiagram()}
    </div>
  )
}
