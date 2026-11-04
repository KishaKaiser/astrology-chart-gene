interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ModelList {
  models: Array<{ name: string }>
  defaultModel: string
}

export async function listModels(signal?: AbortSignal): Promise<ModelList> {
  const res = await fetch('/api/ollama/models', { signal, cache: 'no-store' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error || `Could not list Ollama models (HTTP ${res.status}). Check the astrology server’s OLLAMA_BASE_URL.`)
  }
  const data = await res.json() as ModelList
  if (!Array.isArray(data.models) || typeof data.defaultModel !== 'string' ||
      data.models.some(model => !model || typeof model.name !== 'string' || !model.name)) {
    throw new Error('The AI service returned an invalid model list.')
  }
  return data
}

interface LLMOptions {
  model?: string
  onModelUsed?: (model: string) => void
}

export async function llm(prompt: string, expectJson = false, options: LLMOptions = {}): Promise<string> {
  const messages: ChatMessage[] = [{ role: "user", content: prompt }]

  const res = await fetch("/api/ollama/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, ...(options.model ? { model: options.model } : {}) }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `AI request failed: ${res.status}`)
  }

  const data = (await res.json()) as { content: string; model?: string }
  const content = data.content
  if (typeof content !== 'string' || !content.trim()) throw new Error('Ollama returned an empty reading.')
  if (!data.model) {
    throw new Error('Ollama did not confirm which model generated the reading.')
  }
  if (typeof data.model === 'string') options.onModelUsed?.(data.model)

  if (expectJson) {
    const jsonBlock = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonBlock) return jsonBlock[1]
    const bare = content.match(/(\{[\s\S]*\})/)
    if (bare) return bare[1]
  }

  return content
}

export function llmPrompt(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "")
}
