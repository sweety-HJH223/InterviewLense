import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set')
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const getModel = (useSearch: boolean = false) => {
  const modelConfig: any = {
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  }

  if (useSearch) {
    modelConfig.tools = [{ googleSearchRetrieval: {} }]
  }

  return genAI.getGenerativeModel(modelConfig)
}