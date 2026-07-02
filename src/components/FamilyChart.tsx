import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { ChartData } from '@/lib/astrology-types'
import { FamilyRelationshipData, generateFamilyAnalysis, FamilyRelationType } from '@/lib/family-compatibility'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsersFour, Baby, HandHeart, Sparkle, MagicWand } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { llm, llmPrompt } from "@/lib/llm"

export function FamilyChart() {
  const [charts] = useKV<ChartData[]>('astrology-charts', [])
  const [savedFamilyData, setSavedFamilyData] = useKV<Record<string, FamilyRelationshipData>>('family-dynamics', {})
  const [person1Id, setPerson1Id] = useState<string>('')
  const [person2Id, setPerson2Id] = useState<string>('')
  const [relationshipType, setRelationshipType] = useState<FamilyRelationType>('parent-child')
  const [familyData, setFamilyData] = useState<FamilyRelationshipData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiInterpretation, setAiInterpretation] = useState<string>('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  const handleGenerateAnalysis = async () => {
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
      const data = generateFamilyAnalysis(chart1, chart2, relationshipType)
      setFamilyData(data)
      
      const familyKey = `${chart1.id}-${chart2.id}-${relationshipType}`
      setSavedFamilyData((current) => ({
        ...current,
        [familyKey]: data
      }))
      
      toast.success('Family compatibility analysis complete!')
    } catch (error) {
      console.error('Family analysis error:', error)
      toast.error('Failed to generate family compatibility analysis')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateAIInterpretation = async () => {
    if (!familyData) return

    setIsGeneratingAI(true)
    try {
      const chart1 = charts?.find(c => c.id === person1Id)
      const chart2 = charts?.find(c => c.id === person2Id)

      if (!chart1 || !chart2) {
        toast.error('Chart data not found')
        return
      }

      const aspectsSummary = familyData.aspects
        .slice(0, 10)
        .map(a => `${chart1.name}'s ${a.person1Planet} ${a.type} ${chart2.name}'s ${a.person2Planet} (${a.interpretation})`)
        .join('\n')

      const scoresSummary = familyData.compatibilityScores
        .map(s => `${s.category}: ${s.score}%`)
        .join('\n')

      let promptText = ''
      
      if (relationshipType === 'parent-child') {
        promptText = `You are an expert astrologer specializing in family dynamics and parent-child relationships.

Generate a detailed, compassionate interpretation for this PARENT-CHILD relationship:

${chart1.name} (Parent)
Birth: ${chart1.date} at ${chart1.time} in ${chart1.location}
Sun Sign: ${chart1.planets.find(p => p.name === 'Sun')?.sign || 'Unknown'}

${chart2.name} (Child)
Birth: ${chart2.date} at ${chart2.time} in ${chart2.location}
Sun Sign: ${chart2.planets.find(p => p.name === 'Sun')?.sign || 'Unknown'}

Overall Compatibility Score: ${familyData.overallScore}%

Category Scores:
${scoresSummary}

Key Planetary Aspects:
${aspectsSummary}

Provide a comprehensive parent-child compatibility interpretation that includes:
1. An opening summary of their overall parent-child dynamic (2-3 sentences)
2. Emotional Bond: How they connect emotionally and understand each other's feelings
3. Communication Patterns: How they communicate and the parent's ability to reach the child
4. Nurturing Style: How the parent's natural approach aligns with the child's needs
5. Learning & Growth: How the parent can best support the child's development
6. Discipline & Structure: The balance between guidance and freedom that works best
7. Shared Activities: What activities and interests bring them closer together
8. Challenges & Solutions: Potential friction points and practical advice for navigating them
9. Long-term Relationship: Guidance for building a strong lifelong parent-child bond

Write in a warm, supportive, and insightful tone. Be honest about both strengths and challenges. Make it personal and specific to their charts. Address the parent directly using "you" and "your child" language. Focus on practical guidance and understanding. Keep each section concise but meaningful (2-4 sentences per section).`
      } else {
        promptText = `You are an expert astrologer specializing in family dynamics and sibling relationships.

Generate a detailed, insightful interpretation for this SIBLING relationship:

${chart1.name} (First Sibling)
Birth: ${chart1.date} at ${chart1.time} in ${chart1.location}
Sun Sign: ${chart1.planets.find(p => p.name === 'Sun')?.sign || 'Unknown'}

${chart2.name} (Second Sibling)
Birth: ${chart2.date} at ${chart2.time} in ${chart2.location}
Sun Sign: ${chart2.planets.find(p => p.name === 'Sun')?.sign || 'Unknown'}

Overall Compatibility Score: ${familyData.overallScore}%

Category Scores:
${scoresSummary}

Key Planetary Aspects:
${aspectsSummary}

Provide a comprehensive sibling compatibility interpretation that includes:
1. An opening summary of their overall sibling dynamic (2-3 sentences)
2. Emotional Connection: How they relate emotionally and support each other
3. Communication Style: How they interact and whether they understand each other naturally
4. Personality Differences: Where their personalities complement or clash
5. Competition & Cooperation: Their natural tendency toward rivalry or collaboration
6. Shared Interests: Activities and interests that bring them together
7. Conflict Resolution: How they handle disagreements and what helps them reconcile
8. Individual Needs: How each sibling's unique needs affect the relationship
9. Long-term Bond: Guidance for nurturing a strong lifelong sibling relationship

Write in a warm, understanding, and practical tone. Be honest about both harmonious and challenging dynamics. Make it personal and specific to their charts. Use neutral language that addresses parents or the siblings themselves. Keep each section concise but meaningful (2-4 sentences per section).`
      }

      const prompt = llmPrompt`${promptText}`

      const response = await llm(prompt)
      setAiInterpretation(response)
      
      const familyKey = `${chart1.id}-${chart2.id}-${relationshipType}`
      setSavedFamilyData((current) => ({
        ...current,
        [familyKey]: {
          ...familyData,
          aiInterpretation: response
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

  const getCompatibilityMessage = (score: number, type: FamilyRelationType) => {
    if (type === 'parent-child') {
      if (score >= 80) return 'Exceptional parent-child harmony! Natural understanding and deep connection.'
      if (score >= 65) return 'Strong parent-child compatibility with good natural rapport.'
      if (score >= 50) return 'Good compatibility with some areas requiring extra patience.'
      if (score >= 35) return 'Moderate compatibility requiring conscious effort and understanding.'
      return 'Challenging dynamics requiring significant patience and adaptive parenting.'
    } else {
      if (score >= 80) return 'Exceptional sibling bond! Natural allies and best friends.'
      if (score >= 65) return 'Strong sibling compatibility with good mutual understanding.'
      if (score >= 50) return 'Good sibling relationship with typical ups and downs.'
      if (score >= 35) return 'Moderate compatibility with frequent conflicts but strong potential.'
      return 'Challenging sibling dynamic requiring parental guidance and mediation.'
    }
  }

  const getRelationshipTitle = (type: FamilyRelationType) => {
    if (type === 'parent-child') return "Parent-Child Compatibility"
    return "Sibling Compatibility"
  }

  const getRelationshipDescription = (type: FamilyRelationType) => {
    if (type === 'parent-child') return "Understand parent-child dynamics through astrological analysis"
    return "Explore sibling relationships and family harmony"
  }

  const getRelationshipIcon = (type: FamilyRelationType) => {
    if (type === 'parent-child') return <Baby className="w-12 h-12 text-white" weight="fill" />
    return <UsersFour className="w-12 h-12 text-white" weight="fill" />
  }

  if (!charts || charts.length < 2) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-accent/20 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-accent/10">
                <HandHeart className="w-12 h-12 text-accent" weight="fill" />
              </div>
            </div>
            <CardTitle className="text-3xl font-semibold text-white">Family Compatibility</CardTitle>
            <CardDescription className="text-white/70 text-base">
              Analyze parent-child or sibling relationships
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You need at least two saved natal charts to perform a family compatibility analysis.
            </p>
            <p className="text-sm text-muted-foreground">
              Switch to the Chart Library tab and create natal charts for family members.
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
              <div className="p-4 rounded-full bg-gradient-to-br from-accent to-purple-500">
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
              <Tabs value={relationshipType} onValueChange={(v) => setRelationshipType(v as FamilyRelationType)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="parent-child" className="gap-2">
                    <Baby weight="fill" />
                    Parent-Child
                  </TabsTrigger>
                  <TabsTrigger value="sibling" className="gap-2">
                    <UsersFour weight="fill" />
                    Siblings
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-white">
                  {relationshipType === 'parent-child' ? 'Parent' : 'First Sibling'}
                </label>
                <Select value={person1Id} onValueChange={setPerson1Id}>
                  <SelectTrigger className="border-input bg-background/50 text-white">
                    <SelectValue placeholder={relationshipType === 'parent-child' ? 'Select parent' : 'Select first sibling'} />
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
                <label className="text-sm font-medium text-white">
                  {relationshipType === 'parent-child' ? 'Child' : 'Second Sibling'}
                </label>
                <Select value={person2Id} onValueChange={setPerson2Id}>
                  <SelectTrigger className="border-input bg-background/50 text-white">
                    <SelectValue placeholder={relationshipType === 'parent-child' ? 'Select child' : 'Select second sibling'} />
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
              onClick={handleGenerateAnalysis}
              disabled={!person1Id || !person2Id || isGenerating}
              className="w-full bg-gradient-to-r from-accent to-purple-500 hover:from-accent/90 hover:to-purple-500/90 text-white font-medium py-6 text-lg"
            >
              {isGenerating ? (
                <>
                  <Sparkle className="mr-2 animate-spin" weight="fill" />
                  Analyzing Family Dynamics...
                </>
              ) : (
                <>
                  <Sparkle className="mr-2" weight="fill" />
                  Generate Family Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {familyData && (
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
                    {familyData.person1.name} & {familyData.person2.name}
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    {relationshipType === 'parent-child' ? 'Parent-Child Analysis' : 'Sibling Analysis'}
                  </CardDescription>
                </div>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(familyData.overallScore)}`}>
                    {familyData.overallScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Progress 
                  value={familyData.overallScore} 
                  className="h-4 bg-muted/30"
                />
                <div 
                  className={`absolute top-0 left-0 h-4 rounded-full bg-gradient-to-r ${getScoreGradient(familyData.overallScore)} transition-all duration-500`}
                  style={{ width: `${familyData.overallScore}%` }}
                />
              </div>
              <p className="text-center text-white/90 text-lg">
                {getCompatibilityMessage(familyData.overallScore, relationshipType)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Compatibility Breakdown</CardTitle>
              <CardDescription className="text-white/70">
                Detailed analysis of {relationshipType === 'parent-child' ? 'parent-child dynamics' : 'sibling dynamics'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {familyData.compatibilityScores.map((score, index) => (
                <motion.div
                  key={score.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
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
                  <div className="relative">
                    <Progress value={score.score} className="h-2 bg-muted/30" />
                    <div 
                      className={`absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r ${getScoreGradient(score.score)} transition-all duration-500`}
                      style={{ width: `${score.score}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Planetary Aspects</CardTitle>
              <CardDescription className="text-white/70">
                Key astrological connections between charts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {familyData.aspects.slice(0, 12).map((aspect, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30"
                  >
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={aspect.interpretation === 'harmonious' ? 'default' : aspect.interpretation === 'challenging' ? 'destructive' : 'secondary'}
                        className="min-w-[100px] justify-center"
                      >
                        {aspect.interpretation}
                      </Badge>
                      <span className="text-white">
                        <span className="font-medium">{familyData.person1.name}'s {aspect.person1Planet}</span>
                        {' '}<span className="text-accent">{aspect.type}</span>{' '}
                        <span className="font-medium">{familyData.person2.name}'s {aspect.person2Planet}</span>
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {aspect.orb.toFixed(2)}° orb
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">AI-Powered Interpretation</CardTitle>
                  <CardDescription className="text-white/70">
                    Deep insights into your family dynamics
                  </CardDescription>
                </div>
                <Button
                  onClick={handleGenerateAIInterpretation}
                  disabled={isGeneratingAI}
                  className="bg-gradient-to-r from-accent to-purple-500 hover:from-accent/90 hover:to-purple-500/90"
                >
                  {isGeneratingAI ? (
                    <>
                      <MagicWand className="mr-2 animate-spin" weight="fill" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <MagicWand className="mr-2" weight="fill" />
                      Generate Interpretation
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aiInterpretation ? (
                <div className="prose prose-invert max-w-none">
                  <div className="text-white/90 whitespace-pre-wrap leading-relaxed">
                    {aiInterpretation}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MagicWand className="w-16 h-16 text-accent/50 mx-auto mb-4" weight="fill" />
                  <p className="text-muted-foreground">
                    Click "Generate Interpretation" to receive personalized insights about this {relationshipType === 'parent-child' ? 'parent-child' : 'sibling'} relationship.
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
