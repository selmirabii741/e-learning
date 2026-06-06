/**
 * pdfCacheHelper.js — Utility for extracting and caching text from lesson PDFs.
 */

import Course from '../models/Course.js';

// Cache for extracted PDF texts to avoid repeating pdf-parse
// Maps lessonId -> extractedText
export const pdfCache = new Map();

/**
 * Helper to get the content of a specific lesson (PDF or text)
 */
export async function getLessonContent(courseId, lessonId) {
  if (!courseId || !lessonId) {
    throw new Error('Identifiants manquants.');
  }

  // Check cache first
  if (pdfCache.has(lessonId)) {
    return pdfCache.get(lessonId);
  }

  const course = await Course.findById(courseId).select('lessons title');
  if (!course) {
    throw new Error('Cours non trouvé.');
  }

  const lesson = course.lessons.id(lessonId) || course.lessons.find(l => String(l._id) === lessonId);
  if (!lesson) {
    throw new Error('Leçon non trouvée.');
  }

  let textContent = '';

  // 1. If lesson has PDF buffer, parse it
  if (lesson.pdfData && lesson.pdfData.length > 0) {
    try {
      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
      const data = await pdfParse(lesson.pdfData);
      textContent = data.text?.trim() || '';
      if (textContent) {
        pdfCache.set(lessonId, textContent);
        return textContent;
      }
    } catch (e) {
      console.error(`Erreur d'extraction PDF pour la leçon ${lessonId}:`, e.message);
    }
  }

  // 2. Fallback to text content
  if (lesson.content && lesson.content.trim()) {
    textContent = lesson.content.trim();
  }

  return textContent;
}
