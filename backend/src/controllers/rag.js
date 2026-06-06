/**
 * rag.js — RAG ingestion and status endpoints.
 * Decoupled into Route-Controller-Service pattern.
 */

import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import * as ragController from '../controllers/ragController.js';

const router = express.Router();

/**
 * POST /api/rag/ingest-course/:courseId
 * Re-index all lessons of a course — instructor/admin only.
 */
router.post('/ingest-course/:courseId', protect, restrictTo('instructor', 'admin'), ragController.ingestCourse);

/**
 * POST /api/rag/ingest-lesson/:courseId/:lessonId
 * Re-index a single lesson — instructor/admin only.
 */
router.post('/ingest-lesson/:courseId/:lessonId', protect, restrictTo('instructor', 'admin'), ragController.ingestLesson);

/**
 * GET /api/rag/status/:courseId
 * Return indexing status for a course.
 */
router.get('/status/:courseId', protect, ragController.getStatus);

export default router;
