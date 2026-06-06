/**
 * ragController.js — Controller handling RAG ingestion and status requests.
 * Decoupled from Express routing to implement Route-Controller-Service design.
 */

import mongoose from 'mongoose';
import Course from '../models/Course.js';
import LessonChunk from '../models/LessonChunk.js';
import { ingestCourse as ingestCourseService, ingestLesson as ingestLessonService } from '../services/rag/tutorService.js';

/**
 * Trigger full course ingestion (indexing all lessons of a course in RAG)
 */
export async function ingestCourse(req, res) {
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

    console.log(`🔄 [RAG Controller] Ingestion demandée pour "${course.title}" par ${req.user.name}`);

    const result = await ingestCourseService(courseId);

    res.json({
      message: `Indexation terminée : ${result.lessonsIngested} leçon(s), ${result.totalChunks} chunks`,
      ...result,
    });
  } catch (error) {
    console.error('❌ [RAG Controller] Erreur ingest-course:', error.message);
    res.status(500).json({ message: 'Erreur lors de l\'indexation', error: error.message });
  }
}

/**
 * Trigger single lesson ingestion in RAG
 */
export async function ingestLesson(req, res) {
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

    const result = await ingestLessonService(courseId, lessonId);

    res.json({
      message: `Leçon indexée : ${result.chunksStored} chunks`,
      ...result,
    });
  } catch (error) {
    console.error('❌ [RAG Controller] Erreur ingest-lesson:', error.message);
    res.status(500).json({ message: 'Erreur lors de l\'indexation', error: error.message });
  }
}

/**
 * Get indexing status of a course
 */
export async function getStatus(req, res) {
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
    console.error('❌ [RAG Controller] Erreur status:', error.message);
    res.status(500).json({ message: 'Erreur récupération statut', error: error.message });
  }
}
