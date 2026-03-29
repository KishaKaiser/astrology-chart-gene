import { motion } from 'framer-motion'
import { AstrologicalPattern } from '@/lib/pattern-detection'

interface PatternVisualizationProps {
  patterns: AstrologicalPattern[]
}

export function PatternVisualization({ patterns }: PatternVisualizationProps) {
  if (patterns.length === 0) return null

  const maxFrequency = Math.max(...patterns.map(p => p.frequency))

  return (
    <div className="bg-muted/20 rounded-lg p-6 border border-border overflow-hidden">
      <h3 className="text-sm font-semibold mb-6 text-center">Pattern Frequency Visualization</h3>
      
      <div className="relative h-64 flex items-end justify-around gap-2">
        {patterns
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 10)
          .map((pattern, index) => {
            const height = (pattern.frequency / maxFrequency) * 100
            const delay = index * 0.1

            return (
              <div key={pattern.id} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${height}%`, opacity: 1 }}
                  transition={{ duration: 0.6, delay, ease: 'easeOut' }}
                  className="w-full rounded-t-lg relative group cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to top, ${pattern.color}, ${pattern.color}CC)`,
                    minHeight: '20px'
                  }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-background border border-border rounded px-2 py-1 text-xs font-semibold whitespace-nowrap shadow-lg">
                      {pattern.frequency}x
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: delay + 0.3, duration: 0.3 }}
                      className="text-white font-bold text-lg"
                    >
                      {pattern.frequency}
                    </motion.div>
                  </div>
                </motion.div>
                
                <div className="text-xs text-center text-muted-foreground max-w-20 truncate" title={pattern.name}>
                  {pattern.type === 'transit' && '⚡'}
                  {pattern.type === 'house' && '🏠'}
                  {pattern.type === 'planet' && '🪐'}
                  {pattern.type === 'sign' && '✨'}
                  {pattern.type === 'cycle' && '🔄'}
                </div>
              </div>
            )
          })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex flex-wrap gap-3 justify-center text-xs">
          <div className="flex items-center gap-1.5">
            <span>⚡</span>
            <span className="text-muted-foreground">Transit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🏠</span>
            <span className="text-muted-foreground">House</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🪐</span>
            <span className="text-muted-foreground">Planet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>✨</span>
            <span className="text-muted-foreground">Sign</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🔄</span>
            <span className="text-muted-foreground">Cycle</span>
          </div>
        </div>
      </div>
    </div>
  )
}
