// Embeddings via Cohere - 100% gratuit (1000 req/mois free tier)
// Modèle: embed-multilingual-light-v3.0 (384 dimensions)

export function chunkText(text: string, minSize = 500, maxSize = 800): string[] {
  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  let current = ''

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length > maxSize && current.length >= minSize) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current = current ? current + ' ' + sentence : sentence
    }
  }

  if (current.trim().length > 0) {
    if (current.trim().length < 100 && chunks.length > 0) {
      chunks[chunks.length - 1] += ' ' + current.trim()
    } else {
      chunks.push(current.trim())
    }
  }

  if (chunks.length === 0 && text.length > 0) {
    for (let i = 0; i < text.length; i += 600) {
      chunks.push(text.slice(i, i + 600))
    }
  }

  return chunks.filter(c => c.length > 50)
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.COHERE_API_KEY!

  const res = await fetch('https://api.cohere.com/v2/embed', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'embed-multilingual-light-v3.0',
      texts: [text],
      input_type: 'search_document',
      embedding_types: ['float'],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Embedding API error: ${err}`)
  }

  const data = await res.json()
  return data.embeddings.float[0]
}
