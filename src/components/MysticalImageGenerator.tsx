import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { Download, ArrowsClockwise, Sparkle, Sun, Moon, Star } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

type ImageStyle = 'solar-burst' | 'lunar-phases' | 'cosmic-mandala' | 'celestial-portal' | 'zodiac-wheel' | 'planetary-alignment'
type ColorScheme = 'golden-sun' | 'purple-mystic' | 'blue-moon' | 'rainbow-spectrum' | 'deep-space' | 'aurora-borealis'

interface GeneratorSettings {
  style: ImageStyle
  colorScheme: ColorScheme
  complexity: number
  animation: boolean
}

const COLOR_SCHEMES = {
  'golden-sun': {
    name: 'Golden Sun',
    primary: ['#FFD700', '#FFA500', '#FF8C00'],
    secondary: ['#FFE4B5', '#FFDAB9', '#EEE8AA'],
    accent: ['#FF6347', '#FF4500', '#DC143C'],
    background: '#1a0f0a'
  },
  'purple-mystic': {
    name: 'Purple Mystic',
    primary: ['#9370DB', '#8A2BE2', '#9932CC'],
    secondary: ['#E6E6FA', '#DDA0DD', '#DA70D6'],
    accent: ['#FF00FF', '#BA55D3', '#9400D3'],
    background: '#0a0515'
  },
  'blue-moon': {
    name: 'Blue Moon',
    primary: ['#4169E1', '#6495ED', '#00BFFF'],
    secondary: ['#B0E0E6', '#ADD8E6', '#87CEEB'],
    accent: ['#00CED1', '#48D1CC', '#40E0D0'],
    background: '#050a15'
  },
  'rainbow-spectrum': {
    name: 'Rainbow Spectrum',
    primary: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'],
    secondary: ['#FF69B4', '#FFD700', '#00FA9A'],
    accent: ['#FF1493', '#00FFFF', '#FF6347'],
    background: '#0a0a0a'
  },
  'deep-space': {
    name: 'Deep Space',
    primary: ['#1E3A8A', '#312E81', '#1E1B4B'],
    secondary: ['#60A5FA', '#818CF8', '#A78BFA'],
    accent: ['#FBBF24', '#F59E0B', '#FFFFFF'],
    background: '#000000'
  },
  'aurora-borealis': {
    name: 'Aurora Borealis',
    primary: ['#00FF7F', '#00FA9A', '#7FFFD4'],
    secondary: ['#FF1493', '#FF69B4', '#FFB6C1'],
    accent: ['#9370DB', '#BA55D3', '#DDA0DD'],
    background: '#001a1a'
  }
}

export function MysticalImageGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  
  const [settings, setSettings] = useState<GeneratorSettings>({
    style: 'solar-burst',
    colorScheme: 'golden-sun',
    complexity: 50,
    animation: false
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [animationTime, setAnimationTime] = useState(0)

  const drawSolarBurst = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    const centerX = width / 2
    const centerY = height / 2
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const rayCount = Math.floor(20 + (settings.complexity / 100) * 30)
    
    for (let i = 0; i < rayCount; i++) {
      const angle = (Math.PI * 2 * i) / rayCount + time * 0.001
      const length = 300 + Math.sin(time * 0.002 + i) * 50
      
      const gradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX + Math.cos(angle) * length,
        centerY + Math.sin(angle) * length
      )
      
      gradient.addColorStop(0, colors.primary[i % colors.primary.length])
      gradient.addColorStop(0.7, colors.secondary[i % colors.secondary.length])
      gradient.addColorStop(1, 'transparent')
      
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(angle)
      ctx.fillStyle = gradient
      ctx.fillRect(0, -30, length, 60)
      ctx.restore()
    }
    
    const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150)
    sunGradient.addColorStop(0, colors.accent[0])
    sunGradient.addColorStop(0.5, colors.primary[0])
    sunGradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = sunGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, 150, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = colors.accent[1]
    ctx.beginPath()
    ctx.arc(centerX, centerY, 80, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawLunarPhases = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const phases = 5
    const moonSize = 80
    const spacing = width / (phases + 1)
    
    for (let i = 0; i < phases; i++) {
      const x = spacing * (i + 1)
      const y = height / 2
      const phase = i / (phases - 1)
      
      const glow = ctx.createRadialGradient(x, y, 0, x, y, moonSize * 1.5)
      glow.addColorStop(0, colors.primary[0] + '80')
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(x, y, moonSize * 1.5, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = colors.secondary[0]
      ctx.beginPath()
      ctx.arc(x, y, moonSize, 0, Math.PI * 2)
      ctx.fill()
      
      const shadowX = x - moonSize + (phase * moonSize * 2)
      ctx.fillStyle = colors.background
      ctx.beginPath()
      ctx.arc(shadowX, y, moonSize, 0, Math.PI * 2)
      ctx.fill()
    }
    
    for (let i = 0; i < 100; i++) {
      const sx = Math.random() * width
      const sy = Math.random() * height
      const size = Math.random() * 2
      
      ctx.fillStyle = colors.accent[Math.floor(Math.random() * colors.accent.length)]
      ctx.beginPath()
      ctx.arc(sx, sy, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawCosmicMandala = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    const centerX = width / 2
    const centerY = height / 2
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const layers = Math.floor(5 + (settings.complexity / 100) * 10)
    
    for (let layer = layers; layer > 0; layer--) {
      const radius = (layer / layers) * (Math.min(width, height) / 2) * 0.9
      const petals = layer * 6
      
      for (let i = 0; i < petals; i++) {
        const angle = (Math.PI * 2 * i) / petals + time * 0.0005 * layer
        const petalLength = radius * 0.3
        
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(angle)
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, petalLength)
        gradient.addColorStop(0, colors.primary[layer % colors.primary.length])
        gradient.addColorStop(0.8, colors.secondary[layer % colors.secondary.length])
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.ellipse(radius, 0, petalLength, petalLength * 0.6, 0, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.restore()
      }
      
      ctx.strokeStyle = colors.accent[layer % colors.accent.length]
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50)
    centerGradient.addColorStop(0, colors.accent[0])
    centerGradient.addColorStop(1, colors.primary[0])
    
    ctx.fillStyle = centerGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, 50, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawCelestialPortal = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    const centerX = width / 2
    const centerY = height / 2
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const rings = Math.floor(10 + (settings.complexity / 100) * 20)
    
    for (let i = rings; i > 0; i--) {
      const radius = (i / rings) * (Math.min(width, height) / 2) * 0.9
      const rotation = time * 0.0003 * (i % 2 === 0 ? 1 : -1)
      
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.9, centerX, centerY, radius)
      gradient.addColorStop(0, 'transparent')
      gradient.addColorStop(0.5, colors.primary[i % colors.primary.length] + '80')
      gradient.addColorStop(1, colors.secondary[i % colors.secondary.length] + '40')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
      
      const segmentCount = 12
      for (let s = 0; s < segmentCount; s++) {
        const angle = (Math.PI * 2 * s) / segmentCount + rotation
        const x1 = centerX + Math.cos(angle) * radius * 0.7
        const y1 = centerY + Math.sin(angle) * radius * 0.7
        const x2 = centerX + Math.cos(angle) * radius
        const y2 = centerY + Math.sin(angle) * radius
        
        ctx.strokeStyle = colors.accent[s % colors.accent.length] + '60'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    }
    
    const voidGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100)
    voidGradient.addColorStop(0, '#000000')
    voidGradient.addColorStop(0.7, colors.accent[0])
    voidGradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = voidGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, 100, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawZodiacWheel = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    const centerX = width / 2
    const centerY = height / 2
    const colors = COLOR_SCHEMES[settings.colorScheme]
    const radius = Math.min(width, height) / 2 * 0.85
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, colors.background)
    gradient.addColorStop(0.5, colors.primary[0] + '20')
    gradient.addColorStop(1, colors.secondary[0] + '40')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()
    
    const signs = 12
    const rotation = time * 0.0002
    
    for (let i = 0; i < signs; i++) {
      const angle = (Math.PI * 2 * i) / signs + rotation - Math.PI / 2
      const nextAngle = (Math.PI * 2 * (i + 1)) / signs + rotation - Math.PI / 2
      
      ctx.save()
      ctx.translate(centerX, centerY)
      
      ctx.fillStyle = i % 2 === 0 ? colors.primary[i % colors.primary.length] + '30' : colors.secondary[i % colors.secondary.length] + '30'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, radius, angle, nextAngle)
      ctx.closePath()
      ctx.fill()
      
      ctx.strokeStyle = colors.accent[i % colors.accent.length]
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
      ctx.stroke()
      
      const symbolAngle = angle + (nextAngle - angle) / 2
      const symbolRadius = radius * 0.7
      const symbolX = Math.cos(symbolAngle) * symbolRadius
      const symbolY = Math.sin(symbolAngle) * symbolRadius
      
      ctx.fillStyle = colors.accent[i % colors.accent.length]
      ctx.font = 'bold 24px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('✦', symbolX, symbolY)
      
      ctx.restore()
    }
    
    for (let ring = 0; ring < 3; ring++) {
      ctx.strokeStyle = colors.accent[ring % colors.accent.length]
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * (0.3 + ring * 0.35), 0, Math.PI * 2)
      ctx.stroke()
    }
    
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.2)
    centerGradient.addColorStop(0, colors.accent[0])
    centerGradient.addColorStop(1, colors.primary[0])
    ctx.fillStyle = centerGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawPlanetaryAlignment = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    const colors = COLOR_SCHEMES[settings.colorScheme]
    
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)
    
    const planets = [
      { size: 30, color: colors.accent[0], orbit: 0.8, speed: 0.5 },
      { size: 45, color: colors.primary[0], orbit: 1.2, speed: 0.3 },
      { size: 25, color: colors.secondary[0], orbit: 1.5, speed: 0.7 },
      { size: 50, color: colors.accent[1], orbit: 2.0, speed: 0.2 },
      { size: 35, color: colors.primary[1], orbit: 2.5, speed: 0.4 },
      { size: 40, color: colors.secondary[1], orbit: 3.0, speed: 0.15 }
    ]
    
    const centerX = width / 2
    const centerY = height / 2
    const baseOrbitRadius = 50
    
    planets.forEach((planet, index) => {
      const orbitRadius = baseOrbitRadius * planet.orbit
      
      ctx.strokeStyle = colors.accent[index % colors.accent.length] + '30'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      
      const angle = time * 0.001 * planet.speed
      const x = centerX + Math.cos(angle) * orbitRadius
      const y = centerY + Math.sin(angle) * orbitRadius
      
      const glow = ctx.createRadialGradient(x, y, 0, x, y, planet.size * 1.5)
      glow.addColorStop(0, planet.color)
      glow.addColorStop(0.5, planet.color + '80')
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(x, y, planet.size * 1.5, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = planet.color
      ctx.beginPath()
      ctx.arc(x, y, planet.size, 0, Math.PI * 2)
      ctx.fill()
      
      const rimColor = colors.accent[(index + 1) % colors.accent.length]
      ctx.strokeStyle = rimColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, planet.size, 0, Math.PI * 2)
      ctx.stroke()
    })
    
    const starCount = 150
    for (let i = 0; i < starCount; i++) {
      const sx = Math.random() * width
      const sy = Math.random() * height
      const size = Math.random() * 2 + 0.5
      const brightness = Math.sin(time * 0.003 + i) * 0.5 + 0.5
      
      ctx.fillStyle = colors.accent[i % colors.accent.length] + Math.floor(brightness * 255).toString(16).padStart(2, '0')
      ctx.beginPath()
      ctx.arc(sx, sy, size, 0, Math.PI * 2)
      ctx.fill()
    }
    
    const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60)
    sunGradient.addColorStop(0, '#FFFFFF')
    sunGradient.addColorStop(0.3, colors.accent[0])
    sunGradient.addColorStop(0.7, colors.primary[0])
    sunGradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = sunGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, 60, 0, Math.PI * 2)
    ctx.fill()
  }

  const generateImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    setIsGenerating(true)
    
    setTimeout(() => {
      const width = canvas.width
      const height = canvas.height
      
      switch (settings.style) {
        case 'solar-burst':
          drawSolarBurst(ctx, width, height, animationTime)
          break
        case 'lunar-phases':
          drawLunarPhases(ctx, width, height, animationTime)
          break
        case 'cosmic-mandala':
          drawCosmicMandala(ctx, width, height, animationTime)
          break
        case 'celestial-portal':
          drawCelestialPortal(ctx, width, height, animationTime)
          break
        case 'zodiac-wheel':
          drawZodiacWheel(ctx, width, height, animationTime)
          break
        case 'planetary-alignment':
          drawPlanetaryAlignment(ctx, width, height, animationTime)
          break
      }
      
      setIsGenerating(false)
      toast.success('Image generated successfully!')
    }, 100)
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const link = document.createElement('a')
    link.download = `mystical-${settings.style}-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    
    toast.success('Image downloaded!')
  }

  useEffect(() => {
    generateImage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.style, settings.colorScheme, settings.complexity])

  useEffect(() => {
    if (settings.animation) {
      const animate = () => {
        setAnimationTime(prev => prev + 16)
        generateImage()
        animationFrameRef.current = requestAnimationFrame(animate)
      }
      animationFrameRef.current = requestAnimationFrame(animate)
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.animation, settings.style, settings.colorScheme, settings.complexity])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-3xl font-bold text-white">Mystical Image Generator</h2>
          <p className="text-white/70 mt-1">
            Create stunning mystical and solar-themed images for your blog posts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Sparkle weight="fill" className="text-accent" />
                Settings
              </CardTitle>
              <CardDescription className="text-white/70">
                Customize your mystical image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="style" className="text-white">Image Style</Label>
                <Select
                  value={settings.style}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, style: value as ImageStyle }))}
                >
                  <SelectTrigger id="style" className="bg-card text-white border-border">
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
                        <ArrowsClockwise weight="fill" className="text-accent" />
                        Zodiac Wheel
                      </div>
                    </SelectItem>
                    <SelectItem value="planetary-alignment" className="text-white">
                      <div className="flex items-center gap-2">
                        <Star weight="fill" className="text-accent" />
                        Planetary Alignment
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color-scheme" className="text-white">Color Scheme</Label>
                <Select
                  value={settings.colorScheme}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, colorScheme: value as ColorScheme }))}
                >
                  <SelectTrigger id="color-scheme" className="bg-card text-white border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
                      <SelectItem key={key} value={key} className="text-white">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {scheme.primary.slice(0, 3).map((color, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-full border border-white/20"
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
                <Label htmlFor="complexity" className="text-white">
                  Complexity: {settings.complexity}%
                </Label>
                <Slider
                  id="complexity"
                  value={[settings.complexity]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, complexity: value }))}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button
                  onClick={generateImage}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <ArrowsClockwise className="mr-2" weight="bold" />
                  {isGenerating ? 'Generating...' : 'Regenerate'}
                </Button>
                <Button
                  onClick={downloadImage}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2" weight="bold" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-white">Preview</CardTitle>
              <CardDescription className="text-white/70">
                Your generated mystical image
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-accent/30 bg-black">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={800}
                  className="w-full h-full"
                />
              </div>
              <p className="text-xs text-white/50 mt-3 text-center">
                800 × 800 pixels • PNG format
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-lg text-white">💡 Usage Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-white/80 text-sm">
            <p>
              <strong className="text-white">Solar Burst:</strong> Perfect for blog posts about energetic transits, Leo season, or solar eclipses
            </p>
            <p>
              <strong className="text-white">Lunar Phases:</strong> Ideal for moon-related content, Cancer season, or lunar eclipse posts
            </p>
            <p>
              <strong className="text-white">Cosmic Mandala:</strong> Great for meditation, spiritual growth, or holistic astrology topics
            </p>
            <p>
              <strong className="text-white">Celestial Portal:</strong> Excellent for transformation themes, Pluto transits, or deep spiritual work
            </p>
            <p>
              <strong className="text-white">Zodiac Wheel:</strong> Best for general astrology posts, birth chart topics, or zodiac overviews
            </p>
            <p>
              <strong className="text-white">Planetary Alignment:</strong> Perfect for planetary transit posts, retrograde periods, or cosmic events
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
