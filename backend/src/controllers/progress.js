import express from 'express';
import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, async (req, res) => {
  try {
    // Aggregation: join course with only lightweight fields (no lesson content)
    const progressList = await Progress.aggregate([
      { $match: { student: req.user._id } },
      { $sort: { lastAccessed: -1 } },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course',
          pipeline: [
            {
              $project: {
                title: 1,
                thumbnail: 1,
                category: 1,
                level: 1,
                lessonCount: { $size: '$lessons' },
              },
            },
          ],
        },
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          completionPercentage: {
            $cond: [
              { $gt: [{ $ifNull: ['$course.lessonCount', 0] }, 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: [{ $size: '$completedLessons' }, '$course.lessonCount'] },
                      100,
                    ],
                  },
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    const allScores = progressList.flatMap((p) => (p.quizScores || []).map((q) => q.score));
    const stats = {
      totalCourses: progressList.length,
      completedCourses: progressList.filter((p) => p.completionPercentage === 100).length,

      inProgressCourses: progressList.filter(
        (p) => p.completionPercentage > 0 && p.completionPercentage < 100
      ).length,
      averageCompletion:
        progressList.length > 0
          ? Math.round(progressList.reduce((s, p) => s + p.completionPercentage, 0) / progressList.length)
          : 0,
      averageScore:
        allScores.length
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : 0,
    };

    res.json({ progress: progressList, stats });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/:courseId', protect, async (req, res) => {
  try {
    const [progress, course] = await Promise.all([
      Progress.findOne({ student: req.user._id, course: req.params.courseId }).lean(),
      Course.findById(req.params.courseId).select('lessons').lean(),
    ]);

    if (!progress) return res.status(404).json({ message: 'Progression non trouvée' });

    const totalLessons = course?.lessons?.length || 0;
    const completionPercentage = totalLessons > 0
      ? Math.round((progress.completedLessons.length / totalLessons) * 100)
      : 0;

    res.json({ progress: { ...progress, completionPercentage } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.put('/:courseId/lesson/:lessonId', protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    const [existingProgress, courseData] = await Promise.all([
      Progress.findOne({ student: req.user._id, course: courseId }),
      Course.findById(courseId).select('lessons').lean(),
    ]);

    let progress = existingProgress;
    if (!progress) {
      progress = await Progress.create({
        student: req.user._id,
        course: courseId,
        completedLessons: [lessonId],
      });
    } else {
      if (!progress.completedLessons.map(String).includes(lessonId)) {
        progress.completedLessons.push(lessonId);
      }
      progress.lastAccessed = new Date();
    }

    const totalLessons = courseData?.lessons?.length || 0;
    const completionPercentage = totalLessons > 0
      ? Math.round((progress.completedLessons.length / totalLessons) * 100)
      : 0;

    progress.completionRate = completionPercentage;
    await progress.save();

    res.json({ progress: { ...progress.toObject(), completionPercentage }, completionPercentage });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.delete('/:courseId/lesson/:lessonId', protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    const [progress, courseData] = await Promise.all([
      Progress.findOne({ student: req.user._id, course: courseId }),
      Course.findById(courseId).select('lessons').lean(),
    ]);

    if (!progress) return res.status(404).json({ message: 'Progression non trouvée' });

    progress.completedLessons = progress.completedLessons.filter(
      (id) => id.toString() !== lessonId
    );
    progress.lastAccessed = new Date();

    const totalLessons = courseData?.lessons?.length || 0;
    const completionPercentage = totalLessons > 0
      ? Math.round((progress.completedLessons.length / totalLessons) * 100)
      : 0;

    progress.completionRate = completionPercentage;
    await progress.save();

    res.json({ progress: { ...progress.toObject(), completionPercentage }, completionPercentage });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/:courseId/quiz', protect, async (req, res) => {
  try {
    const { lessonId, score, totalQuestions } = req.body;
    const { courseId } = req.params;

    const progress = await Progress.findOneAndUpdate(
      { student: req.user._id, course: courseId },
      {
        $push: {
          quizScores: {
            lessonId,
            score,
            totalQuestions,
            attemptedAt: new Date(),
          },
        },
        lastAccessed: new Date(),
      },
      { new: true, upsert: true }
    );

    res.json({ progress });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;
