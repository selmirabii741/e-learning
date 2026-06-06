import express from 'express';
import crypto from 'crypto';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import AccessRequest from '../models/AccessRequest.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { ingestCourse, ingestLesson } from '../services/rag/tutorService.js';
import { deleteChunksByLesson, deleteChunksByCourse } from '../services/rag/vectorStore.js';
import { uploadPDF } from '../middleware/upload.js';


function reIngestCourse(course) {
  // Trigger real RAG ingestion (async, non-blocking)
  ingestCourse(course._id.toString()).catch((err) =>
    console.error('RAG ingest error:', err.message)
  );
}

function reIngestSingleLesson(courseId, lessonId) {
  // Trigger real RAG ingestion for a single lesson (async, non-blocking)
  ingestLesson(courseId.toString(), lessonId.toString()).catch((err) =>
    console.error('RAG lesson ingest error:', err.message)
  );
}

const router = express.Router();




router.get('/', async (req, res) => {
  try {
    const { category, level, search, instructor } = req.query;
    const filter = { isPublished: true };

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (instructor) filter.instructor = instructor;

    const courses = await Course.find(filter)
      .populate('instructor', 'name avatar speciality')
      .select('-lessons.content -lessons.pdfData -lessons.transcript -vectorIds')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ courses, total: courses.length });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.get('/categories', async (req, res) => {
  try {
    const categories = await Course.distinct('category', { isPublished: true });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});



router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q?.trim()) return res.json({ results: [] });

    const regex = new RegExp(q.trim(), 'i');

    const courses = await Course.find({
      isPublished: true,
      $or: [
        { title: regex },
        { description: regex },
        { category: regex },
        { tags: regex },
        { 'lessons.title': regex },
        { 'lessons.content': regex },
      ],
    })
      .populate('instructor', 'name avatar')
      .select('title description thumbnail category level lessons instructor enrolledStudents')
      .limit(20);


    const results = [];
    for (const course of courses) {

      if (regex.test(course.title) || regex.test(course.description) || regex.test(course.category)) {
        results.push({
          type: 'course',
          courseId: course._id,
          title: course.title,
          subtitle: `${course.category} · ${course.level} · ${course.enrolledStudents?.length || 0} étudiants`,
          thumbnail: course.thumbnail,
          instructor: course.instructor?.name,
        });
      }

      for (const lesson of course.lessons) {
        if (regex.test(lesson.title) || regex.test(lesson.content)) {

          const text = lesson.content || '';
          const idx = text.search(regex);
          const excerpt = idx >= 0
            ? '...' + text.slice(Math.max(0, idx - 40), idx + 80).replace(/\n/g, ' ') + '...'
            : '';
          results.push({
            type: 'lesson',
            courseId: course._id,
            lessonId: lesson._id,
            title: lesson.title,
            subtitle: `Dans : ${course.title}`,
            excerpt,
            thumbnail: course.thumbnail,
          });
        }
      }
    }

    res.json({ results: results.slice(0, 25) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.post('/:id/lessons/:lessonId/translate', protect, async (req, res) => {
  try {
    const { targetLang } = req.body;
    if (!targetLang) return res.status(400).json({ message: 'targetLang requis' });

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });


    let lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) {
      lesson = course.lessons.find(l => String(l._id) === req.params.lessonId);
    }
    if (!lesson) return res.status(404).json({ message: 'Leçon non trouvée', lessonId: req.params.lessonId });

    const content = lesson.content;
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Cette leçon n\'a pas de contenu texte à traduire' });
    }

    const langNames = { ar: 'Arabic', en: 'English', fr: 'French', es: 'Spanish', de: 'German', zh: 'Chinese' };
    const langName = langNames[targetLang] || targetLang;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'GROQ_API_KEY non configurée' });


    const trimmedContent = content.length > 12000 ? content.slice(0, 12000) + '\n\n[contenu tronqué]' : content;

    const prompt = `Translate the following educational course lesson content to ${langName}. Keep all technical terms accurate. Preserve paragraph structure. Return ONLY the translated text, no explanations or headers.\n\n${trimmedContent}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: `You are a professional educational translator. Translate accurately to ${langName}. Return only the translated text.` },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 8192,
      }),
    });

    const groqData = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', JSON.stringify(groqData));
      return res.status(502).json({ message: 'Erreur API Groq', detail: groqData?.error?.message });
    }

    const translated = groqData?.choices?.[0]?.message?.content;
    if (!translated) {
      console.error('Groq empty response:', JSON.stringify(groqData));
      return res.status(502).json({ message: 'Réponse vide' });
    }

    res.json({ translated, targetLang });
  } catch (error) {
    console.error('Translation error:', error.message);
    res.status(500).json({ message: 'Erreur traduction', error: error.message });
  }
});




router.get('/instructor/my', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    // Use aggregation to compute stats server-side and exclude heavy fields
    const courses = await Course.find({ instructor: req.user._id })
      .select('-lessons.content -lessons.pdfData -vectorIds -lessons.transcript')
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.isPublished).length,
      totalStudents: courses.reduce((s, c) => s + (c.enrolledStudents?.length || 0), 0),
      totalLessons: courses.reduce((s, c) => s + (c.lessons?.length || 0), 0),
    };

    res.json({ courses, stats });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


/**
 * GET /courses/instructor/my-students
 * Returns all unique students enrolled in any of the instructor's courses.
 * Each student includes: their info, which courses they're in, and progress.
 * Strict access control: only returns students from the requesting instructor's courses.
 */
router.get('/instructor/my-students', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    // 1. Get all courses belonging to this instructor
    const instructorCourses = await Course.find({ instructor: req.user._id })
      .populate('enrolledStudents', 'name email avatar createdAt')
      .select('title enrolledStudents lessons isPublished category')
      .lean();

    // 2. Build a map of unique students with their course enrollments
    const studentMap = new Map();

    for (const course of instructorCourses) {
      for (const student of (course.enrolledStudents || [])) {
        const sid = student._id.toString();
        if (!studentMap.has(sid)) {
          studentMap.set(sid, {
            ...student,
            courses: [],
            totalProgress: 0,
            courseCount: 0,
          });
        }
        studentMap.get(sid).courses.push({
          courseId: course._id,
          title: course.title,
          category: course.category,
          isPublished: course.isPublished,
          totalLessons: course.lessons?.length || 0,
        });
        studentMap.get(sid).courseCount++;
      }
    }

    // 3. Fetch progress for all these students across instructor's courses
    const courseIds = instructorCourses.map(c => c._id);
    const studentIds = [...studentMap.keys()];

    if (studentIds.length > 0) {
      const allProgress = await Progress.find({
        course: { $in: courseIds },
        student: { $in: studentIds },
      }).lean();

      // Attach progress to each student's course entry
      for (const prog of allProgress) {
        const sid = prog.student.toString();
        const entry = studentMap.get(sid);
        if (!entry) continue;

        const courseEntry = entry.courses.find(
          c => c.courseId.toString() === prog.course.toString()
        );
        if (courseEntry) {
          courseEntry.completedLessons = prog.completedLessons?.length || 0;
          courseEntry.completionPct = courseEntry.totalLessons > 0
            ? Math.round((courseEntry.completedLessons / courseEntry.totalLessons) * 100)
            : 0;
          courseEntry.lastAccessed = prog.lastAccessed;
        }
      }

      // Calculate average progress per student
      for (const [, student] of studentMap) {
        const withProgress = student.courses.filter(c => c.completionPct != null);
        student.avgProgress = withProgress.length > 0
          ? Math.round(withProgress.reduce((s, c) => s + c.completionPct, 0) / withProgress.length)
          : 0;
      }
    }

    const students = [...studentMap.values()].sort((a, b) => b.courseCount - a.courseCount);

    res.json({
      students,
      total: students.length,
      courseCount: instructorCourses.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


/** GET /courses/my-requests — Student checks their own request statuses */
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await AccessRequest.find({ student: req.user._id })
      .populate('course', 'title category thumbnail')
      .populate('instructor', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .select('-lessons.pdfData -lessons.content -vectorIds')
      .populate('instructor', 'name avatar bio speciality')
      .lean();

    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });


    const isInstructor = course.instructor._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const userId = req.user._id.toString();
    const isEnrolled = (course.enrolledStudents || []).some(s => s.toString() === userId);

    if (!isInstructor && !isAdmin && !course.isPublished) {
      return res.status(403).json({ message: 'Cours non disponible' });
    }


    const progress = await Progress.findOne({
      student: req.user._id,
      course: course._id,
    });


    let completionPercentage = 0;
    if (progress && course.lessons.length > 0) {
      completionPercentage = Math.round(
        (progress.completedLessons.length / course.lessons.length) * 100
      );
    }

    res.json({
      course,
      progress: progress ? { ...progress.toObject(), completionPercentage } : null,
      isEnrolled,
      isInstructor,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
    if (!course.isPublished) return res.status(400).json({ message: 'Cours non disponible' });

    // If course requires a code, block direct enrollment
    if (course.requireCode) {
      return res.status(403).json({
        message: 'Ce cours nécessite un code d\'inscription. Utilisez "Rejoindre avec un code".',
        requireCode: true,
      });
    }

    if (course.enrolledStudents.includes(req.user._id)) {
      return res.status(400).json({ message: 'Déjà inscrit' });
    }

    course.enrolledStudents.push(req.user._id);
    await course.save();


    await Progress.create({ student: req.user._id, course: course._id });


    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { enrolledCourses: course._id },
    });

    res.json({ message: 'Inscription réussie' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.delete('/:id/unenroll', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    course.enrolledStudents = course.enrolledStudents.filter(
      (s) => s.toString() !== req.user._id.toString()
    );
    await course.save();

    await Progress.deleteOne({ student: req.user._id, course: course._id });
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { enrolledCourses: course._id },
    });

    res.json({ message: 'Désinscription réussie' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


/* ═══════════════════════════════════════════════════════════════════════════
   SECURE JOIN SYSTEM — Code-based enrollment with relationship verification
═══════════════════════════════════════════════════════════════════════════ */

/**
 * POST /courses/join-by-code
 * Student submits { code }. The server:
 *   1. Finds the course matching the enrollmentCode
 *   2. Verifies the student has a prior relationship with the instructor
 *      (enrolled in another of their courses OR has an active message thread)
 *   3. Enrolls the student if verified
 */
router.post('/join-by-code', protect, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code?.trim()) {
      return res.status(400).json({ message: 'Le code d\'inscription est requis' });
    }

    const course = await Course.findOne({ enrollmentCode: code.trim().toUpperCase() })
      .populate('instructor', 'name email');
    if (!course) {
      return res.status(404).json({ message: 'Code invalide — aucun cours trouvé' });
    }
    if (!course.isPublished) {
      return res.status(400).json({ message: 'Ce cours n\'est pas encore disponible' });
    }

    // Already enrolled?
    const studentId = req.user._id.toString();
    if (course.enrolledStudents.some(s => s.toString() === studentId)) {
      return res.status(400).json({ message: 'Déjà inscrit', courseId: course._id });
    }

    const instructorId = course.instructor._id.toString();

    // ── Relationship verification ──
    // Check 1: Student is enrolled in another course by the same instructor
    const hasOtherCourse = await Course.exists({
      instructor: instructorId,
      _id: { $ne: course._id },
      enrolledStudents: req.user._id,
    });

    // Check 2: Student has exchanged messages with the instructor
    let hasMessageThread = false;
    if (!hasOtherCourse) {
      hasMessageThread = await Message.exists({
        $or: [
          { sender: req.user._id, receiver: instructorId },
          { sender: instructorId, receiver: req.user._id },
        ],
      });
    }

    // Check 3: Student was directly invited (stored in course.invitedStudents)
    const wasInvited = course.invitedStudents?.some(s => s.toString() === studentId);

    if (!hasOtherCourse && !hasMessageThread && !wasInvited) {
      return res.status(403).json({
        message: 'Accès refusé — Vous devez être lié à cet instructeur pour rejoindre ce cours. Contactez-le d\'abord par message ou faites-vous inviter.',
        instructorName: course.instructor.name,
      });
    }

    // ── Enroll the student ──
    course.enrolledStudents.push(req.user._id);
    // Remove from invitedStudents if present
    if (course.invitedStudents) {
      course.invitedStudents = course.invitedStudents.filter(s => s.toString() !== studentId);
    }
    await course.save();

    await Progress.create({ student: req.user._id, course: course._id });
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { enrolledCourses: course._id },
    });

    res.json({
      message: 'Inscription réussie via code',
      courseId: course._id,
      courseTitle: course.title,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


/**
 * POST /courses/:id/regenerate-code
 * Instructor regenerates the enrollment code for their course
 */
router.post('/:id/regenerate-code', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    if (
      req.user.role !== 'admin' &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    course.enrollmentCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await course.save();

    res.json({ enrollmentCode: course.enrollmentCode });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


/**
 * POST /courses/:id/invite
 * Instructor invites a student by email — adds them to invitedStudents
 */
router.post('/:id/invite', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ message: 'Email requis' });

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    if (
      req.user.role !== 'admin' &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const student = await User.findOne({ email: email.trim().toLowerCase(), role: 'student' });
    if (!student) return res.status(404).json({ message: 'Aucun étudiant trouvé avec cet email' });

    if (course.enrolledStudents.some(s => s.toString() === student._id.toString())) {
      return res.status(400).json({ message: 'Cet étudiant est déjà inscrit' });
    }

    if (course.invitedStudents?.some(s => s.toString() === student._id.toString())) {
      return res.status(400).json({ message: 'Cet étudiant est déjà invité' });
    }

    if (!course.invitedStudents) course.invitedStudents = [];
    course.invitedStudents.push(student._id);
    await course.save();

    res.json({
      message: `Invitation envoyée à ${student.name}`,
      studentName: student.name,
      studentEmail: student.email,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});



/* ═══════════════════════════════════════════════════════════════════════════
   ACCESS REQUEST SYSTEM — Students can request access, instructors approve/reject
═══════════════════════════════════════════════════════════════════════════ */

/** POST /courses/:id/request-access — Student requests access to a course */
router.post('/:id/request-access', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const course = await Course.findById(req.params.id).populate('instructor', 'name');
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
    if (!course.isPublished) return res.status(400).json({ message: 'Cours non disponible' });

    // Already enrolled?
    if (course.enrolledStudents.some(s => s.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Vous êtes déjà inscrit à ce cours' });
    }

    // Check for existing request
    const existing = await AccessRequest.findOne({ student: req.user._id, course: course._id });
    if (existing) {
      if (existing.status === 'pending') {
        return res.status(400).json({ message: 'Vous avez déjà une demande en attente pour ce cours' });
      }
      if (existing.status === 'rejected') {
        // Allow re-request after rejection
        existing.status = 'pending';
        existing.message = message || '';
        existing.reviewedAt = null;
        await existing.save();
        return res.json({ message: 'Demande renvoyée avec succès', request: existing });
      }
    }

    const request = await AccessRequest.create({
      student: req.user._id,
      course: course._id,
      instructor: course.instructor._id,
      message: message || '',
    });

    // Send notification message to instructor
    await Message.create({
      sender: req.user._id,
      receiver: course.instructor._id,
      content: `📩 Demande d'accès au cours "${course.title}"\n\n${message ? `Message: ${message}` : 'Aucun message joint.'}\n\nRendez-vous dans "Demandes d'accès" pour approuver ou refuser.`,
    });

    res.status(201).json({ message: 'Demande envoyée avec succès', request });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Demande déjà envoyée' });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});




/** GET /courses/instructor/access-requests — Instructor sees pending requests */
router.get('/instructor/access-requests', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const courseIds = await Course.find({ instructor: req.user._id }).distinct('_id');

    const requests = await AccessRequest.find({
      course: { $in: courseIds },
      ...(req.query.status ? { status: req.query.status } : {}),
    })
      .populate('student', 'name email avatar createdAt')
      .populate('course', 'title category')
      .sort({ createdAt: -1 })
      .lean();

    const counts = {
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };

    res.json({ requests, counts });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


/** PUT /courses/access-requests/:requestId/approve — Instructor approves */
router.put('/access-requests/:requestId/approve', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const request = await AccessRequest.findById(req.params.requestId)
      .populate('student', 'name email')
      .populate('course', 'title');
    if (!request) return res.status(404).json({ message: 'Demande non trouvée' });

    // Verify ownership
    if (req.user.role !== 'admin' && request.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Demande déjà ${request.status === 'approved' ? 'approuvée' : 'refusée'}` });
    }

    // Approve
    request.status = 'approved';
    request.reviewedAt = new Date();
    await request.save();

    // Auto-enroll the student
    const course = await Course.findById(request.course._id);
    if (course && !course.enrolledStudents.some(s => s.toString() === request.student._id.toString())) {
      course.enrolledStudents.push(request.student._id);
      if (!course.invitedStudents) course.invitedStudents = [];
      course.invitedStudents.push(request.student._id); // So join-by-code also works
      await course.save();
      await Progress.create({ student: request.student._id, course: course._id });
      await User.findByIdAndUpdate(request.student._id, {
        $addToSet: { enrolledCourses: course._id },
      });
    }

    // Notify student
    await Message.create({
      sender: req.user._id,
      receiver: request.student._id,
      content: `✅ Votre demande d'accès au cours "${request.course.title}" a été approuvée ! Vous pouvez maintenant y accéder.`,
    });

    res.json({ message: `Accès approuvé pour ${request.student.name}`, request });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


/** PUT /courses/access-requests/:requestId/reject — Instructor rejects */
router.put('/access-requests/:requestId/reject', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const request = await AccessRequest.findById(req.params.requestId)
      .populate('student', 'name email')
      .populate('course', 'title');
    if (!request) return res.status(404).json({ message: 'Demande non trouvée' });

    if (req.user.role !== 'admin' && request.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Demande déjà ${request.status === 'approved' ? 'approuvée' : 'refusée'}` });
    }

    request.status = 'rejected';
    request.reviewedAt = new Date();
    await request.save();

    // Notify student
    await Message.create({
      sender: req.user._id,
      receiver: request.student._id,
      content: `❌ Votre demande d'accès au cours "${request.course.title}" a été refusée. Vous pouvez contacter l'instructeur pour plus d'informations.`,
    });

    res.json({ message: `Demande refusée pour ${request.student.name}`, request });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.post('/', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.create({
      ...req.body,
      instructor: req.user._id,
    });

    reIngestCourse(course);
    res.status(201).json({ course });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.put('/:id', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });


    if (
      req.user.role !== 'admin' &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { title, description, category, level, thumbnail, isPublished } = req.body;
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (isPublished !== undefined) course.isPublished = isPublished;

    await course.save();
    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.delete('/:id', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    if (
      req.user.role !== 'admin' &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await Progress.deleteMany({ course: course._id });
    // Clean up all RAG chunks for this course
    await deleteChunksByCourse(course._id);
    await course.deleteOne();

    res.json({ message: 'Cours supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});




router.post('/:id/lessons', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    if (
      req.user.role !== 'admin' &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { title, content, pdfUrl, duration } = req.body;
    const order = course.lessons.length + 1;
    course.lessons.push({ title, content, pdfUrl, duration: duration || 0, order });

    // Auto-publish : publié dès qu'il y a au moins 1 leçon
    if (!course.isPublished && course.lessons.length >= 1) {
      course.isPublished = true;
    }

    await course.save();

    // Ingest only the new lesson (more efficient than re-indexing entire course)
    const newLesson = course.lessons[course.lessons.length - 1];
    if (content?.trim()) {
      reIngestSingleLesson(req.params.id, newLesson._id);
    }

    res.status(201).json({ course, lesson: newLesson });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.put('/:id/lessons/:lessonId', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    if (
      req.user.role !== 'admin' &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Leçon non trouvée' });

    const { title, content, pdfUrl, duration } = req.body;
    if (title !== undefined) lesson.title = title;
    if (content !== undefined) lesson.content = content;
    if (pdfUrl !== undefined) lesson.pdfUrl = pdfUrl;
    if (duration !== undefined) lesson.duration = duration;

    await course.save();

    // Re-ingest this specific lesson if content changed
    if (content !== undefined || title !== undefined) {
      reIngestSingleLesson(req.params.id, req.params.lessonId);
    }

    res.json({ course, lesson });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.delete('/:id/lessons/:lessonId', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    if (
      req.user.role !== 'admin' &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    course.lessons = course.lessons.filter(
      (l) => l._id.toString() !== req.params.lessonId
    );

    course.lessons.forEach((l, i) => { l.order = i + 1; });

    // Auto-unpublish : brouillon s'il ne reste plus de leçons
    if (course.isPublished && course.lessons.length === 0) {
      course.isPublished = false;
    }

    await course.save();

    // Clean up RAG chunks for the deleted lesson
    deleteChunksByLesson(req.params.lessonId).catch((err) =>
      console.error('RAG cleanup error:', err.message)
    );

    res.json({ message: 'Leçon supprimée', course });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});




router.post(
  '/:id/lessons/:lessonId/upload-pdf',
  protect,
  restrictTo('instructor', 'admin'),
  uploadPDF.single('pdf'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Aucun fichier PDF reçu' });

      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

      if (
        req.user.role !== 'admin' &&
        course.instructor.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ message: 'Non autorisé' });
      }

      const lesson = course.lessons.id(req.params.lessonId);
      if (!lesson) return res.status(404).json({ message: 'Leçon non trouvée' });



      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
      const data = await pdfParse(req.file.buffer);
      const extractedText = data.text.trim();

      if (!extractedText) {
        return res.status(422).json({ message: 'Le PDF ne contient pas de texte extractible (PDF scanné ?)' });
      }


      lesson.content = extractedText;
      lesson.pdfData = req.file.buffer;
      lesson.pdfName = req.file.originalname;

      lesson.pdfUrl = `/api/courses/${req.params.id}/lessons/${req.params.lessonId}/pdf`;
      await course.save();

      // Trigger RAG ingestion for this specific lesson
      reIngestSingleLesson(req.params.id, req.params.lessonId);

      res.json({
        message: `PDF ingéré avec succès (${data.numpages} page(s), ${extractedText.length} caractères extraits)`,
        lesson,
        charCount: extractedText.length,
        pages: data.numpages,
      });
    } catch (error) {
      console.error('PDF upload error:', error);
      res.status(500).json({ message: 'Erreur lors du traitement du PDF', error: error.message });
    }
  }
);



router.get('/:id/lessons/:lessonId/pdf', async (req, res) => {
  try {
    const token = req.query.token
      || (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) return res.status(401).json({ message: 'Non autorisé – Token manquant' });

    const { default: jwt } = await import('jsonwebtoken');
    const jwksClient = (await import('jwks-rsa')).default;

    const KC_URL = process.env.KEYCLOAK_URL || 'http://localhost:8180';
    const KC_REALM = process.env.KEYCLOAK_REALM || 'elearning';

    const client = jwksClient({
      jwksUri: `${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/certs`,
      cache: true,
      cacheMaxAge: 600_000,
    });

    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) return res.status(401).json({ message: 'Token invalide' });

    const key = await new Promise((resolve, reject) =>
      client.getSigningKey(decoded.header.kid, (err, k) =>
        err ? reject(err) : resolve(k.getPublicKey())
      )
    );

    jwt.verify(token, key, { algorithms: ['RS256'] });

    // Only fetch the specific lesson's pdfData — NOT the entire course
    const course = await Course.findById(req.params.id)
      .select({ 'lessons': { $elemMatch: { _id: req.params.lessonId } } });
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    const lesson = course.lessons?.[0];
    if (!lesson || !lesson.pdfData) {
      return res.status(404).json({ message: 'PDF non disponible pour cette leçon' });
    }

    const filename = lesson.pdfName || 'cours.pdf';

    // Return as base64 JSON to bypass download managers (IDM, etc.)
    if (req.query.format === 'base64') {
      const base64 = Buffer.isBuffer(lesson.pdfData)
        ? lesson.pdfData.toString('base64')
        : Buffer.from(lesson.pdfData).toString('base64');
      return res.json({ pdf: base64, filename });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(lesson.pdfData);
  } catch (error) {
    console.error('[PDF route]', error.message);
    res.status(401).json({ message: 'Non autorisé', error: error.message });
  }
});



router.get('/:id/students', protect, restrictTo('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('enrolledStudents', 'name email avatar createdAt');

    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    if (
      req.user.role !== 'admin' &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }


    const studentsWithProgress = await Promise.all(
      course.enrolledStudents.map(async (student) => {
        const progress = await Progress.findOne({
          student: student._id,
          course: course._id,
        });
        const completionPercentage = progress && course.lessons.length > 0
          ? Math.round((progress.completedLessons.length / course.lessons.length) * 100)
          : 0;
        return { ...student.toObject(), completionPercentage, progress };
      })
    );

    res.json({ students: studentsWithProgress, total: studentsWithProgress.length });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;
