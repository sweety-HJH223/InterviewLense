import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set')
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const getModel = (useSearch: boolean = false) => {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
  })
}