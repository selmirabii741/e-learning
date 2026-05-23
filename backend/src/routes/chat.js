import express from 'express';
import { askTutor, generateQuiz, generateSummary } from '../services/rag/tutorService.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/auth.js';
import { uploadPDF } from '../middleware/upload.js';

const router = express.Router();

// ── In-memory store for uploaded PDF text per course ──
// Maps courseId → { text, filename, pages, charCount, uploadedAt }
const pdfTextStore = new Map();


/**
 * POST /chat/:courseId/upload-pdf
 * Upload a PDF for the AI tutor context.
 * Extracts text from PDF and stores it associated with the courseId.
 */
router.post('/:courseId/upload-pdf', protect, uploadPDF.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier PDF reçu.' });
    }

    // Validate file type (double-check)
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Seuls les fichiers PDF sont acceptés.' });
    }

    const { courseId } = req.params;
    const lessonId = req.query.lessonId || req.body?.lessonId || '';

    // Extract text from PDF
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
    const data = await pdfParse(req.file.buffer);
    const extractedText = data.text?.trim() || '';

    if (!extractedText) {
      return res.status(422).json({
        message: 'Le PDF ne contient pas de texte extractible. Il s\'agit peut-être d\'un PDF scanné (image).',
      });
    }

    // Store extracted text keyed by courseId or courseId:lessonId
    const storeKey = lessonId ? `${courseId}:${lessonId}` : courseId;
    pdfTextStore.set(storeKey, {
      text: extractedText,
      filename: req.file.originalname,
      pages: data.numpages,
      charCount: extractedText.length,
      uploadedAt: new Date().toISOString(),
    });

    console.log(`📄 PDF uploadé pour ${storeKey}: "${req.file.originalname}" (${data.numpages} pages, ${extractedText.length} chars)`);

    res.json({
      message: `PDF importé avec succès : ${data.numpages} page(s), ${extractedText.length} caractères extraits.`,
      filename: req.file.originalname,
      pages: data.numpages,
      charCount: extractedText.length,
    });
  } catch (error) {
    console.error('Erreur upload PDF chat:', error?.message || error);
    res.status(500).json({
      message: 'Erreur lors du traitement du PDF.',
      error: error.message,
    });
  }
});


/**
 * GET /chat/:courseId/pdf-status
 * Check if a PDF has been uploaded for this course's tutor.
 */
router.get('/:courseId/pdf-status', protect, async (req, res) => {
  const { courseId } = req.params;
  const lessonId = req.query.lessonId || '';
  const storeKey = lessonId ? `${courseId}:${lessonId}` : courseId;
  const pdfInfo = pdfTextStore.get(storeKey);

  if (pdfInfo) {
    return res.json({
      hasPdf: true,
      filename: pdfInfo.filename,
      pages: pdfInfo.pages,
      charCount: pdfInfo.charCount,
      uploadedAt: pdfInfo.uploadedAt,
    });
  }

  // Fallback: check if course/lesson has content
  try {
    const course = await Course.findById(courseId).select('lessons');
    if (lessonId) {
      const lesson = course?.lessons?.id(lessonId)
        || course?.lessons?.find(l => String(l._id) === lessonId);
      return res.json({ hasPdf: false, hasLessonContent: !!lesson?.content?.trim() });
    }
    const hasLessonContent = course?.lessons?.some((l) => l.content?.trim());
    return res.json({ hasPdf: false, hasLessonContent: !!hasLessonContent });
  } catch {
    return res.json({ hasPdf: false, hasLessonContent: false });
  }
});


/**
 * POST /chat/:courseId
 * Ask a question to the AI tutor.
 * Uses uploaded PDF text first, falls back to lesson content.
 */

async function getLessonContext(courseId, lessonId) {
  let context = '';
  let source = '';
  const pdfKey = lessonId ? `${courseId}:${lessonId}` : courseId;
  let pdfInfo = pdfTextStore.get(pdfKey);

  if (!pdfInfo?.text && lessonId) {
    const courseWithPdf = await Course.findById(courseId).select({ 'lessons': { $elemMatch: { _id: lessonId } }, 'title': 1 });
    const lesson = courseWithPdf?.lessons?.[0];
    if (lesson && lesson.pdfData) {
      try {
        const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
        const data = await pdfParse(lesson.pdfData);
        const extractedText = data.text?.trim() || '';
        if (extractedText) {
          pdfInfo = { text: extractedText, filename: lesson.pdfName || 'Document du cours', pages: data.numpages, charCount: extractedText.length, uploadedAt: new Date().toISOString() };
          pdfTextStore.set(pdfKey, pdfInfo);
        }
      } catch (e) {
        console.error("Erreur extraction PDF:", e);
      }
    }
    if (!pdfInfo?.text && lesson?.content?.trim()) {
      context = `## ${lesson.title}\n${lesson.content}`;
      source = `leçon : ${lesson.title}`;
    }
  } else if (!pdfInfo?.text && !lessonId) {
    const course = await Course.findById(courseId).select('title lessons');
    if (course) {
      context = course.lessons.filter((l) => l.content?.trim()).map((l) => `## ${l.title}\n${l.content}`).join('\n\n---\n\n');
      source = 'contenu global des leçons';
    }
  }

  if (pdfInfo?.text) {
    context = pdfInfo.text;
    source = pdfInfo.filename ? `PDF : ${pdfInfo.filename}` : 'PDF du cours';
  }

  return { context, source };
}

router.post('/:courseId', protect, async (req, res) => {
  try {
    const { question, history = [], lessonId } = req.body;
    const { courseId } = req.params;

    if (!question?.trim()) {
      return res.status(400).json({ message: 'Question requise' });
    }

    const { context, source } = await getLessonContext(courseId, lessonId);


    const result = await askTutor(courseId, question, history, context);

    res.json({
      answer: result.answer,
      sources: result.sources,
      source,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur chat IA:', error?.message || error);

    const msg = (error?.message || '').toLowerCase();

    let friendlyMsg = '⚠️ Le tuteur IA rencontre un problème temporaire.';

    if (msg.includes('api_key') || msg.includes('manquant')) {
      friendlyMsg = '⚠️ Clé API manquante. Vérifiez la configuration dans `backend/.env`.';
    } else if (msg.includes('invalid') || msg.includes('403')) {
      friendlyMsg = '⚠️ Clé API invalide. Vérifiez votre clé dans `backend/.env`.';
    } else if (msg.includes('quota') || msg.includes('429') || msg.includes('resource_exhausted')) {
      friendlyMsg = '⚠️ Quota API temporairement dépassé. Réessayez dans quelques instants.';
    } else if (msg.includes('not found') || msg.includes('does not exist')) {
      friendlyMsg = '⚠️ Modèle IA indisponible. Vérifiez votre configuration API.';
    }

    res.status(200).json({
      answer: friendlyMsg,
      sources: [],
      timestamp: new Date().toISOString(),
    });
  }
});


/**
 * POST /chat/:courseId/quiz
 * Generate a quiz based on lesson content
 */
router.post('/:courseId/quiz', protect, async (req, res) => {
  try {
    const { lessonId, difficulty, count } = req.body;
    const { courseId } = req.params;
    const { context } = await getLessonContext(courseId, lessonId);

    if (!context) return res.status(400).json({ message: 'Aucun contenu disponible pour générer un quiz.' });

    const quiz = await generateQuiz(courseId, '', difficulty === 'débutant' ? 1 : difficulty === 'avancé' ? 3 : 2, count || 5, context);
    res.json({ quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Erreur lors de la génération du quiz.' });
  }
});

/**
 * POST /chat/:courseId/summary
 * Generate a summary based on lesson content
 */
router.post('/:courseId/summary', protect, async (req, res) => {
  try {
    const { lessonId } = req.body;
    const { courseId } = req.params;
    const { context } = await getLessonContext(courseId, lessonId);

    if (!context) return res.status(400).json({ message: 'Aucun contenu disponible pour générer un résumé.' });

    const summary = await generateSummary(courseId, context);
    res.json({ summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Erreur lors de la génération du résumé.' });
  }
});

export default router;
