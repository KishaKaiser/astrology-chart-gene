import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Download, ArrowsClockwise, Sparkle, Sun, Moon, Star, Atom, Spiral } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

type ImageStyle = 'solar-burst' | 'lunar-phases' | 'cosmic-mandala' | 'celestial-portal' | 'zodiac-wheel' | 'planetary-alignment' | 'nebula-cloud' | 'starfield' | 'sacred-geometry'
type ColorScheme = 'golden-sun' | 'purple-mystic' | 'blue-moon' | 'rainbow-spectrum' | 'deep-space' | 'aurora-borealis' | 'cosmic-fire' | 'ethereal-dream'

interface GeneratorSettings {
  style: ImageStyle
  colorScheme: ColorScheme
  complexity: number
  particles: boolean
  glow: boolean
  resolution: 'high' | 'ultra'
}

const COLOR_SCHEMES: Record<ColorScheme, { name: string; primary: string[]; secondary: string[]; accent: string[]; background: string; glow: string }> = {
  'golden-sun': {
    name: 'Golden Sun',
    primary: ['#FFD700', '#FFA500', '#FF8C00', '#FFB347'],
    secondary: ['#FFE4B5', '#FFDAB9', '#EEE8AA', '#F4C430'],
    accent: ['#FF6347', '#FF4500', '#DC143C', '#FFD700'],
    background: '#1a0f0a',
    glow: '#FFD70080'
  },
  'purple-mystic': {
    name: 'Purple Mystic',
    primary: ['#9370DB', '#8A2BE2', '#9932CC', '#7B68EE'],
    secondary: ['#E6E6FA', '#DDA0DD', '#DA70D6', '#EE82EE'],
    accent: ['#FF00FF', '#BA55D3', '#9400D3', '#8B008B'],
    background: '#0a0515',
    glow: '#9370DB80'
  },
  'blue-moon': {
    name: 'Blue Moon',
    primary: ['#4169E1', '#6495ED', '#00BFFF', '#1E90FF'],
    secondary: ['#B0E0E6', '#ADD8E6', '#87CEEB', '#87CEFA'],
    accent: ['#00CED1', '#48D1CC', '#40E0D0', '#00FFFF'],
    background: '#050a15',
    glow: '#4169E180'
  },
  'rainbow-spectrum': {
    name: 'Rainbow Spectrum',
    primary: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'],
    secondary: ['#FF69B4', '#FFD700', '#00FA9A', '#FF1493'],
    accent: ['#FF1493', '#00FFFF', '#FF6347', '#FFD700'],
    background: '#0a0a0a',
    glow: '#FF00FF80'
  },
  'deep-space': {
    name: 'Deep Space',
    primary: ['#1E3A8A', '#312E81', '#1E1B4B', '#3730A3'],
    secondary: ['#60A5FA', '#818CF8', '#A78BFA', '#C4B5FD'],
    accent: ['#FBBF24', '#F59E0B', '#FFFFFF', '#FDE047'],
    background: '#000000',
    glow: '#818CF880'
  },
  'aurora-borealis': {
    name: 'Aurora Borealis',
    primary: ['#00FF7F', '#00FA9A', '#7FFFD4', '#00FFC6'],
    secondary: ['#FF1493', '#FF69B4', '#FFB6C1', '#FF82AB'],
    accent: ['#9370DB', '#BA55D3', '#DDA0DD', '#EE82EE'],
    background: '#001a1a',
    glow: '#00FF7F80'
  },
  'cosmic-fire': {
    name: 'Cosmic Fire',
    primary: ['#FF4500', '#FF6347', '#DC143C', '#FF0000'],
    secondary: ['#FFA500', '#FFD700', '#FFFF00', '#FF8C00'],
    accent: ['#FF1493', '#FF00FF', '#8B00FF', '#9400D3'],
    background: '#0f0000',
    glow: '#FF450080'
  },
  'ethereal-dream': {
    name: 'Ethereal Dream',
    primary: ['#E0BBE4', '#D4A5D4', '#C4A4C4', '#B490B4'],
    secondary: ['#FFDFD3', '#FEC8D8', '#FDCAE1', '#F5B7B1'],
    accent: ['#957DAD', '#7BA3C1', '#6DB6C7', '#8FCDCD'],
    background: '#1a1625',
    glow: '#E0BBE480'
  }
}

export function MysticalImageGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [settings, setSettings] = useState<GeneratorSettings>({
    style: 'solar-burst',
    colorScheme: 'golden-sun',
    complexity: 70,
    particles: true,
    glow: true,
    resolution: 'high'
  })
  
  const [isGenerating, setIsGenerating] = useState(false)

  const getCanvasSize = () => {
    return settings.resolution === 'ultra' ? 2048 : 1200
  }

  const drawParticles = (ctx: CanvasRenderingContext2D, width: number, height: number, colors: typeof COLOR_SCHEMES[ColorScheme]) => {
    if (!settings.particles) return
    
    const particleCount = Math.floor(200 + (settings.complexity / 100) * 300)
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 3 + 0.5
      const opacity = Math.random() * 0.8 + 0.2
      
      if (settings.glow) {
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3)
        glowGradient.addColorStop(0, colors.accent[i % colors.accent.length] + Math.floor(opacity * 255).toString(16).padStart(2, '0'))
        glowGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(x, y, size * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      
      ctx.fillStyle = colors.accent[i % colors.accent.length] + Math.floor(opacity * 255).toString(16).padStart(2, '0')
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawSolarBurst = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2
    const centerY = height / 2
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const rayCount = Math.floor(30 + (settings.complexity / 100) * 50)
    
    for (let i = 0; i < rayCount; i++) {
      const angle = (Math.PI * 2 * i) / rayCount
      const length = Math.min(width, height) * 0.55
      
      const gradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX + Math.cos(angle) * length,
        centerY + Math.sin(angle) * length
      )
      
      gradient.addColorStop(0, colors.primary[i % colors.primary.length])
      gradient.addColorStop(0.5, colors.secondary[i % colors.secondary.length])
      gradient.addColorStop(1, 'transparent')
      
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(angle)
      ctx.fillStyle = gradient
      ctx.fillRect(0, -40, length, 80)
      ctx.restore()
    }
    
    if (settings.glow) {
      const sunGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 250)
      sunGlow.addColorStop(0, colors.glow)
      sunGlow.addColorStop(0.5, colors.primary[0] + '40')
      sunGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = sunGlow
      ctx.beginPath()
      ctx.arc(centerX, centerY, 250, 0, Math.PI * 2)
      ctx.fill()
    }
    
    const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 180)
    sunGradient.addColorStop(0, '#FFFFFF')
    sunGradient.addColorStop(0.3, colors.accent[0])
    sunGradient.addColorStop(0.7, colors.primary[0])
    sunGradient.addColorStop(1, colors.secondary[0])
    
    ctx.fillStyle = sunGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, 180, 0, Math.PI * 2)
    ctx.fill()
    
    drawParticles(ctx, width, height, colors)
  }

  const drawNebulaCloud = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const cloudCount = Math.floor(5 + (settings.complexity / 100) * 10)
    
    for (let c = 0; c < cloudCount; c++) {
      const cx = Math.random() * width
      const cy = Math.random() * height
      const radius = Math.random() * 300 + 200
      
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      gradient.addColorStop(0, colors.primary[c % colors.primary.length] + '80')
      gradient.addColorStop(0.4, colors.secondary[c % colors.secondary.length] + '60')
      gradient.addColorStop(0.7, colors.accent[c % colors.accent.length] + '30')
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 150 + 100
      
      if (settings.glow) {
        const starGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
        starGlow.addColorStop(0, '#FFFFFF')
        starGlow.addColorStop(0.2, colors.accent[i % colors.accent.length] + 'CC')
        starGlow.addColorStop(0.5, colors.primary[i % colors.primary.length] + '80')
        starGlow.addColorStop(1, 'transparent')
        ctx.fillStyle = starGlow
        ctx.beginPath()
        ctx.arc(x, y, size * 2, 0, Math.PI * 2)
        ctx.fill()
      }
      
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(x, y, size * 0.3, 0, Math.PI * 2)
      ctx.fill()
    }
    
    drawParticles(ctx, width, height, colors)
  }

  const drawStarfield = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const starCount = Math.floor(500 + (settings.complexity / 100) * 1000)
    
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 2.5 + 0.5
      const brightness = Math.random()
      
      if (brightness > 0.95 && settings.glow) {
        const glowSize = size * 6
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize)
        glowGradient.addColorStop(0, colors.accent[i % colors.accent.length])
        glowGradient.addColorStop(0.5, colors.primary[i % colors.primary.length] + '80')
        glowGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(x, y, glowSize, 0, Math.PI * 2)
        ctx.fill()
      }
      
      ctx.fillStyle = colors.accent[i % colors.accent.length] + Math.floor(brightness * 255).toString(16).padStart(2, '0')
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
      
      if (brightness > 0.9) {
        ctx.strokeStyle = colors.accent[i % colors.accent.length] + Math.floor(brightness * 200).toString(16).padStart(2, '0')
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x - size * 3, y)
        ctx.lineTo(x + size * 3, y)
        ctx.moveTo(x, y - size * 3)
        ctx.lineTo(x, y + size * 3)
        ctx.stroke()
      }
    }
    
    for (let i = 0; i < 3; i++) {
      const shootingStartX = Math.random() * width
      const shootingStartY = Math.random() * height * 0.5
      const length = Math.random() * 200 + 100
      const angle = Math.PI / 4 + Math.random() * 0.3
      
      const gradient = ctx.createLinearGradient(
        shootingStartX,
        shootingStartY,
        shootingStartX + Math.cos(angle) * length,
        shootingStartY + Math.sin(angle) * length
      )
      gradient.addColorStop(0, colors.accent[i % colors.accent.length])
      gradient.addColorStop(1, 'transparent')
      
      ctx.strokeStyle = gradient
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(shootingStartX, shootingStartY)
      ctx.lineTo(shootingStartX + Math.cos(angle) * length, shootingStartY + Math.sin(angle) * length)
      ctx.stroke()
    }
  }

  const drawSacredGeometry = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2
    const centerY = height / 2
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const layers = Math.floor(8 + (settings.complexity / 100) * 12)
    
    for (let layer = 0; layer < layers; layer++) {
      const radius = (layer + 1) * (Math.min(width, height) / (layers * 2.5))
      const sides = 6
      
      if (settings.glow) {
        ctx.strokeStyle = colors.glow
        ctx.lineWidth = 8
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        for (let i = 0; i <= sides; i++) {
          const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      
      ctx.strokeStyle = colors.primary[layer % colors.primary.length]
      ctx.lineWidth = 3
      ctx.beginPath()
      for (let i = 0; i <= sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      
      ctx.strokeStyle = colors.accent[layer % colors.accent.length] + '80'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()
      
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        
        ctx.strokeStyle = colors.secondary[i % colors.secondary.length] + '60'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    }
    
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 80)
    centerGradient.addColorStop(0, colors.accent[0])
    centerGradient.addColorStop(0.5, colors.primary[0])
    centerGradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = centerGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, 80, 0, Math.PI * 2)
    ctx.fill()
    
    drawParticles(ctx, width, height, colors)
  }

  const drawCosmicMandala = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2
    const centerY = height / 2
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const layers = Math.floor(8 + (settings.complexity / 100) * 15)
    
    for (let layer = layers; layer > 0; layer--) {
      const radius = (layer / layers) * (Math.min(width, height) / 2) * 0.9
      const petals = layer * 8
      
      for (let i = 0; i < petals; i++) {
        const angle = (Math.PI * 2 * i) / petals
        const petalLength = radius * 0.4
        
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(angle)
        
        const gradient = ctx.createRadialGradient(radius, 0, 0, radius, 0, petalLength)
        gradient.addColorStop(0, colors.primary[layer % colors.primary.length])
        gradient.addColorStop(0.6, colors.secondary[layer % colors.secondary.length])
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.ellipse(radius, 0, petalLength, petalLength * 0.7, 0, 0, Math.PI * 2)
        ctx.fill()
        
        if (settings.glow) {
          ctx.fillStyle = colors.glow
          ctx.globalAlpha = 0.4
          ctx.beginPath()
          ctx.ellipse(radius, 0, petalLength * 1.3, petalLength * 0.9, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
        
        ctx.restore()
      }
      
      ctx.strokeStyle = colors.accent[layer % colors.accent.length]
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100)
    centerGradient.addColorStop(0, '#FFFFFF')
    centerGradient.addColorStop(0.4, colors.accent[0])
    centerGradient.addColorStop(1, colors.primary[0])
    
    ctx.fillStyle = centerGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, 100, 0, Math.PI * 2)
    ctx.fill()
    
    drawParticles(ctx, width, height, colors)
  }

  const drawCelestialPortal = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2
    const centerY = height / 2
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const rings = Math.floor(15 + (settings.complexity / 100) * 25)
    
    for (let i = rings; i > 0; i--) {
      const radius = (i / rings) * (Math.min(width, height) / 2) * 0.9
      
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.85, centerX, centerY, radius)
      gradient.addColorStop(0, 'transparent')
      gradient.addColorStop(0.5, colors.primary[i % colors.primary.length] + '90')
      gradient.addColorStop(1, colors.secondary[i % colors.secondary.length] + '50')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
      
      if (settings.glow && i % 3 === 0) {
        ctx.strokeStyle = colors.glow
        ctx.lineWidth = 4
        ctx.globalAlpha = 0.6
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      
      const segmentCount = 16
      for (let s = 0; s < segmentCount; s++) {
        const angle = (Math.PI * 2 * s) / segmentCount
        const x1 = centerX + Math.cos(angle) * radius * 0.6
        const y1 = centerY + Math.sin(angle) * radius * 0.6
        const x2 = centerX + Math.cos(angle) * radius
        const y2 = centerY + Math.sin(angle) * radius
        
        ctx.strokeStyle = colors.accent[s % colors.accent.length] + '80'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    }
    
    const voidGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150)
    voidGradient.addColorStop(0, '#000000')
    voidGradient.addColorStop(0.6, colors.accent[0])
    voidGradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = voidGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, 150, 0, Math.PI * 2)
    ctx.fill()
    
    drawParticles(ctx, width, height, colors)
  }

  const drawZodiacWheel = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2
    const centerY = height / 2
    const colors = COLOR_SCHEMES[settings.colorScheme]
    const radius = Math.min(width, height) / 2 * 0.85
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, colors.background)
    gradient.addColorStop(0.5, colors.primary[0] + '30')
    gradient.addColorStop(1, colors.secondary[0] + '60')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()
    
    const signs = 12
    const zodiacSymbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']
    
    for (let i = 0; i < signs; i++) {
      const angle = (Math.PI * 2 * i) / signs - Math.PI / 2
      const nextAngle = (Math.PI * 2 * (i + 1)) / signs - Math.PI / 2
      
      ctx.save()
      ctx.translate(centerX, centerY)
      
      ctx.fillStyle = i % 2 === 0 ? colors.primary[i % colors.primary.length] + '40' : colors.secondary[i % colors.secondary.length] + '40'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, radius, angle, nextAngle)
      ctx.closePath()
      ctx.fill()
      
      if (settings.glow) {
        ctx.strokeStyle = colors.glow
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      
      ctx.strokeStyle = colors.accent[i % colors.accent.length]
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
      ctx.stroke()
      
      const symbolAngle = angle + (nextAngle - angle) / 2
      const symbolRadius = radius * 0.7
      const symbolX = Math.cos(symbolAngle) * symbolRadius
      const symbolY = Math.sin(symbolAngle) * symbolRadius
      
      if (settings.glow) {
        ctx.shadowColor = colors.accent[i % colors.accent.length]
        ctx.shadowBlur = 20
      }
      
      ctx.fillStyle = colors.accent[i % colors.accent.length]
      ctx.font = 'bold 48px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(zodiacSymbols[i], symbolX, symbolY)
      
      ctx.shadowBlur = 0
      ctx.restore()
    }
    
    for (let ring = 0; ring < 4; ring++) {
      ctx.strokeStyle = colors.accent[ring % colors.accent.length]
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * (0.2 + ring * 0.27), 0, Math.PI * 2)
      ctx.stroke()
    }
    
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.15)
    centerGradient.addColorStop(0, '#FFFFFF')
    centerGradient.addColorStop(0.4, colors.accent[0])
    centerGradient.addColorStop(1, colors.primary[0])
    ctx.fillStyle = centerGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.15, 0, Math.PI * 2)
    ctx.fill()
    
    drawParticles(ctx, width, height, colors)
  }

  const drawLunarPhases = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const phases = 5
    const moonSize = width / 10
    const spacing = width / (phases + 1)
    
    for (let i = 0; i < phases; i++) {
      const x = spacing * (i + 1)
      const y = height / 2
      const phase = i / (phases - 1)
      
      if (settings.glow) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, moonSize * 2)
        glow.addColorStop(0, colors.primary[0] + 'CC')
        glow.addColorStop(0.5, colors.glow)
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y, moonSize * 2, 0, Math.PI * 2)
        ctx.fill()
      }
      
      const moonGradient = ctx.createRadialGradient(x - moonSize * 0.3, y - moonSize * 0.3, 0, x, y, moonSize)
      moonGradient.addColorStop(0, '#FFFFFF')
      moonGradient.addColorStop(0.5, colors.secondary[0])
      moonGradient.addColorStop(1, colors.primary[0])
      
      ctx.fillStyle = moonGradient
      ctx.beginPath()
      ctx.arc(x, y, moonSize, 0, Math.PI * 2)
      ctx.fill()
      
      const shadowX = x - moonSize + (phase * moonSize * 2)
      ctx.fillStyle = colors.background
      ctx.beginPath()
      ctx.arc(shadowX, y, moonSize, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.strokeStyle = colors.accent[i % colors.accent.length] + '80'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, moonSize, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    drawParticles(ctx, width, height, colors)
  }

  const drawPlanetaryAlignment = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const planets = [
      { size: 35, color: colors.accent[0], orbit: 0.9 },
      { size: 55, color: colors.primary[0], orbit: 1.3 },
      { size: 30, color: colors.secondary[0], orbit: 1.7 },
      { size: 65, color: colors.accent[1], orbit: 2.2 },
      { size: 45, color: colors.primary[1], orbit: 2.7 },
      { size: 50, color: colors.secondary[1], orbit: 3.2 }
    ]
    
    const centerX = width / 2
    const centerY = height / 2
    const baseOrbitRadius = Math.min(width, height) / 16
    
    planets.forEach((planet, index) => {
      const orbitRadius = baseOrbitRadius * planet.orbit
      
      ctx.strokeStyle = colors.accent[index % colors.accent.length] + '40'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 8])
      ctx.beginPath()
      ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      
      const angle = (index * Math.PI * 2) / planets.length
      const x = centerX + Math.cos(angle) * orbitRadius
      const y = centerY + Math.sin(angle) * orbitRadius
      
      if (settings.glow) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, planet.size * 2)
        glow.addColorStop(0, planet.color)
        glow.addColorStop(0.4, planet.color + 'AA')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y, planet.size * 2, 0, Math.PI * 2)
        ctx.fill()
      }
      
      const planetGradient = ctx.createRadialGradient(x - planet.size * 0.3, y - planet.size * 0.3, 0, x, y, planet.size)
      planetGradient.addColorStop(0, '#FFFFFF')
      planetGradient.addColorStop(0.3, planet.color)
      planetGradient.addColorStop(1, colors.primary[(index + 2) % colors.primary.length])
      
      ctx.fillStyle = planetGradient
      ctx.beginPath()
      ctx.arc(x, y, planet.size, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.strokeStyle = colors.accent[(index + 1) % colors.accent.length]
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(x, y, planet.size, 0, Math.PI * 2)
      ctx.stroke()
    })
    
    if (settings.glow) {
      const sunGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 120)
      sunGlow.addColorStop(0, '#FFFFFF')
      sunGlow.addColorStop(0.3, colors.accent[0])
      sunGlow.addColorStop(0.6, colors.primary[0] + 'AA')
      sunGlow.addColorStop(1, 'transparent')
      
      ctx.fillStyle = sunGlow
      ctx.beginPath()
      ctx.arc(centerX, centerY, 120, 0, Math.PI * 2)
      ctx.fill()
    }
    
    const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 70)
    sunGradient.addColorStop(0, '#FFFFFF')
    sunGradient.addColorStop(0.4, colors.accent[0])
    sunGradient.addColorStop(0.8, colors.primary[0])
    sunGradient.addColorStop(1, colors.secondary[0])
    
    ctx.fillStyle = sunGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, 70, 0, Math.PI * 2)
    ctx.fill()
    
    drawParticles(ctx, width, height, colors)
  }

  const generateImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return
    
    setIsGenerating(true)
    
    setTimeout(() => {
      const width = canvas.width
      const height = canvas.height
      
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      switch (settings.style) {
        case 'solar-burst':
          drawSolarBurst(ctx, width, height)
          break
        case 'lunar-phases':
          drawLunarPhases(ctx, width, height)
          break
        case 'cosmic-mandala':
          drawCosmicMandala(ctx, width, height)
          break
        case 'celestial-portal':
          drawCelestialPortal(ctx, width, height)
          break
        case 'zodiac-wheel':
          drawZodiacWheel(ctx, width, height)
          break
        case 'planetary-alignment':
          drawPlanetaryAlignment(ctx, width, height)
          break
        case 'nebula-cloud':
          drawNebulaCloud(ctx, width, height)
          break
        case 'starfield':
          drawStarfield(ctx, width, height)
          break
        case 'sacred-geometry':
          drawSacredGeometry(ctx, width, height)
          break
      }
      
      setIsGenerating(false)
      toast.success('High-quality image generated!')
    }, 100)
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const link = document.createElement('a')
    const resolution = settings.resolution === 'ultra' ? '2048x2048' : '1200x1200'
    link.download = `mystical-${settings.style}-${resolution}-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
    
    toast.success('High-quality image downloaded!')
  }

  useEffect(() => {
    generateImage()
  }, [settings.style, settings.colorScheme, settings.complexity, settings.particles, settings.glow, settings.resolution])

  const canvasSize = getCanvasSize()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-4xl font-bold text-white font-display">Mystical Image Generator</h2>
          <p className="text-white/70 mt-2 text-lg">
            Create stunning high-quality mystical and solar-themed images for your blog posts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-accent/30 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Sparkle weight="fill" className="text-accent" />
                Settings
              </CardTitle>
              <CardDescription className="text-white/70">
                Customize your mystical image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="style" className="text-white text-base">Image Style</Label>
                <Select
                  value={settings.style}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, style: value as ImageStyle }))}
                >
                  <SelectTrigger id="style" className="bg-card text-white border-border h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="solar-burst" className="text-white">
                      <div className="flex items-center gap-2">
                        <Sun weight="fill" className="text-accent" />
                        Solar Burst
                      </div>
                    </SelectItem>
                    <SelectItem value="lunar-phases" className="text-white">
                      <div className="flex items-center gap-2">
                        <Moon weight="fill" className="text-accent" />
                        Lunar Phases
                      </div>
                    </SelectItem>
                    <SelectItem value="cosmic-mandala" className="text-white">
                      <div className="flex items-center gap-2">
                        <Sparkle weight="fill" className="text-accent" />
                        Cosmic Mandala
                      </div>
                    </SelectItem>
                    <SelectItem value="celestial-portal" className="text-white">
                      <div className="flex items-center gap-2">
                        <Star weight="fill" className="text-accent" />
                        Celestial Portal
                      </div>
                    </SelectItem>
                    <SelectItem value="zodiac-wheel" className="text-white">
                      <div className="flex items-center gap-2">
                        <Spiral weight="fill" className="text-accent" />
                        Zodiac Wheel
                      </div>
                    </SelectItem>
                    <SelectItem value="planetary-alignment" className="text-white">
                      <div className="flex items-center gap-2">
                        <Star weight="fill" className="text-accent" />
                        Planetary Alignment
                      </div>
                    </SelectItem>
                    <SelectItem value="nebula-cloud" className="text-white">
                      <div className="flex items-center gap-2">
                        <Sparkle weight="fill" className="text-accent" />
                        Nebula Cloud
                      </div>
                    </SelectItem>
                    <SelectItem value="starfield" className="text-white">
                      <div className="flex items-center gap-2">
                        <Star weight="fill" className="text-accent" />
                        Starfield
                      </div>
                    </SelectItem>
                    <SelectItem value="sacred-geometry" className="text-white">
                      <div className="flex items-center gap-2">
                        <Atom weight="fill" className="text-accent" />
                        Sacred Geometry
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color-scheme" className="text-white text-base">Color Scheme</Label>
                <Select
                  value={settings.colorScheme}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, colorScheme: value as ColorScheme }))}
                >
                  <SelectTrigger id="color-scheme" className="bg-card text-white border-border h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
                      <SelectItem key={key} value={key} className="text-white">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {scheme.primary.slice(0, 4).map((color, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded-full border border-white/30"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          {scheme.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolution" className="text-white text-base">Resolution</Label>
                <Select
                  value={settings.resolution}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, resolution: value as 'high' | 'ultra' }))}
                >
                  <SelectTrigger id="resolution" className="bg-card text-white border-border h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="high" className="text-white">High Quality (1200×1200)</SelectItem>
                    <SelectItem value="ultra" className="text-white">Ultra Quality (2048×2048)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complexity" className="text-white text-base">
                  Detail Level: {settings.complexity}%
                </Label>
                <Slider
                  id="complexity"
                  value={[settings.complexity]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, complexity: value }))}
                  min={30}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label htmlFor="particles" className="text-white text-base">Particle Effects</Label>
                <Switch
                  id="particles"
                  checked={settings.particles}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, particles: checked }))}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label htmlFor="glow" className="text-white text-base">Glow Effects</Label>
                <Switch
                  id="glow"
                  checked={settings.glow}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, glow: checked }))}
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button
                  onClick={generateImage}
                  disabled={isGenerating}
                  className="flex-1 h-12 text-base"
                  size="lg"
                >
                  <ArrowsClockwise className="mr-2" weight="bold" />
                  {isGenerating ? 'Generating...' : 'Regenerate'}
                </Button>
                <Button
                  onClick={downloadImage}
                  variant="outline"
                  className="flex-1 h-12 text-base border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  size="lg"
                >
                  <Download className="mr-2" weight="bold" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/30 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Preview</CardTitle>
              <CardDescription className="text-white/70">
                Your generated mystical image
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-accent/40 bg-black shadow-2xl">
                <canvas
                  ref={canvasRef}
                  width={canvasSize}
                  height={canvasSize}
                  className="w-full h-full"
                />
              </div>
              <p className="text-sm text-white/60 mt-4 text-center font-mono">
                {canvasSize} × {canvasSize} pixels • PNG format • High Quality
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-accent/30 bg-accent/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Sparkle weight="fill" className="text-accent" />
              Style Guide & Usage Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-white/80 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-white">☀️ Solar Burst</p>
              <p className="text-xs">Energetic transits, Leo season, solar eclipses, power themes</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">🌙 Lunar Phases</p>
              <p className="text-xs">Moon cycles, Cancer season, lunar eclipses, emotional content</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">✨ Cosmic Mandala</p>
              <p className="text-xs">Meditation, spiritual growth, holistic astrology topics</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">🌀 Celestial Portal</p>
              <p className="text-xs">Transformation, Pluto transits, deep spiritual work</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">♈ Zodiac Wheel</p>
              <p className="text-xs">General astrology, birth charts, zodiac overviews</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">🪐 Planetary Alignment</p>
              <p className="text-xs">Transits, retrograde periods, cosmic events</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">🌌 Nebula Cloud</p>
              <p className="text-xs">Cosmic mysteries, Neptune themes, dreamy content</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">⭐ Starfield</p>
              <p className="text-xs">Wishes, aspirations, destiny, cosmic consciousness</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">🔯 Sacred Geometry</p>
              <p className="text-xs">Universal patterns, mathematical harmony, divine proportion</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
