function apiError(status, message) {
  return Object.assign(new Error(message), { status })
}

export function createOllamaClient({ baseUrl, defaultModel, request = fetch }) {
  async function ollama(path, body) {
    try {
      const response = await request(new URL(path, baseUrl), {
        method: body ? 'POST' : 'GET', redirect: 'error',
        signal: AbortSignal.timeout(body ? 300000 : 10000),
        ...(body && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      })
      if (body && response.status === 404) throw apiError(400, 'Ollama could not find the requested model. Refresh models and select an installed model.')
      if (!response.ok) throw apiError(502, `Ollama returned HTTP ${response.status}. Check the Ollama service on the home server.`)
      return await response.json()
    } catch (error) {
      if (error.status) throw error
      if (error.name === 'TimeoutError') throw apiError(504, 'Ollama timed out. Try again or choose a smaller installed model.')
      throw apiError(502, 'The astrology server could not read a response from Ollama. Check OLLAMA_BASE_URL and reachability from site-astrology.')
    }
  }
  return {
    async models() {
      const data = await ollama('/api/tags')
      if (!Array.isArray(data?.models)) throw apiError(502, 'Ollama returned an invalid installed-model list.')
      const names = [...new Set(data.models.map(m => m?.name).filter(n => typeof n === 'string' && n.trim()))].sort()
      return { models: names.map(name => ({ name })), defaultModel }
    },
    async chat(input) {
      const { messages, model } = input ?? {}
      if (!Array.isArray(messages) || !messages.length || messages.some(m => m?.role !== 'user' || typeof m.content !== 'string' || !m.content.trim())) throw apiError(400, 'A user prompt is required.')
      if (model !== undefined && (typeof model !== 'string' || !model.trim())) throw apiError(400, 'Select an installed model or the server default.')
      for (const limit of [2048, 4096]) {
        const result = await ollama('/api/chat', {
          model: model?.trim() || defaultModel, stream: false, keep_alive: '30m',
          messages: [{ role: 'system', content: 'You are a helpful, knowledgeable astrologer.' }, ...messages.map(m => ({ role: 'user', content: m.content }))],
          options: { num_predict: limit },
        })
        if (result?.done_reason === 'length' || (!result?.done_reason && result?.eval_count >= limit)) continue
        if (result?.done !== true || typeof result?.message?.content !== 'string' || !result.message.content.trim() || typeof result.model !== 'string' || !result.model) throw apiError(502, 'Ollama returned an unfinished response or did not identify the model.')
        return { content: result.message.content, model: result.model }
      }
      throw apiError(502, 'The reading reached the Ollama output limit twice. Try regenerating the section.')
    },
  }
}
