export interface PastLifeDetails {
  primaryLifeTheme: string
  lifeEra: string
  occupation: string
  challenges: string[]
  karmaLessons: string[]
  talents: string[]
}

export function parsePastLifeDetails(response: string): PastLifeDetails {
  const start = response.indexOf('{')
  const end = response.lastIndexOf('}')
  let data: Record<string, unknown>
  try {
    data = JSON.parse(response.slice(start, end + 1))
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error()
  } catch {
    throw new Error('The AI returned invalid reading details. Please try again or choose another model.')
  }
  const details = {} as PastLifeDetails
  for (const key of ['primaryLifeTheme', 'lifeEra', 'occupation'] as const) {
    if (typeof data[key] !== 'string' || !data[key].trim()) {
      throw new Error(`The AI reading is missing ${key}. Please try again or choose another model.`)
    }
    details[key] = data[key].trim()
  }
  for (const key of ['challenges', 'karmaLessons', 'talents'] as const) {
    const items = data[key]
    if (!Array.isArray(items) || items.length === 0 || items.some(item => typeof item !== 'string' || !item.trim())) {
      throw new Error(`The AI reading has invalid ${key}. Please try again or choose another model.`)
    }
    details[key] = items.map(item => item.trim())
  }
  return details
}

export async function generatePastLifeReading(
  prompt: string,
  generate: (prompt: string, expectJson: boolean) => Promise<string>,
) {
  const response = await generate(prompt, true)
  let details: PastLifeDetails
  try {
    details = parsePastLifeDetails(response)
  } catch {
    // Retry only invalid structured output; service errors should reach the user.
    details = parsePastLifeDetails(await generate(`${prompt}\n\nReturn ONLY one valid JSON object with all six requested fields. Use arrays of strings for challenges, karmaLessons, and talents. Do not include a narrative or markdown.`, true))
  }
  const interpretation = (await generate(`${prompt}\n\nThe reading details have already been generated:\n${JSON.stringify(details)}\n\nFor this response, write ONLY the narrative in plain text, not JSON. Write 4 concise paragraphs, at most 500 words, connecting these themes to the natal chart and current life. Treat past-life themes as a symbolic astrological interpretation rather than verified historical facts. Do not repeat the JSON.`, false)).trim()
  if (!interpretation) throw new Error('The AI returned an empty past life story. Please try again.')
  return { ...details, interpretation }
}
