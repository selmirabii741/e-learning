/**
 * aiController.js — Controller handling AI operations (lesson-quiz and lesson-summary generation).
 * Decoupled from Express routing to implement Route-Controller-Service design.
 */

import { aiChat, generateQuiz, generateSummary } from '../services/rag/tutorService.js';
import { countChunksByLesson } from '../services/rag/vectorStore.js';
import { getLessonContent } from '../utils/pdfCacheHelper.js';

/**
 * Generate a quiz based on the current lesson content — uses RAG when available
 */
export async function getLessonQuiz(req, res) {
  try {
    const { courseId, lessonId, count = 5, difficulty = 1 } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({ message: 'courseId et lessonId sont requis.' });
    }

    // Check if RAG chunks exist for this lesson
    const chunkCount = await countChunksByLesson(lessonId);

    if (chunkCount > 0) {
      // Use RAG-powered quiz generation
      console.log(`🧠 [aiController - Quiz] RAG mode — ${chunkCount} chunks pour leçon ${lessonId}`);
      try {
        const questions = await generateQuiz(courseId, '', difficulty, count, '', lessonId);
        return res.json({ questions });
      } catch (err) {
        console.error('⚠️ [aiController - Quiz] RAG quiz failed, fallback:', err.message);
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
}

/**
 * Generate a summary based on the current lesson content — uses RAG when available
 */
export async function getLessonSummary(req, res) {
  try {
    const { courseId, lessonId } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({ message: 'courseId et lessonId sont requis.' });
    }

    // Check if RAG chunks exist for this lesson
    const chunkCount = await countChunksByLesson(lessonId);

    if (chunkCount > 0) {
      console.log(`📝 [aiController - Summary] RAG mode — ${chunkCount} chunks pour leçon ${lessonId}`);
      try {
        const summary = await generateSummary(courseId, '', lessonId);
        return res.json({ summary, source: 'RAG — contenu indexé' });
      } catch (err) {
        console.error('⚠️ [aiController - Summary] RAG summary failed, fallback:', err.message);
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
}
