/**
 * rag.js — RAG ingestion and status endpoints.
 *
 * POST /api/rag/ingest-course/:courseId    — Re-index all lessons of a course
 * POST /api/rag/ingest-lesson/:courseId/:lessonId — Re-index one lesson
 * GET  /api/rag/status/:courseId            — Return indexing status
 */

import express from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import LessonChunk from '../models/LessonChunk.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { ingestCourse, ingestLesson } from '../services/rag/tutorService.js';

const router = express.Router();

/**
 * POST /api/rag/ingest-course/:courseId
 * Re-index all lessons of a course — instructor/admin only.
 */
router.post('/ingest-course/:courseId', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'courseId invalide' });
    }

    const course = await Course.findById(courseId).select('instructor title');
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    // Ownership check (admin can do anything)
    if (
      req.user.role !== 'admin' &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Non autorisé — ce n\'est pas votre cours' });
    }

    console.log(`🔄 [RAG] Ingestion demandée pour "${course.title}" par ${req.user.name}`);

    const result = await ingestCourse(courseId);

    res.json({
      message: `Indexation terminée : ${result.lessonsIngested} leçon(s), ${result.totalChunks} chunks`,
      ...result,
    });
  } catch (error) {
    console.error('❌ [RAG] Erreur ingest-course:', error.message);
    res.status(500).json({ message: 'Erreur lors de l\'indexation', error: error.message });
  }
});


/**
 * POST /api/rag/ingest-lesson/:courseId/:lessonId
 * Re-index a single lesson — instructor/admin only.
 */
router.post('/ingest-lesson/:courseId/:lessonId', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'courseId ou lessonId invalide' });
    }

    const course = await Course.findById(courseId).select('instructor title');
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    if (
      req.user.role !== 'admin' &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const result = await ingestLesson(courseId, lessonId);

    res.json({
      message: `Leçon indexée : ${result.chunksStored} chunks`,
      ...result,
    });
  } catch (error) {
    console.error('❌ [RAG] Erreur ingest-lesson:', error.message);
    res.status(500).json({ message: 'Erreur lors de l\'indexation', error: error.message });
  }
});


/**
 * GET /api/rag/status/:courseId
 * Return indexing status for a course.
 */
router.get('/status/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'courseId invalide' });
    }

    const course = await Course.findById(courseId).select('lessons title');
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    const totalLessons = course.lessons.length;
    const indexedLessons = course.lessons.filter((l) => l.aiIndexed).length;

    // Count total chunks in MongoDB
    const chunks = await LessonChunk.countDocuments({ courseId });

    // Check if any chunks have embeddings
    const chunksWithEmbeddings = await LessonChunk.countDocuments({
      courseId,
      embedding: { $exists: true, $ne: [] },
    });

    res.json({
      courseId,
      courseTitle: course.title,
      indexedLessons,
      totalLessons,
      chunks,
      chunksWithEmbeddings,
      hasEmbeddings: chunksWithEmbeddings > 0,
      ready: indexedLessons > 0 && chunks > 0,
    });
  } catch (error) {
    console.error('❌ [RAG] Erreur status:', error.message);
    res.status(500).json({ message: 'Erreur récupération statut', error: error.message });
  }
});


export default router;
