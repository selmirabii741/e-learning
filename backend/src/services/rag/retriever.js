/**
 * retriever.js — The core retrieval engine for RAG.
 *
 * Primary: embed question → cosine similarity against stored chunk embeddings → top-K
 * Fallback: MongoDB $text search when embeddings are unavailable
 */

import LessonChunk from '../../models/LessonChunk.js';
import { embedQuery, isEmbeddingAvailable } from './embeddingService.js';
import { textSearchChunks } from './vectorStore.js';

/**
 * Compute cosine similarity between two vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} - Similarity score between -1 and 1
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

/**
 * Retrieve the most relevant chunks for a question.
 *
 * @param {string} question - The user's question
 * @param {string} courseId - The course to search in
 * @param {string|null} lessonId - Optional: restrict to a single lesson
 * @param {number} topK - Number of chunks to return (default 5)
 * @returns {Promise<{ chunks: Array, method: 'vector'|'text'|'none' }>}
 */
export async function retrieve(question, courseId, lessonId = null, topK = 5) {
  if (!question?.trim() || !courseId) {
    return { chunks: [], method: 'none' };
  }

  // ── 1. Try vector retrieval (embedding-based cosine similarity) ──
  if (isEmbeddingAvailable()) {
    const questionEmbedding = await embedQuery(question);

    if (questionEmbedding) {
      // Fetch chunks that have embeddings
      const filter = { courseId };
      if (lessonId) filter.lessonId = lessonId;
      filter.embedding = { $exists: true, $ne: [] };

      const candidateChunks = await LessonChunk.find(filter)
        .select('content chunkIndex lessonId metadata embedding')
        .lean();

      if (candidateChunks.length > 0) {
        // Compute similarity for each chunk
        const scored = candidateChunks.map((chunk) => ({
          ...chunk,
          similarity: cosineSimilarity(questionEmbedding, chunk.embedding),
        }));

        // Sort by similarity descending and take top-K
        scored.sort((a, b) => b.similarity - a.similarity);
        const topChunks = scored.slice(0, topK).map(({ embedding, ...rest }) => rest); // Strip embedding from result

        console.log(
          `🔍 [retriever] Vector search: ${candidateChunks.length} candidats → top ${topChunks.length} (meilleur score: ${scored[0]?.similarity?.toFixed(4)})`
        );

        return { chunks: topChunks, method: 'vector' };
      }
    }
  }

  // ── 2. Fallback to MongoDB text search ──
  console.log('🔍 [retriever] Fallback → recherche textuelle MongoDB');
  const textChunks = await textSearchChunks(question, courseId, lessonId, topK);

  if (textChunks.length > 0) {
    return { chunks: textChunks, method: 'text' };
  }

  // ── 3. No results found ──
  return { chunks: [], method: 'none' };
}
