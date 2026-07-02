import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { ChartData } from '@/lib/astrology-types'
import { SynastryData, generateSynastryData, RelationshipType } from '@/lib/synastry-calc'
import { analyzeSoulmateConnection, SoulmateAnalysis } from '@/lib/soulmate-detection'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Sparkle, Fire, MagicWand, ArrowsClockwise, Users, Briefcase, Flame, StarFour, Infinity } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { llm, llmPrompt } from "@/lib/llm"

interface SavedCompatibilityReport {
  person1Id: string
  person2Id: string
  relationshipType: RelationshipType
  synastryData: SynastryData
  soulmateAnalysis: SoulmateAnalysis | null
  aiInterpretation: string
  generatedAt: number
}

export function LoversChart() {
  const [charts] = useKV<ChartData[]>('astrology-charts', [])
  const [person1Id, setPerson1Id] = useState<string>('')
  const [person2Id, setPerson2Id] = useState<string>('')
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('romantic')
  const [synastryData, setSynastryData] = useState<SynastryData | null>(null)
  const [soulmateAnalysis, setSoulmateAnalysis] = useState<SoulmateAnalysis | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiInterpretation, setAiInterpretation] = useState<string>('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [savedReports, setSavedReports] = useKV<Record<string, SavedCompatibilityReport>>('compatibility-reports', {})

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
      const data = generateSynastryData(chart1, chart2, relationshipType)
      setSynastryData(data)
      
      if (relationshipType === 'romantic') {
        const soulmate = analyzeSoulmateConnection(chart1, chart2, data.aspects)
        setSoulmateAnalysis(soulmate)
      } else {
        setSoulmateAnalysis(null)
      }
      
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

      let soulmateContext = ''
      if (soulmateAnalysis && relationshipType === 'romantic') {
        soulmateContext = `\n\nSOUL CONNECTION ANALYSIS:
Connection Type: ${soulmateAnalysis.connectionType}
Twin Flame Score: ${soulmateAnalysis.twinFlameScore}%
Soulmate Score: ${soulmateAnalysis.soulmateScore}%

Key Soul Indicators Found:
${soulmateAnalysis.indicators.slice(0, 5).map(i => `- ${i.name}: ${i.description}`).join('\n')}

Please acknowledge and incorporate these soul connection findings into your interpretation.`
      }

      let promptText = ''
      
      if (relationshipType === 'romantic') {
        promptText = `You are an expert astrologer specializing in relationship compatibility and synastry analysis.

Generate a detailed, personalized compatibility interpretation for these two individuals in a ROMANTIC relationship:

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
${aspectsSummary}${soulmateContext}

Provide a comprehensive romantic compatibility interpretation that includes:
1. An opening summary of their overall romantic dynamic (2-3 sentences)${soulmateAnalysis && (soulmateAnalysis.isTwinFlame || soulmateAnalysis.isSoulmate) ? ' - Be sure to mention the significant soul connection detected (twin flame/soulmate indicators)' : ''}
2. Emotional Connection: How they connect emotionally and support each other romantically
3. Communication Style: How they communicate as romantic partners
4. Romantic Chemistry: Their physical attraction and romantic expression
5. Shared Values: What they have in common and their life goals alignment
6. Growth Potential: Areas where they can help each other grow as partners
7. Challenges: Potential friction points and how to navigate them
8. Long-term Outlook: Advice for sustaining the romantic relationship${soulmateAnalysis && (soulmateAnalysis.isTwinFlame || soulmateAnalysis.isSoulmate) ? ' (consider the deep soul connection in this assessment)' : ''}

Write in a warm, insightful, professional tone. Be honest about both strengths and challenges. Make it personal and specific to their charts. Use "you" and "your partner" language as if speaking to one person about their relationship. Keep each section concise but meaningful (2-4 sentences per section).`
      } else if (relationshipType === 'friendship') {
        promptText = `You are an expert astrologer specializing in relationship compatibility and synastry analysis.

Generate a detailed, personalized compatibility interpretation for these two individuals in a FRIENDSHIP:

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

Provide a comprehensive friendship compatibility interpretation that includes:
1. An opening summary of their overall friendship dynamic (2-3 sentences)
2. Emotional Support: How they provide mutual emotional support and understanding
3. Communication Style: How they communicate and share ideas as friends
4. Fun & Activities: Their compatibility for shared activities and adventures
5. Loyalty & Trust: The depth and reliability of their friendship bond
6. Social Harmony: How well they get along in social settings
7. Challenges: Potential friction points in the friendship and how to navigate them
8. Long-term Outlook: Advice for maintaining a lasting friendship

Write in a warm, insightful, professional tone. Be honest about both strengths and challenges. Make it personal and specific to their charts. Use "you" and "your friend" language as if speaking to one person about their friendship. Keep each section concise but meaningful (2-4 sentences per section).`
      } else {
        promptText = `You are an expert astrologer specializing in professional compatibility and business partnerships.

Generate a detailed, personalized compatibility interpretation for these two individuals in a BUSINESS relationship:

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

Provide a comprehensive business partnership compatibility interpretation that includes:
1. An opening summary of their overall professional dynamic (2-3 sentences)
2. Work Style Alignment: How their professional approaches complement each other
3. Communication Efficiency: How they communicate in business contexts
4. Shared Vision: Their alignment on goals, strategy, and business philosophy
5. Decision-Making: How they collaborate on important decisions
6. Strengths & Synergies: What each brings to the partnership
7. Challenges: Potential conflicts in the business relationship and how to manage them
8. Long-term Partnership Outlook: Advice for building a successful long-term business relationship

Write in a professional, insightful tone. Be honest about both strengths and challenges. Make it practical and specific to their charts. Use "you" and "your business partner" language as if speaking to one person about their professional relationship. Keep each section concise but meaningful (2-4 sentences per section).`
      }

      const prompt = llmPrompt`${promptText}`

      const response = await llm(prompt)
      setAiInterpretation(response)
      
      const reportKey = `${person1Id}-${person2Id}-${relationshipType}`
      setSavedReports(current => ({
        ...(current || {}),
        [reportKey]: {
          person1Id,
          person2Id,
          relationshipType,
          synastryData,
          soulmateAnalysis,
          aiInterpretation: response,
          generatedAt: Date.now()
        }
      }))
      
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

  const getCompatibilityMessage = (score: number, type: RelationshipType) => {
    if (type === 'romantic') {
      if (score >= 80) return 'Exceptional compatibility! This is a powerful romantic connection.'
      if (score >= 65) return 'Strong compatibility with great potential for lasting love.'
      if (score >= 50) return 'Good compatibility with some challenges to work through.'
      if (score >= 35) return 'Moderate compatibility requiring effort and understanding.'
      return 'Challenging compatibility requiring significant work.'
    } else if (type === 'friendship') {
      if (score >= 80) return 'Exceptional friendship! You complement each other beautifully.'
      if (score >= 65) return 'Strong friendship with great mutual understanding.'
      if (score >= 50) return 'Good friendship potential with some differences.'
      if (score >= 35) return 'Moderate friendship compatibility requiring patience.'
      return 'Friendship may require significant effort to maintain.'
    } else {
      if (score >= 80) return 'Exceptional business compatibility! Strong partnership potential.'
      if (score >= 65) return 'Strong professional alignment with good collaboration prospects.'
      if (score >= 50) return 'Workable business relationship with clear communication needed.'
      if (score >= 35) return 'Moderate professional compatibility requiring structure.'
      return 'Challenging business dynamic requiring careful management.'
    }
  }

  const getRelationshipTitle = (type: RelationshipType) => {
    if (type === 'romantic') return "Romantic Compatibility"
    if (type === 'friendship') return "Friendship Compatibility"
    return "Business Compatibility"
  }

  const getRelationshipDescription = (type: RelationshipType) => {
    if (type === 'romantic') return "Discover the romantic potential between two souls through synastry analysis"
    if (type === 'friendship') return "Explore the friendship dynamics and mutual understanding"
    return "Analyze professional compatibility and partnership potential"
  }

  const getRelationshipIcon = (type: RelationshipType) => {
    if (type === 'romantic') return <Heart className="w-12 h-12 text-white" weight="fill" />
    if (type === 'friendship') return <Users className="w-12 h-12 text-white" weight="fill" />
    return <Briefcase className="w-12 h-12 text-white" weight="fill" />
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
                {getRelationshipIcon(relationshipType)}
              </div>
            </div>
            <CardTitle className="text-3xl font-semibold text-white">{getRelationshipTitle(relationshipType)}</CardTitle>
            <CardDescription className="text-white/70 text-base">
              {getRelationshipDescription(relationshipType)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Relationship Type</label>
              <Tabs value={relationshipType} onValueChange={(v) => setRelationshipType(v as RelationshipType)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="romantic" className="gap-2">
                    <Heart weight="fill" />
                    Romantic
                  </TabsTrigger>
                  <TabsTrigger value="friendship" className="gap-2">
                    <Users weight="fill" />
                    Friendship
                  </TabsTrigger>
                  <TabsTrigger value="business" className="gap-2">
                    <Briefcase weight="fill" />
                    Business
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
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
                  <Sparkle className="mr-2" weight="fill" />
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
                {getCompatibilityMessage(synastryData.overallScore, synastryData.relationshipType)}
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

          {soulmateAnalysis && relationshipType === 'romantic' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-accent/20 bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl text-white flex items-center gap-3">
                        {soulmateAnalysis.isTwinFlame && <Flame className="w-8 h-8 text-orange-400 animate-pulse" weight="fill" />}
                        {soulmateAnalysis.isSoulmate && !soulmateAnalysis.isTwinFlame && <StarFour className="w-8 h-8 text-yellow-400" weight="fill" />}
                        {!soulmateAnalysis.isSoulmate && !soulmateAnalysis.isTwinFlame && <Infinity className="w-8 h-8 text-purple-400" weight="fill" />}
                        Soul Connection Analysis
                      </CardTitle>
                      <CardDescription className="text-white/80 text-base mt-2">
                        {soulmateAnalysis.connectionType}
                      </CardDescription>
                    </div>
                    <div className="text-center">
                      <div className="flex gap-4">
                        {soulmateAnalysis.twinFlameScore > 0 && (
                          <div className="text-center">
                            <div className="text-3xl font-bold text-orange-400">
                              {soulmateAnalysis.twinFlameScore}%
                            </div>
                            <div className="text-xs text-muted-foreground">Twin Flame</div>
                          </div>
                        )}
                        {soulmateAnalysis.soulmateScore > 0 && (
                          <div className="text-center">
                            <div className="text-3xl font-bold text-yellow-400">
                              {soulmateAnalysis.soulmateScore}%
                            </div>
                            <div className="text-xs text-muted-foreground">Soulmate</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-background/40 border border-accent/20">
                    <p className="text-white/90 leading-relaxed">
                      {soulmateAnalysis.summary}
                    </p>
                  </div>

                  {soulmateAnalysis.indicators.length > 0 && (
                    <>
                      <Separator className="bg-border/50" />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Sparkle weight="fill" className="text-accent" />
                          Soul Connection Indicators ({soulmateAnalysis.indicators.length} found)
                        </h3>
                        <div className="space-y-3">
                          {soulmateAnalysis.indicators.map((indicator, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * index }}
                              className="p-4 rounded-lg bg-background/30 border border-border/30 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge 
                                      variant={
                                        indicator.type === 'twin-flame' ? 'destructive' :
                                        indicator.type === 'soulmate' ? 'default' :
                                        indicator.type === 'karmic' ? 'secondary' :
                                        'outline'
                                      }
                                      className="capitalize"
                                    >
                                      {indicator.type === 'twin-flame' ? '🔥 Twin Flame' :
                                       indicator.type === 'soulmate' ? '⭐ Soulmate' :
                                       indicator.type === 'karmic' ? '♾️ Karmic' :
                                       '✨ Divine'}
                                    </Badge>
                                    <span className="font-semibold text-white">
                                      {indicator.name}
                                    </span>
                                  </div>
                                  <p className="text-sm text-white/70 mb-2">
                                    {indicator.description}
                                  </p>
                                  {indicator.details && (
                                    <p className="text-sm text-accent/90 italic">
                                      {indicator.details}
                                    </p>
                                  )}
                                </div>
                                <div className="text-center shrink-0">
                                  <div className="text-2xl font-bold text-accent">
                                    {indicator.strength}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Strength</div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {soulmateAnalysis.indicators.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-white/70">
                        No strong soul connection indicators detected. This doesn't mean the relationship lacks value - 
                        every connection offers opportunities for growth and learning.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

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
