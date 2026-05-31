import express from 'express';
import Course from '../models/Course.js';
import { protect } from '../middleware/auth.js';
import { aiChat, generateQuiz, generateSummary } from '../services/rag/tutorService.js';
import { countChunksByLesson } from '../services/rag/vectorStore.js';

const router = express.Router();

// Cache for extracted PDF texts to avoid repeating pdf-parse
// Maps lessonId -> extractedText
const pdfCache = new Map();

/**
 * Helper to get the content of a specific lesson (PDF or text)
 */
async function getLessonContent(courseId, lessonId) {
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

/**
 * POST /api/ai/lesson-quiz
 * Generate a quiz based on the current lesson content — uses RAG when available
 */
router.post('/lesson-quiz', protect, async (req, res) => {
  try {
    const { courseId, lessonId, count = 5, difficulty = 1 } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({ message: 'courseId et lessonId sont requis.' });
    }

    // Check if RAG chunks exist for this lesson
    const chunkCount = await countChunksByLesson(lessonId);

    if (chunkCount > 0) {
      // Use RAG-powered quiz generation
      console.log(`🧠 [ai/lesson-quiz] RAG mode — ${chunkCount} chunks pour leçon ${lessonId}`);
      try {
        const questions = await generateQuiz(courseId, '', difficulty, count, '', lessonId);
        return res.json({ questions });
      } catch (err) {
        console.error('⚠️ [ai/lesson-quiz] RAG quiz failed, fallback:', err.message);
        // Fall through to legacy
      }
    }

    // Legacy fallback: extract and use raw content
    const rawContent = await getLessonContent(courseId, lessonId);
    if (!rawContent) {
      return res.status(400).json({ message: 'Aucun contenu lisible trouvé pour cette leçon.' });
    }

    const context = rawContent.substring(0, 30000);
    const difficultyLabel = difficulty === 1 ? 'débutant' : difficulty === 3 ? 'avancé' : 'intermédiaire';

    const systemPrompt = `Tu es un générateur de quiz pédagogique.
Génère des QCM uniquement à partir du contenu de la leçon fourni.
N'utilise aucune connaissance externe.
Réponds uniquement en JSON valide.`;

    const userMessage = `Génère exactement ${count} questions QCM de niveau ${difficultyLabel} basées uniquement sur le contenu de la leçon suivant.
N'invente aucune information externe.

Contenu de la leçon :
${context}

Réponds uniquement sous le format JSON valide suivant, sans aucun bloc markdown, sans texte explicatif avant ou après :
{
  "questions": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": 0,
      "explanation": "..."
    }
  ]
}`;

    const rawResponse = await aiChat(systemPrompt, userMessage);

    // Parse the response
    const stripped = rawResponse
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('JSON de quiz invalide reçu de l\'IA:', rawResponse);
      return res.status(500).json({ message: 'L\'IA a renvoyé un format de réponse invalide. Réessayez.' });
    }

    const quizData = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(quizData.questions)) {
      return res.status(500).json({ message: 'Format de quiz invalide généré par l\'IA.' });
    }

    res.json({ questions: quizData.questions });
  } catch (error) {
    console.error('Erreur génération quiz leçon:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la génération du quiz.' });
  }
});

/**
 * POST /api/ai/lesson-summary
 * Generate a summary based on the current lesson content — uses RAG when available
 */
router.post('/lesson-summary', protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({ message: 'courseId et lessonId sont requis.' });
    }

    // Check if RAG chunks exist for this lesson
    const chunkCount = await countChunksByLesson(lessonId);

    if (chunkCount > 0) {
      console.log(`📝 [ai/lesson-summary] RAG mode — ${chunkCount} chunks pour leçon ${lessonId}`);
      try {
        const summary = await generateSummary(courseId, '', lessonId);
        return res.json({ summary, source: 'RAG — contenu indexé' });
      } catch (err) {
        console.error('⚠️ [ai/lesson-summary] RAG summary failed, fallback:', err.message);
      }
    }

    // Legacy fallback
    const rawContent = await getLessonContent(courseId, lessonId);
    if (!rawContent) {
      return res.status(400).json({ message: 'Aucun contenu lisible trouvé pour cette leçon.' });
    }

    const context = rawContent.substring(0, 30000);

    const systemPrompt = `Tu es un assistant pédagogique.
Résume uniquement le contenu de la leçon fourni.
N'invente aucune information externe.
Structure le résumé avec :
- titre
- résumé court
- points clés
- concepts importants
- conclusion.`;

    const userMessage = `Voici le contenu de la leçon à résumer :\n\n${context}`;

    const summary = await aiChat(systemPrompt, userMessage);

    res.json({
      summary,
      source: 'PDF de la leçon',
    });
  } catch (error) {
    console.error('Erreur génération résumé leçon:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la génération du résumé.' });
  }
});

export default router;
