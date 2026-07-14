const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent"

function geminiHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Part = string | { inlineData: { data: string; mimeType: string } }

function toParts(prompt: string | Part[]): { text?: string; inlineData?: { data: string; mimeType: string } }[] {
  const items = Array.isArray(prompt) ? prompt : [prompt]
  return items.map((p) => (typeof p === "string" ? { text: p } : p))
}

export const getModel = (useSearch: boolean = false) => {
  return {
    generateContent: async (prompt: string | Part[]) => {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured")

      const maxRetries = 3
      let lastError: Error | null = null

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: geminiHeaders(apiKey),
          body: JSON.stringify({
            contents: [{ parts: toParts(prompt) }],
          }),
        })

        const data = await res.json()

        if (res.ok) {
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
          return { response: { text: () => text } }
        }

        if (res.status === 503 || res.status === 429) {
          console.warn(`Gemini API ${res.status}, retrying (attempt ${attempt + 1}/${maxRetries})...`)
          lastError = new Error(`Gemini API error: ${res.status}`)
          await sleep(1000 * Math.pow(2, attempt))
          continue
        }

        console.error("Gemini API error:", res.status, JSON.stringify(data))
        throw new Error(`Gemini API error: ${res.status}`)
      }

      throw lastError ?? new Error("Gemini API error: max retries exceeded")
    },
  }
}