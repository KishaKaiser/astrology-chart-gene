const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "https://api.chatterbox.link"
const API_KEY = (import.meta.env.VITE_PUBLIC_API_KEY as string | undefined) ?? ""

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export async function llm(prompt: string, expectJson = false): Promise<string> {
  const messages: ChatMessage[] = [{ role: "user", content: prompt }]

  const res = await fetch(`${BASE_URL}/public/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ messages }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `AI request failed: ${res.status}`)
  }

  const data = (await res.json()) as { content: string }
  const content = data.content

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
