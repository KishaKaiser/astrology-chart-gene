import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { ChartData } from '@/lib/astrology-types'
import { SynastryData, generateSynastryData } from '@/lib/synastry-calc'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Heart, Sparkle, Fire, MagicWand, ArrowsClockwise } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export function LoversChart() {
  const [charts] = useKV<ChartData[]>('astrology-charts', [])
  const [person1Id, setPerson1Id] = useState<string>('')
  const [person2Id, setPerson2Id] = useState<string>('')
  const [synastryData, setSynastryData] = useState<SynastryData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiInterpretation, setAiInterpretation] = useState<string>('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  const handleGenerateSynastry = async () => {
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
      await new Promise(resolve => setTimeout(resolve, 500))
      const data = generateSynastryData(chart1, chart2)
      setSynastryData(data)
      toast.success('Compatibility analysis complete!')
    } catch (error) {
      console.error('Synastry generation error:', error)
      toast.error('Failed to generate compatibility chart')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateAIInterpretation = async () => {
    if (!synastryData) return

    setIsGeneratingAI(true)
    try {
      const chart1 = charts?.find(c => c.id === person1Id)
      const chart2 = charts?.find(c => c.id === person2Id)

      if (!chart1 || !chart2) {
        toast.error('Chart data not found')
        return
      }

      const aspectsSummary = synastryData.aspects
        .slice(0, 10)
        .map(a => `${chart1.name}'s ${a.person1Planet} ${a.type} ${chart2.name}'s ${a.person2Planet} (${a.interpretation})`)
        .join('\n')

      const scoresSummary = synastryData.compatibilityScores
        .map(s => `${s.category}: ${s.score}%`)
        .join('\n')

      const prompt = (window.spark.llmPrompt as any)`You are an expert astrologer specializing in relationship compatibility and synastry analysis.

Generate a detailed, personalized compatibility interpretation for these two individuals:

Person 1: ${chart1.name}
Birth: ${chart1.date} at ${chart1.time} in ${chart1.location}
Sun Sign: ${chart1.planets.find(p => p.name === 'Sun')?.sign || 'Unknown'}

Person 2: ${chart2.name}
Birth: ${chart2.date} at ${chart2.time} in ${chart2.location}
Sun Sign: ${chart2.planets.find(p => p.name === 'Sun')?.sign || 'Unknown'}

Overall Compatibility Score: ${synastryData.overallScore}%

Category Scores:
${scoresSummary}

Key Planetary Aspects:
${aspectsSummary}

Provide a comprehensive compatibility interpretation that includes:
1. An opening summary of their overall relationship dynamic (2-3 sentences)
2. Emotional Connection: How they connect emotionally and support each other
3. Communication Style: How they communicate and understand each other
4. Romantic Chemistry: Their physical attraction and romantic expression
5. Shared Values: What they have in common and their life goals alignment
6. Growth Potential: Areas where they can help each other grow
7. Challenges: Potential friction points and how to navigate them
8. Long-term Outlook: Advice for sustaining the relationship

Write in a warm, insightful, professional tone. Be honest about both strengths and challenges. Make it personal and specific to their charts. Use "you" and "your partner" language as if speaking to one person about their relationship. Keep each section concise but meaningful (2-4 sentences per section).`

      const response = await window.spark.llm(prompt, 'gpt-4o')
      setAiInterpretation(response)
      toast.success('AI interpretation generated!')
    } catch (error) {
      console.error('AI interpretation error:', error)
      toast.error('Failed to generate AI interpretation. Please try again.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 75) return 'from-green-500 to-emerald-500'
    if (score >= 50) return 'from-yellow-500 to-amber-500'
    return 'from-orange-500 to-red-500'
  }

  const getCompatibilityMessage = (score: number) => {
    if (score >= 80) return 'Exceptional compatibility! This is a powerful connection.'
    if (score >= 65) return 'Strong compatibility with great potential for lasting love.'
    if (score >= 50) return 'Good compatibility with some challenges to work through.'
    if (score >= 35) return 'Moderate compatibility requiring effort and understanding.'
    return 'Challenging compatibility requiring significant work.'
  }

  if (!charts || charts.length < 2) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-accent/20 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-accent/10">
                <Heart className="w-12 h-12 text-accent" weight="fill" />
              </div>
            </div>
            <CardTitle className="text-3xl font-semibold text-white">Lover's Compatibility Chart</CardTitle>
            <CardDescription className="text-white/70 text-base">
              Compare two natal charts for romantic compatibility
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You need at least two saved natal charts to perform a compatibility analysis.
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
              <div className="p-4 rounded-full bg-gradient-to-br from-accent to-pink-500">
                <Heart className="w-12 h-12 text-white" weight="fill" />
              </div>
            </div>
            <CardTitle className="text-3xl font-semibold text-white">Lover's Compatibility Chart</CardTitle>
            <CardDescription className="text-white/70 text-base">
              Discover the romantic potential between two souls through synastry analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-white">First Person</label>
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
                <label className="text-sm font-medium text-white">Second Person</label>
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
              onClick={handleGenerateSynastry}
              disabled={!person1Id || !person2Id || isGenerating}
              className="w-full bg-gradient-to-r from-accent to-pink-500 hover:from-accent/90 hover:to-pink-500/90 text-white font-medium py-6 text-lg"
            >
              {isGenerating ? (
                <>
                  <Sparkle className="mr-2 animate-spin" weight="fill" />
                  Analyzing Compatibility...
                </>
              ) : (
                <>
                  <Heart className="mr-2" weight="fill" />
                  Generate Compatibility Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {synastryData && (
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
                    {synastryData.person1.name} & {synastryData.person2.name}
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Compatibility Analysis
                  </CardDescription>
                </div>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(synastryData.overallScore)}`}>
                    {synastryData.overallScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Progress 
                  value={synastryData.overallScore} 
                  className="h-4 bg-muted/30"
                />
                <div 
                  className={`absolute inset-0 h-4 bg-gradient-to-r ${getScoreGradient(synastryData.overallScore)} rounded-full transition-all duration-500`}
                  style={{ width: `${synastryData.overallScore}%` }}
                />
              </div>
              <p className="text-center text-lg text-white/90">
                {getCompatibilityMessage(synastryData.overallScore)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Fire weight="fill" className="text-accent" />
                Compatibility Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {synastryData.compatibilityScores.map((score, index) => (
                <motion.div
                  key={score.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{score.icon}</span>
                      <div>
                        <div className="font-medium text-white">{score.category}</div>
                        <div className="text-sm text-muted-foreground">{score.description}</div>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(score.score)}`}>
                      {score.score}%
                    </div>
                  </div>
                  <Progress value={score.score} className="h-2" />
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl text-white">Planetary Aspects</CardTitle>
              <CardDescription className="text-white/70">
                Key connections between your charts ({synastryData.aspects.length} aspects found)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {synastryData.aspects.slice(0, 12).map((aspect, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30"
                  >
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={aspect.interpretation === 'harmonious' ? 'default' : aspect.interpretation === 'challenging' ? 'destructive' : 'secondary'}
                        className="capitalize"
                      >
                        {aspect.interpretation}
                      </Badge>
                      <span className="text-white font-medium">
                        {synastryData.person1.name}'s {aspect.person1Planet}
                      </span>
                      <span className="text-muted-foreground">{aspect.type}</span>
                      <span className="text-white font-medium">
                        {synastryData.person2.name}'s {aspect.person2Planet}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {aspect.orb.toFixed(1)}° orb
                    </span>
                  </motion.div>
                ))}
              </div>
              
              {synastryData.aspects.length > 12 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Showing top 12 of {synastryData.aspects.length} aspects
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
                    AI Relationship Insights
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Personalized compatibility interpretation powered by AI
                  </CardDescription>
                </div>
                {!aiInterpretation && (
                  <Button
                    onClick={handleGenerateAIInterpretation}
                    disabled={isGeneratingAI}
                    className="bg-gradient-to-r from-accent to-pink-500 hover:from-accent/90 hover:to-pink-500/90 text-white"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Sparkle className="mr-2 animate-spin" weight="fill" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <MagicWand className="mr-2" weight="fill" />
                        Generate Insights
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
                          <Sparkle className="mr-2 animate-spin" weight="fill" />
                          Regenerating...
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
                      <MagicWand className="w-8 h-8 text-accent" weight="fill" />
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Get a personalized, in-depth analysis of your relationship compatibility
                  </p>
                  <p className="text-sm text-white/60">
                    Our AI astrologer will analyze your charts and provide detailed insights into your emotional connection, communication style, romantic chemistry, and more.
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
