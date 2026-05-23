import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY!
const genAI = new GoogleGenerativeAI(apiKey)

export const getEmbeddingModel = () =>
  genAI.getGenerativeModel({ model: 'text-embedding-004' })

export const getChatModel = () =>
  genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' })

export { genAI }