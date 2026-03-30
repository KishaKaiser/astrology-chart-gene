import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { ChartData } from '@/lib/astrology-types'
import { KarmicRelationshipData, generateKarmicRelationshipData } from '@/lib/karmic-calc'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sparkle, Eye, Moon, Infinity, MagicWand, ArrowsClockwise } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export function KarmicRelationship() {
  const [charts] = useKV<ChartData[]>('astrology-charts', [])
  const [person1Id, setPerson1Id] = useState<string>('')
  const [person2Id, setPerson2Id] = useState<string>('')
  const [karmicData, setKarmicData] = useState<KarmicRelationshipData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiInterpretation, setAiInterpretation] = useState<string>('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  const handleGenerateKarmicAnalysis = async () => {
    if (!person1Id || !person2Id) {
      toast.error('Please select both individuals')
      return
    }

    if (person1Id === person2Id) {
      toast.error('Please select two different individuals')
      return
    }

    const chart1 = charts?.find(c => c.id === person1Id)
    const chart2 = charts?.find(c => c.id === person2Id)

    if (!chart1 || !chart2) {
      toast.error('Could not find selected charts')
      return
    }

    setIsGenerating(true)
    setAiInterpretation('')
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      const data = generateKarmicRelationshipData(chart1, chart2)
      setKarmicData(data)
      toast.success('Karmic analysis complete!')
    } catch (error) {
      console.error('Karmic analysis error:', error)
      toast.error('Failed to generate karmic relationship analysis')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateAIInterpretation = async () => {
    if (!karmicData) return

    setIsGeneratingAI(true)
    try {
      const chart1 = charts?.find(c => c.id === person1Id)
      const chart2 = charts?.find(c => c.id === person2Id)

      if (!chart1 || !chart2) {
        toast.error('Chart data not found')
        return
      }

      const connectionsSummary = karmicData.connections
        .map(c => `${c.theme}: ${c.pastLifeRole} - Lesson: ${c.lessonToLearn}`)
        .join('\n')

      const indicatorsSummary = karmicData.karmicIndicators
        .map(i => `${i.icon} ${i.description} (Strength: ${i.strength}%)`)
        .join('\n')

      const topAspects = karmicData.karmicAspects
        .filter(a => a.significance === 'high')
        .slice(0, 8)
        .map(a => `${chart1.name}'s ${a.person1Planet} ${a.type} ${chart2.name}'s ${a.person2Planet} (${a.interpretation})`)
        .join('\n')

      const prompt = (window.spark.llmPrompt as any)`You are an expert astrologer specializing in karmic relationships, soul contracts, and past life connections.

Generate a deeply insightful karmic relationship interpretation for these two individuals:

Person 1: ${chart1.name}
Birth: ${chart1.date} at ${chart1.time} in ${chart1.location}

Person 2: ${chart2.name}
Birth: ${chart2.date} at ${chart2.time} in ${chart2.location}

Overall Karmic Score: ${karmicData.overallKarmicScore}%
Relationship Type: ${karmicData.relationshipType}

Karmic Connections Identified:
${connectionsSummary}

Karmic Indicators:
${indicatorsSummary}

Key Karmic Aspects:
${topAspects}

Provide a comprehensive karmic relationship interpretation that includes:

1. **Past Life Overview** (2-3 paragraphs): Describe the most likely past life scenario these souls shared. Be vivid and specific - what era, what roles, what circumstances brought them together and separated them. Make it feel like a real story.

2. **The Karmic Contract** (1-2 paragraphs): Explain what soul agreement or contract they made before this lifetime. What did they promise to help each other learn or heal?

3. **Recognition Signs** (1 paragraph): Describe the feeling of recognition they likely experienced when they met - that sense of "knowing" each other, déjà vu, or instant connection (or repulsion). Explain what this means karmically.

4. **Karmic Lessons** (1 paragraph): Detail the specific lessons each person needs to learn from this relationship. How does the other person trigger growth?

5. **Unfinished Business** (1 paragraph): What was left incomplete in past lives that this relationship helps resolve? What patterns are repeating that need to be healed?

6. **Gifts and Strengths** (1 paragraph): What natural gifts, talents, or understanding do they bring to each other from their past life connection? What comes easily between them?

7. **Challenges and Shadow Work** (1 paragraph): What karmic debts or difficult patterns must be faced? Where might old wounds resurface?

8. **Path Forward** (1-2 paragraphs): Guidance on how to honor this karmic connection in a healthy way. How can they complete their karmic contract and evolve together (or apart) with grace?

Write in a mystical yet grounded tone, using "you" and "your soul companion" language as if speaking to one person about their karmic bond. Be specific, evocative, and deeply meaningful. This should feel like a sacred revelation about their soul connection.`

      const response = await window.spark.llm(prompt, 'gpt-4o')
      setAiInterpretation(response)
      toast.success('Karmic interpretation revealed!')
    } catch (error) {
      console.error('AI interpretation error:', error)
      toast.error('Failed to generate AI interpretation. Please try again.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-purple-400'
    if (score >= 50) return 'text-blue-400'
    if (score >= 30) return 'text-cyan-400'
    return 'text-slate-400'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 75) return 'from-purple-500 to-fuchsia-500'
    if (score >= 50) return 'from-blue-500 to-indigo-500'
    if (score >= 30) return 'from-cyan-500 to-teal-500'
    return 'from-slate-500 to-gray-500'
  }

  const getSignificanceStyle = (significance: 'high' | 'medium' | 'low') => {
    switch (significance) {
      case 'high':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      case 'medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      case 'low':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    }
  }

  if (!charts || charts.length < 2) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-accent/20 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-accent/10">
                <Infinity className="w-12 h-12 text-accent" weight="fill" />
              </div>
            </div>
            <CardTitle className="text-3xl font-semibold text-white">Karmic Relationship Analysis</CardTitle>
            <CardDescription className="text-white/70 text-base">
              Explore past life connections and soul contracts between two people
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You need at least two saved natal charts to perform a karmic relationship analysis.
            </p>
            <p className="text-sm text-muted-foreground">
              Switch to the Chart Library tab and create natal charts for both individuals.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-accent/20 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 via-accent to-fuchsia-500 animate-pulse">
                <Infinity className="w-12 h-12 text-white" weight="fill" />
              </div>
            </div>
            <CardTitle className="text-3xl font-semibold text-white">Karmic Relationship Analysis</CardTitle>
            <CardDescription className="text-white/70 text-base">
              Uncover the soul contract and past life connections between two people
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-white">First Soul</label>
                <Select value={person1Id} onValueChange={setPerson1Id}>
                  <SelectTrigger className="border-input bg-background/50 text-white">
                    <SelectValue placeholder="Select first person" />
                  </SelectTrigger>
                  <SelectContent>
                    {charts.map(chart => (
                      <SelectItem key={chart.id} value={chart.id}>
                        {chart.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-white">Second Soul</label>
                <Select value={person2Id} onValueChange={setPerson2Id}>
                  <SelectTrigger className="border-input bg-background/50 text-white">
                    <SelectValue placeholder="Select second person" />
                  </SelectTrigger>
                  <SelectContent>
                    {charts.map(chart => (
                      <SelectItem key={chart.id} value={chart.id}>
                        {chart.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerateKarmicAnalysis}
              disabled={!person1Id || !person2Id || isGenerating}
              className="w-full bg-gradient-to-r from-purple-500 via-accent to-fuchsia-500 hover:from-purple-600 hover:via-accent/90 hover:to-fuchsia-600 text-white font-medium py-6 text-lg"
            >
              {isGenerating ? (
                <>
                  <Moon className="mr-2 animate-spin" weight="fill" />
                  Accessing Akashic Records...
                </>
              ) : (
                <>
                  <Eye className="mr-2" weight="fill" />
                  Reveal Karmic Connection
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {karmicData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card className="border-accent/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-white">
                    {karmicData.person1.name} ∞ {karmicData.person2.name}
                  </CardTitle>
                  <CardDescription className="text-white/70 text-lg mt-2">
                    {karmicData.relationshipType}
                  </CardDescription>
                </div>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(karmicData.overallKarmicScore)}`}>
                    {karmicData.overallKarmicScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Karmic Bond</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Progress 
                  value={karmicData.overallKarmicScore} 
                  className="h-4 bg-muted/30"
                />
                <div 
                  className={`absolute inset-0 h-4 bg-gradient-to-r ${getScoreGradient(karmicData.overallKarmicScore)} rounded-full transition-all duration-500`}
                  style={{ width: `${karmicData.overallKarmicScore}%` }}
                />
              </div>
              <p className="text-center text-white/90 italic">
                "Your souls recognize each other from lifetimes past..."
              </p>
            </CardContent>
          </Card>

          {karmicData.connections.length > 0 && (
            <Card className="border-accent/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Infinity weight="fill" className="text-accent" />
                  Karmic Connections
                </CardTitle>
                <CardDescription className="text-white/70">
                  The soul bonds that unite you across lifetimes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {karmicData.connections.map((connection, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-6 rounded-lg bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-2xl font-semibold text-accent">{connection.theme}</h3>
                      <Badge variant="outline" className="text-accent border-accent/40">
                        {connection.strength}% Strength
                      </Badge>
                    </div>
                    <div className="space-y-3 text-white/90">
                      <div>
                        <span className="text-accent font-medium">Past Life Role:</span>
                        <p className="mt-1">{connection.pastLifeRole}</p>
                      </div>
                      <Separator className="opacity-20" />
                      <div>
                        <span className="text-accent font-medium">Lesson to Learn:</span>
                        <p className="mt-1">{connection.lessonToLearn}</p>
                      </div>
                      <Separator className="opacity-20" />
                      <div>
                        <span className="text-accent font-medium">Gift to Share:</span>
                        <p className="mt-1">{connection.giftToShare}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}

          {karmicData.karmicIndicators.length > 0 && (
            <Card className="border-accent/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Sparkle weight="fill" className="text-accent" />
                  Karmic Indicators
                </CardTitle>
                <CardDescription className="text-white/70">
                  Astrological signatures revealing your soul connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {karmicData.karmicIndicators.map((indicator, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{indicator.icon}</span>
                        <div>
                          <div className="font-medium text-white">{indicator.description}</div>
                          <div className="text-sm text-muted-foreground capitalize">{indicator.type} connection</div>
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(indicator.strength)}`}>
                        {indicator.strength}%
                      </div>
                    </div>
                    <Progress value={indicator.strength} className="h-2" />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-accent/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl text-white">Karmic Aspects</CardTitle>
              <CardDescription className="text-white/70">
                Planetary connections revealing your karmic ties ({karmicData.karmicAspects.length} aspects found)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {karmicData.karmicAspects.slice(0, 15).map((aspect, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * index }}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Badge 
                        className={getSignificanceStyle(aspect.significance)}
                      >
                        {aspect.significance}
                      </Badge>
                      <span className="text-white font-medium">
                        {karmicData.person1.name}'s {aspect.person1Planet}
                      </span>
                      <span className="text-muted-foreground">{aspect.type}</span>
                      <span className="text-white font-medium">
                        {karmicData.person2.name}'s {aspect.person2Planet}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground ml-4">
                      {aspect.orb.toFixed(1)}° orb
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {karmicData.karmicAspects.length > 15 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Showing top 15 of {karmicData.karmicAspects.length} karmic aspects
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <MagicWand weight="fill" className="text-accent" />
                    AI Karmic Reading
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Deep soul-level interpretation of your karmic bond
                  </CardDescription>
                </div>
                {!aiInterpretation && (
                  <Button
                    onClick={handleGenerateAIInterpretation}
                    disabled={isGeneratingAI}
                    className="bg-gradient-to-r from-purple-500 via-accent to-fuchsia-500 hover:from-purple-600 hover:via-accent/90 hover:to-fuchsia-600 text-white"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Moon className="mr-2 animate-spin" weight="fill" />
                        Channeling...
                      </>
                    ) : (
                      <>
                        <MagicWand className="mr-2" weight="fill" />
                        Reveal Past Lives
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {aiInterpretation ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="prose prose-invert max-w-none">
                    <div className="text-white/90 whitespace-pre-wrap leading-relaxed">
                      {aiInterpretation}
                    </div>
                  </div>
                  <Separator className="my-6" />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleGenerateAIInterpretation}
                      disabled={isGeneratingAI}
                      variant="outline"
                      size="sm"
                      className="border-accent/30 text-accent hover:bg-accent/10"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Moon className="mr-2 animate-spin" weight="fill" />
                          Channeling...
                        </>
                      ) : (
                        <>
                          <ArrowsClockwise className="mr-2" weight="bold" />
                          Regenerate
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-accent/10">
                      <Moon className="w-8 h-8 text-accent" weight="fill" />
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Unlock the full story of your past life connection
                  </p>
                  <p className="text-sm text-white/60">
                    Our AI astrologer will channel deep insights about your soul bond, past life experiences together, and the karmic lessons you're here to complete.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
