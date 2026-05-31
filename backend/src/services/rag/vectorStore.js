/**
 * vectorStore.js — Manage storing/deleting/querying LessonChunk documents in MongoDB.
 */

import LessonChunk from '../../models/LessonChunk.js';

/**
 * Delete all existing chunks for a lesson, then insert new ones.
 * @param {string} courseId
 * @param {string} lessonId
 * @param {string[]} chunks - Array of text chunks
 * @param {number[][]|null} embeddings - Array of embedding vectors (or null)
 * @param {Object} metadata - { courseTitle, lessonTitle, pdfName }
 * @returns {Promise<number>} - Number of chunks inserted
 */
export async function storeChunks(courseId, lessonId, chunks, embeddings, metadata = {}) {
  // Delete old chunks for this lesson first
  await LessonChunk.deleteMany({ courseId, lessonId });

  if (!chunks || chunks.length === 0) return 0;

  const documents = chunks.map((content, index) => ({
    courseId,
    lessonId,
    content,
    chunkIndex: index,
    metadata: {
      courseTitle: metadata.courseTitle || '',
      lessonTitle: metadata.lessonTitle || '',
      pdfName: metadata.pdfName || '',
    },
    // Only include embedding if available for this chunk
    ...(embeddings && embeddings[index] ? { embedding: embeddings[index] } : {}),
  }));

  const result = await LessonChunk.insertMany(documents);
  return result.length;
}

/**
 * Get all chunks for a specific lesson.
 * @param {string} lessonId
 * @returns {Promise<Array>}
 */
export async function getChunksByLesson(lessonId) {
  return LessonChunk.find({ lessonId })
    .sort({ chunkIndex: 1 })
    .lean();
}

/**
 * Get all chunks for a course.
 * @param {string} courseId
 * @returns {Promise<Array>}
 */
export async function getChunksByCourse(courseId) {
  return LessonChunk.find({ courseId })
    .sort({ lessonId: 1, chunkIndex: 1 })
    .lean();
}

/**
 * Delete all chunks for a lesson.
 * @param {string} lessonId
 * @returns {Promise<number>} - Number of deleted chunks
 */
export async function deleteChunksByLesson(lessonId) {
  const result = await LessonChunk.deleteMany({ lessonId });
  return result.deletedCount;
}

/**
 * Delete all chunks for a course.
 * @param {string} courseId
 * @returns {Promise<number>} - Number of deleted chunks
 */
export async function deleteChunksByCourse(courseId) {
  const result = await LessonChunk.deleteMany({ courseId });
  return result.deletedCount;
}

/**
 * Count chunks for a course.
 * @param {string} courseId
 * @returns {Promise<number>}
 */
export async function countChunksByCourse(courseId) {
  return LessonChunk.countDocuments({ courseId });
}

/**
 * Count chunks for a lesson.
 * @param {string} lessonId
 * @returns {Promise<number>}
 */
export async function countChunksByLesson(lessonId) {
  return LessonChunk.countDocuments({ lessonId });
}

/**
 * Text search fallback — find chunks by keyword search.
 * @param {string} query - The search query
 * @param {string} courseId
 * @param {string|null} lessonId - Optional: scope to a single lesson
 * @param {number} topK
 * @returns {Promise<Array>}
 */
export async function textSearchChunks(query, courseId, lessonId = null, topK = 5) {
  const searchTerms = query
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .join(' ');

  if (!searchTerms) return [];

  const filter = { courseId, $text: { $search: searchTerms } };
  if (lessonId) filter.lessonId = lessonId;

  try {
    return await LessonChunk.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(topK)
      .select('-embedding') // Never send embeddings to caller
      .lean();
  } catch (err) {
    console.error('❌ [vectorStore] Erreur text search:', err.message);
    return [];
  }
}
