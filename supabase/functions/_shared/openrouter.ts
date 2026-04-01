const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function invokeLLM(opts: {
  model?: string
  messages: Array<{ role: string; content: any }>
  response_format?: { type: string }
  temperature?: number
}): Promise<string> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://pawcoach.app',
      'X-Title': 'PawCoach',
    },
    body: JSON.stringify({
      model: opts.model || 'deepseek/deepseek-chat',
      messages: opts.messages,
      response_format: opts.response_format,
      temperature: opts.temperature ?? 0.7,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${body}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}
