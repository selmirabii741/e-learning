import express from 'express';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('enrolledCourses', 'title thumbnail category level')
            .lean();

        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

router.put('/me', protect, async (req, res) => {
    try {
        const { name, avatar, bio } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { ...(name && { name }), ...(avatar && { avatar }), ...(bio !== undefined && { bio }) },
            { new: true }
        ).select('-password');

        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


router.get('/me/stats', protect, async (req, res) => {
    try {
        // Single aggregation: join course lesson count without loading lesson content
        const progressList = await Progress.aggregate([
            { $match: { student: req.user._id } },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'courseData',
                    pipeline: [{ $project: { title: 1, lessonCount: { $size: '$lessons' } } }],
                },
            },
            { $unwind: { path: '$courseData', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    totalLessons: { $ifNull: ['$courseData.lessonCount', 0] },
                    completionPercentage: {
                        $cond: [
                            { $gt: [{ $ifNull: ['$courseData.lessonCount', 0] }, 0] },
                            {
                                $round: [
                                    { $multiply: [{ $divide: [{ $size: '$completedLessons' }, '$courseData.lessonCount'] }, 100] },
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
        const bestScore = allScores.length ? Math.max(...allScores) : 0;
        const avgScore = allScores.length
            ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
            : 0;

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
            totalLessonsCompleted: progressList.reduce((s, p) => s + p.completedLessons.length, 0),
            totalQuizAttempts: progressList.reduce((s, p) => s + (p.quizScores?.length || 0), 0),
            bestScore,
            avgScore,
        };

        res.json({ stats, recentActivity: progressList.slice(0, 5) });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


// ─── Change password (authenticated) ─────────────────────────────────────────
router.put('/me/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword) return res.status(400).json({ message: 'Mot de passe actuel requis' });
        if (!newPassword)     return res.status(400).json({ message: 'Nouveau mot de passe requis' });
        if (newPassword.length < 8)
            return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
        if (newPassword !== confirmPassword)
            return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(401).json({ message: 'Mot de passe actuel incorrect' });

        user.password = newPassword;
        await user.save(); // bcrypt hash hook fires automatically

        // Sync to Keycloak if user has a keycloakId
        if (user.keycloakId) {
            try {
                const KC_URL   = process.env.KEYCLOAK_URL   || 'http://localhost:8180';
                const KC_REALM = process.env.KEYCLOAK_REALM || 'elearning';
                const tokenRes = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        grant_type: 'password', client_id: 'admin-cli',
                        username: process.env.KEYCLOAK_ADMIN_USER || 'admin',
                        password: process.env.KEYCLOAK_ADMIN_PASS || 'admin',
                    }),
                    signal: AbortSignal.timeout(5000),
                });
                if (tokenRes.ok) {
                    const { access_token } = await tokenRes.json();
                    await fetch(`${KC_URL}/admin/realms/${KC_REALM}/users/${user.keycloakId}/reset-password`, {
                        method: 'PUT',
                        headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'password', value: newPassword, temporary: false }),
                        signal: AbortSignal.timeout(5000),
                    });
                }
            } catch (e) {
                console.warn('[change-password] KC sync error:', e.message);
            }
        }

        res.json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


// ─── Get preferences ─────────────────────────────────────────────────────────
router.get('/me/preferences', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('preferences').lean();
        res.json({
            preferences: user?.preferences || {
                language: 'fr',
                notifications: { email: true, courseUpdates: true, newLessons: true, reminders: false },
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── Update preferences ──────────────────────────────────────────────────────
router.put('/me/preferences', protect, async (req, res) => {
    try {
        const { language, notifications } = req.body;
        const update = {};
        if (language && ['fr', 'en'].includes(language)) {
            update['preferences.language'] = language;
        }
        if (notifications && typeof notifications === 'object') {
            for (const key of ['email', 'courseUpdates', 'newLessons', 'reminders']) {
                if (typeof notifications[key] === 'boolean') {
                    update[`preferences.notifications.${key}`] = notifications[key];
                }
            }
        }
        const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true })
            .select('preferences').lean();
        res.json({ preferences: user.preferences, message: 'Préférences mises à jour' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── Delete account ──────────────────────────────────────────────────────────
router.delete('/me', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const Message = (await import('../models/Message.js')).default;
        const ForumPost = (await import('../models/ForumPost.js')).default;
        const ForumReply = (await import('../models/ForumReply.js')).default;

        await Promise.all([
            Progress.deleteMany({ student: userId }),
            Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
            ForumReply.deleteMany({ author: userId }),
            ForumPost.deleteMany({ author: userId }),
            Course.updateMany({}, { $pull: { enrolledStudents: userId } }),
        ]);
        await User.findByIdAndDelete(userId);
        res.json({ message: 'Compte supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


export default router;
