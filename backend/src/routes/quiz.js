import express from 'express';
import { generateQuiz } from '../services/rag/tutorService.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();


router.post('/:courseId/generate', protect, async (req, res) => {
  try {
    const { topic, difficulty = 1, count = 5 } = req.body;
    const { courseId } = req.params;


    const course = await Course.findById(courseId).select('lessons');
    const fallbackContext = course
      ? course.lessons
        .filter((l) => l.content?.trim())
        .map((l) => `## ${l.title}\n${l.content}`)
        .join('\n\n---\n\n')
      : '';

    const questions = await generateQuiz(courseId, topic, difficulty, count, fallbackContext);

    res.json({ questions, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Erreur génération quiz:', error?.message);
    console.error(error?.stack);

    const msg = error?.message || '';


    if (msg.includes('Aucun contenu')) {
      return res.status(200).json({
        error: true,
        message: '📚 Ce cours ne contient pas encore de leçons avec du texte. Ajoutez du contenu dans au moins une leçon pour générer un quiz.',
      });
    }


    if (msg.includes('GEMINI_API_KEY') || msg.includes('API_KEY_INVALID')) {
      return res.status(200).json({
        error: true,
        message: '⚠️ Clé API Gemini manquante ou invalide. Vérifiez `GEMINI_API_KEY` dans `backend/.env`.',
      });
    }


    if (msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      return res.status(200).json({
        error: true,
        message: '⚠️ Quota Gemini dépassé. Réessayez dans quelques instants.',
      });
    }


    if (msg.includes('JSON') || msg.includes('parseable')) {
      return res.status(200).json({
        error: true,
        message: '⚠️ La réponse de l\'IA était mal formatée. Réessayez — c\'est généralement transitoire.',
      });
    }

    res.status(500).json({ message: 'Erreur génération quiz', error: msg });
  }
});


router.post('/:courseId/submit', protect, async (req, res) => {
  try {
    const { answers, questions } = req.body;
    const { courseId } = req.params;

    let correct = 0;
    const results = questions.map((q, i) => {
      const isCorrect = answers[i] === q.correctAnswer;
      if (isCorrect) correct++;
      return { question: q.question, isCorrect, explanation: q.explanation, yourAnswer: answers[i], correctAnswer: q.correctAnswer };
    });

    const score = Math.round((correct / questions.length) * 100);

    await Progress.findOneAndUpdate(
      { student: req.user._id, course: courseId },
      { $push: { quizScores: { score, totalQuestions: questions.length } } },
      { upsert: true }
    );

    const nextDifficulty = score >= 80 ? 'avancé' : score >= 50 ? 'intermédiaire' : 'débutant';

    res.json({ score, correct, total: questions.length, results, nextRecommendation: nextDifficulty });
  } catch (error) {
    res.status(500).json({ message: 'Erreur soumission quiz', error: error.message });
  }
});

export default router;
