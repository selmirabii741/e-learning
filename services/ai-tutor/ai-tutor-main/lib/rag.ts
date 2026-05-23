import { generateEmbedding } from './embeddings'
import { getDocumentsCollection } from './mongodb'

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0
  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Retrieve relevant chunks using MongoDB (basic cosine similarity search)
 */
export async function retrieveRelevantChunks(
  question: string,
  matchCount = 5,
  matchThreshold = 0.1
): Promise<string[]> {
  const queryEmbedding = await generateEmbedding(question)
  const collection = await getDocumentsCollection()
  
  // Get all documents with embeddings
  const documents = await collection.find({ embedding: { $exists: true } }).toArray()
  
  // Calculate similarities
  const scoredDocuments = documents
    .map(doc => ({
      content: doc.content,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding)
    }))
    .filter(doc => doc.similarity >= matchThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount)
  
  return scoredDocuments.map(doc => doc.content)
}

/**
 * Get all chunks from MongoDB
 */
export async function getAllChunks(): Promise<string[]> {
  const collection = await getDocumentsCollection()
  const documents = await collection.find({}).sort({ createdAt: 1 }).toArray()
  return documents.map(doc => doc.content)
}

const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_MODEL = 'llama-3.1-8b-instant'

async function groqChat(prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error: ${err}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

export async function generateRAGAnswer(question: string): Promise<string> {
  const chunks = await retrieveRelevantChunks(question)
  if (chunks.length === 0) {
    return "Je n'ai pas assez de contexte dans le cours pour répondre à cette question."
  }
  const context = chunks.join('\n\n---\n\n')
  const prompt = `Tu es un tuteur IA expert.
Réponds clairement en utilisant UNIQUEMENT le contexte fourni.
Si la réponse n'est pas dans le contexte, dis que tu ne sais pas.

Contexte :
${context}

Question :
${question}`
  return await groqChat(prompt)
}

export async function generateSummary(): Promise<string> {
  const chunks = await getAllChunks()
  if (chunks.length === 0) throw new Error('Aucun contenu trouvé.')
  const content = chunks.join('\n\n')
  const prompt = `Tu es un expert pédagogique. Analyse ce contenu de cours et génère un résumé structuré.

Format de réponse :
# Résumé du cours

## Sujets principaux
(Liste des thèmes couverts)

## Concepts clés
(Concepts importants avec explications)

## Définitions importantes
(Termes clés et leurs définitions)

## Points essentiels à retenir
(Bullet points des éléments les plus importants)

Contenu du cours :
${content.slice(0, 6000)}`
  return await groqChat(prompt)
}

export async function generateQuiz(): Promise<string> {
  const chunks = await getAllChunks()
  if (chunks.length === 0) throw new Error('Aucun contenu trouvé.')
  const content = chunks.join('\n\n')
  const prompt = `Tu es un créateur de quiz expert. Génère un quiz basé STRICTEMENT sur ce contenu.

Génère exactement :
- 5 Questions à Choix Multiple (4 options : A, B, C, D)
- 3 Questions à réponse courte

Format :
## Questions à Choix Multiple

Q1. [Question]
A) [Option]
B) [Option]
C) [Option]
D) [Option]

[Q2 à Q5...]

## Questions à réponse courte

Q6. [Question]
Q7. [Question]
Q8. [Question]

---
## CORRIGÉ

QCM :
Q1. [Lettre] - [Explication]
[Q2 à Q5...]

Réponses courtes :
Q6. [Réponse modèle]
Q7. [Réponse modèle]
Q8. [Réponse modèle]

Contenu :
${content.slice(0, 6000)}`
  return await groqChat(prompt)
}