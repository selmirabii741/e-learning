/**
 * embeddingService.js — Generate embeddings using OpenAI's text-embedding-3-small.
 * Direct fetch() calls — no LangChain embedding dependency needed.
 * Graceful failure: returns null when API key is missing or on errors.
 */

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIM = 1536;
const BATCH_SIZE = 100; // OpenAI supports up to 2048 inputs per request

/**
 * Check if embedding service is available.
 * @returns {boolean}
 */
export function isEmbeddingAvailable() {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Generate embeddings for an array of texts.
 * @param {string[]} texts - Array of text strings to embed
 * @returns {Promise<number[][]|null>} - Array of embedding vectors, or null on failure
 */
export async function embedTexts(texts) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ [embeddingService] OPENAI_API_KEY manquant — pas d\'embeddings');
    return null;
  }

  if (!texts || texts.length === 0) return [];

  try {
    const allEmbeddings = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);

      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: batch,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || `OpenAI Embedding HTTP ${res.status}`;
        console.error(`❌ [embeddingService] Erreur API: ${msg}`);
        return null;
      }

      const data = await res.json();
      const sorted = data.data.sort((a, b) => a.index - b.index);
      allEmbeddings.push(...sorted.map((d) => d.embedding));
    }

    return allEmbeddings;
  } catch (err) {
    console.error('❌ [embeddingService] Erreur:', err.message);
    return null;
  }
}

/**
 * Generate embedding for a single query text.
 * @param {string} text - The query text
 * @returns {Promise<number[]|null>} - Embedding vector, or null on failure
 */
export async function embedQuery(text) {
  if (!text?.trim()) return null;
  const result = await embedTexts([text]);
  return result?.[0] || null;
}

/**
 * Get the expected embedding dimension.
 * @returns {number}
 */
export function getEmbeddingDimension() {
  return EMBEDDING_DIM;
}
