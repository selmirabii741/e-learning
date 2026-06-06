/**
 * ai.js — AI endpoints for lesson quizes and summaries.
 * Decoupled into Route-Controller-Service pattern.
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

/**
 * POST /api/ai/lesson-quiz
 * Generate a quiz based on the current lesson content — uses RAG when available
 */
router.post('/lesson-quiz', protect, aiController.getLessonQuiz);

/**
 * POST /api/ai/lesson-summary
 * Generate a summary based on the current lesson content — uses RAG when available
 */
router.post('/lesson-summary', protect, aiController.getLessonSummary);

export default router;
