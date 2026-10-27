import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { listModels, type ModelList } from '@/lib/llm'

const STORAGE_KEY = 'astrology-interpretation-model'
const DEFAULT = '__server_default__'

export function readInterpretationModel(): string {
  try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
}

export function InterpretationModelSelector({ value, onChange, disabled, lastModel }: {
  value: string
  onChange: (model: string) => void
  disabled: boolean
  lastModel: string
}) {
  const [data, setData] = useState<ModelList | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)
    let active = true
    setLoading(true)
    setError('')
    listModels(controller.signal).then(result => {
      if (active) setData(result)
    }).catch(error => {
      if (active) setError(error.name === 'AbortError' ? 'Loading models timed out. Try Refresh models.' : error.message)
    }).finally(() => {
      clearTimeout(timeout)
      if (active) setLoading(false)
    })
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [revision])

  const missingSelection = value && data && !data.models.some(model => model.name === value)
  return (
    <div className="space-y-2 rounded-lg border border-border p-4 text-foreground">
      <Label htmlFor="interpretation-model">Ollama model for chart readings</Label>
      <div className="flex flex-wrap gap-2">
        <Select value={value || DEFAULT} disabled={disabled} onValueChange={next => {
          const model = next === DEFAULT ? '' : next
          onChange(model)
          try { localStorage.setItem(STORAGE_KEY, model) } catch { /* Selection still works for this session. */ }
        }}>
          <SelectTrigger id="interpretation-model" className="w-full sm:w-80"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT}>Server default{data ? ` — ${data.defaultModel}` : ''}</SelectItem>
            {value && !data?.models.some(model => model.name === value) && (
              <SelectItem value={value}>{value}{missingSelection ? ' (not installed)' : ' (saved choice)'}</SelectItem>
            )}
            {data?.models.map(model => <SelectItem key={model.name} value={model.name}>{model.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" disabled={disabled || loading} onClick={() => setRevision(n => n + 1)}>
          {loading ? 'Loading models…' : 'Refresh models'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Used for new readings and regenerated sections. Your choice is saved in this browser.
      </p>
      {lastModel && <p className="text-sm">Last response used: <strong>{lastModel}</strong></p>}
      {missingSelection && <p role="alert" className="text-sm text-amber-300">The saved model is no longer installed. Choose another model before generating.</p>}
      {data?.models.length === 0 && <p role="alert" className="text-sm text-amber-300">No installed models were found on the Ollama server.</p>}
      {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
    </div>
  )
}
