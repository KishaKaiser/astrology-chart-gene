import { ChartData, TransitData, ZODIAC_SIGNS, ZODIAC_SYMBOLS, PLANET_SYMBOLS } from '@/lib/astrology-types'

interface ChartWheelProps {
  chart: ChartData
  transits?: TransitData
  size?: number
}

export function ChartWheel({ chart, transits, size = 500 }: ChartWheelProps) {
  const center = size / 2
  const outerRadius = size / 2 - 10
  const innerRadius = outerRadius * 0.35
  const houseRadius = outerRadius * 0.75
  const natalPlanetRadius = outerRadius * 0.85
  const transitPlanetRadius = outerRadius * 0.65

  const polarToCartesian = (angle: number, radius: number) => {
    const angleInRadians = ((angle - 90) * Math.PI) / 180
    return {
      x: center + radius * Math.cos(angleInRadians),
      y: center + radius * Math.sin(angleInRadians),
    }
  }

  const describeArc = (
    startAngle: number,
    endAngle: number,
    radius: number
  ) => {
    const start = polarToCartesian(startAngle, radius)
    const end = polarToCartesian(endAngle, radius)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      <defs>
        <radialGradient id="chartBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.22 0.08 270)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="oklch(0.18 0.05 260)" stopOpacity="0.8" />
        </radialGradient>
      </defs>

      <circle
        cx={center}
        cy={center}
        r={outerRadius}
        fill="url(#chartBg)"
        stroke="oklch(0.78 0.15 85)"
        strokeWidth="2"
      />

      {ZODIAC_SIGNS.map((sign, index) => {
        const startAngle = index * 30
        const midAngle = startAngle + 15
        const endAngle = startAngle + 30

        const textPos = polarToCartesian(midAngle, outerRadius - 25)
        const symbolPos = polarToCartesian(midAngle, outerRadius - 50)

        return (
          <g key={sign}>
            <path
              d={describeArc(startAngle, endAngle, outerRadius)}
              fill="none"
              stroke="oklch(0.35 0.06 285)"
              strokeWidth="1"
              opacity="0.3"
            />
            <line
              x1={polarToCartesian(startAngle, innerRadius).x}
              y1={polarToCartesian(startAngle, innerRadius).y}
              x2={polarToCartesian(startAngle, outerRadius).x}
              y2={polarToCartesian(startAngle, outerRadius).y}
              stroke="oklch(0.35 0.06 285)"
              strokeWidth="1"
              opacity="0.5"
            />
            <text
              x={textPos.x}
              y={textPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="oklch(0.78 0.15 85)"
              fontSize="12"
              fontWeight="600"
              className="font-sans"
            >
              {sign.substring(0, 3).toUpperCase()}
            </text>
            <text
              x={symbolPos.x}
              y={symbolPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="oklch(0.88 0.12 85)"
              fontSize="20"
            >
              {ZODIAC_SYMBOLS[sign]}
            </text>
          </g>
        )
      })}

      {chart.houses.map((house) => {
        const angle = house.cusp
        const startPos = polarToCartesian(angle, innerRadius)
        const endPos = polarToCartesian(angle, houseRadius)
        const labelPos = polarToCartesian(angle + 15, (innerRadius + houseRadius) / 2)

        return (
          <g key={house.number}>
            <line
              x1={startPos.x}
              y1={startPos.y}
              x2={endPos.x}
              y2={endPos.y}
              stroke="oklch(0.78 0.15 85)"
              strokeWidth="2"
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="oklch(0.98 0 0)"
              fontSize="14"
              fontWeight="600"
              className="font-sans"
            >
              {house.number}
            </text>
          </g>
        )
      })}

      <circle
        cx={center}
        cy={center}
        r={innerRadius}
        fill="oklch(0.15 0.08 270)"
        stroke="oklch(0.78 0.15 85)"
        strokeWidth="2"
      />

      {chart.planets.map((planet) => {
        const pos = polarToCartesian(planet.longitude, natalPlanetRadius)
        
        return (
          <g key={planet.name}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r="16"
              fill="oklch(0.25 0.08 270)"
              stroke="oklch(0.78 0.15 85)"
              strokeWidth="2"
              className="star-pulse"
            />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="oklch(0.98 0 0)"
              fontSize="16"
            >
              {PLANET_SYMBOLS[planet.name]}
            </text>
          </g>
        )
      })}

      {transits && transits.planets.map((planet) => {
        const pos = polarToCartesian(planet.longitude, transitPlanetRadius)
        
        return (
          <g key={`transit-${planet.name}`}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r="14"
              fill="oklch(0.60 0.22 40)"
              stroke="oklch(0.75 0.25 45)"
              strokeWidth="2"
              opacity="0.9"
            />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="oklch(0.98 0 0)"
              fontSize="14"
            >
              {PLANET_SYMBOLS[planet.name]}
            </text>
            <line
              x1={pos.x}
              y1={pos.y}
              x2={polarToCartesian(planet.longitude, natalPlanetRadius).x}
              y2={polarToCartesian(planet.longitude, natalPlanetRadius).y}
              stroke="oklch(0.65 0.20 42)"
              strokeWidth="1"
              strokeDasharray="3 2"
              opacity="0.5"
            />
          </g>
        )
      })}

      {chart.aspects.map((aspect, index) => {
        const planet1 = chart.planets.find((p) => p.name === aspect.planet1)
        const planet2 = chart.planets.find((p) => p.name === aspect.planet2)

        if (!planet1 || !planet2) return null

        const pos1 = polarToCartesian(planet1.longitude, natalPlanetRadius)
        const pos2 = polarToCartesian(planet2.longitude, natalPlanetRadius)

        return (
          <line
            key={index}
            x1={pos1.x}
            y1={pos1.y}
            x2={pos2.x}
            y2={pos2.y}
            stroke={aspect.color}
            strokeWidth="1"
            opacity="0.4"
            strokeDasharray={aspect.type === 'Trine' ? '4 2' : undefined}
          />
        )
      })}

      <text
        x={center}
        y={center - 10}
        textAnchor="middle"
        fill="oklch(0.78 0.15 85)"
        fontSize="14"
        fontWeight="600"
        className="font-sans"
      >
        ASC
      </text>
      <text
        x={center}
        y={center + 10}
        textAnchor="middle"
        fill="oklch(0.98 0 0)"
        fontSize="18"
        className="font-mono"
      >
        {chart.ascendant.toFixed(1)}°
      </text>
    </svg>
  )
}
