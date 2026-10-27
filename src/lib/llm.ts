const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "https://api.chatterbox.link"
const API_KEY = (import.meta.env.VITE_PUBLIC_API_KEY as string | undefined) ?? ""

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ModelList {
  models: Array<{ name: string }>
  defaultModel: string
}

export async function listModels(signal?: AbortSignal): Promise<ModelList> {
  const res = await fetch(`${BASE_URL}/public/models`, {
    headers: { 'x-api-key': API_KEY },
    signal,
  })
  if (!res.ok) {
    if (res.status === 404) throw new Error('Model selection needs the updated Chatterbox backend. Server-default generation is still available.')
    throw new Error('Could not load Ollama models. Check the AI service and try Refresh models.')
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

  const res = await fetch(`${BASE_URL}/public/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ messages, ...(options.model ? { model: options.model } : {}) }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `AI request failed: ${res.status}`)
  }

  const data = (await res.json()) as { content: string; model?: string }
  const content = data.content
  if (options.model && !data.model) {
    throw new Error('The AI service did not confirm the selected model. Deploy the updated Chatterbox backend first.')
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
