/**
 * quiz.js — Quiz endpoints.
 * Decoupled into Route-Controller-Service pattern.
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import * as quizController from '../controllers/quizController.js';

const router = express.Router();

/**
 * POST /api/quiz/:courseId/generate
 * Generate a new quiz based on a topic or course content.
 */
router.post('/:courseId/generate', protect, quizController.generateQuiz);

/**
 * POST /api/quiz/:courseId/submit
 * Submit answers, calculate score, and save progress.
 */
router.post('/:courseId/submit', protect, quizController.submitQuiz);

export default router;
