import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import Course from '../models/Course.js';
import ProfessorVerification from '../models/ProfessorVerification.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { sendProfessorVerificationEmail, sendProfessorApprovedEmail, sendProfessorRejectedEmail, sendProfessorPendingEmail } from '../services/emailService.js';

const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');

const router = express.Router();

const KC_URL   = () => process.env.KEYCLOAK_URL   || 'http://localhost:8180';
const KC_REALM = () => process.env.KEYCLOAK_REALM || 'elearning';

/** Returns an admin token or null if Keycloak is unreachable. */
async function getKcAdminToken() {
    try {
        const res = await fetch(
            `${KC_URL()}/realms/master/protocol/openid-connect/token`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'password',
                    client_id:  'admin-cli',
                    username:   process.env.KEYCLOAK_ADMIN_USER || 'admin',
                    password:   process.env.KEYCLOAK_ADMIN_PASS || 'admin',
                }),
                signal: AbortSignal.timeout(5000),
            }
        );
        if (!res.ok) return null;
        return (await res.json()).access_token;
    } catch {
        return null;
    }
}

/** Creates a Keycloak user. Returns the KC user ID or null on failure.
 *  If the user already exists in Keycloak (same email), fetches and returns
 *  their existing ID so the MongoDB record can be linked to the KC account. */
async function createKcUser(token, { email, password, name }) {
    try {
        const parts     = (name || '').trim().split(/\s+/);
        const firstName = parts[0] || 'Professeur';
        // Always provide a lastName so Keycloak doesn't flag the profile as incomplete
        const lastName  = parts.slice(1).join(' ') || parts[0] || '-';

        const res = await fetch(
            `${KC_URL()}/admin/realms/${KC_REALM()}/users`,
            {
                method:  'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username:        email,
                    email,
                    firstName,
                    lastName,
                    enabled:         true,
                    emailVerified:   true,
                    // Clear all required actions so the user is never redirected
                    // to Keycloak's profile-update / verify-profile forms on first login
                    requiredActions: [],
                    credentials:     [{ type: 'password', value: password, temporary: false }],
                }),
                signal: AbortSignal.timeout(5000),
            }
        );

        if (res.status === 409) {
            // User already exists in Keycloak — fetch their ID and reuse it
            console.warn('[KC] User already exists, fetching existing KC user ID for:', email);
            const searchRes = await fetch(
                `${KC_URL()}/admin/realms/${KC_REALM()}/users?email=${encodeURIComponent(email)}&exact=true`,
                { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) }
            );
            if (!searchRes.ok) { console.warn('[KC] Could not search existing user'); return null; }
            const users = await searchRes.json();
            const existingId = users?.[0]?.id || null;
            if (existingId) {
                // Update password and profile so it matches what admin just set
                await fetch(
                    `${KC_URL()}/admin/realms/${KC_REALM()}/users/${existingId}/reset-password`,
                    {
                        method:  'PUT',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body:    JSON.stringify({ type: 'password', value: password, temporary: false }),
                        signal:  AbortSignal.timeout(5000),
                    }
                );
                await fetch(
                    `${KC_URL()}/admin/realms/${KC_REALM()}/users/${existingId}`,
                    {
                        method:  'PUT',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body:    JSON.stringify({ firstName, lastName, emailVerified: true, requiredActions: [], enabled: true }),
                        signal:  AbortSignal.timeout(5000),
                    }
                );
                console.log(`[KC] Reused existing KC user ${existingId} for ${email}`);
            }
            return existingId;
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.warn('[KC] createKcUser failed:', err.errorMessage || res.status);
            return null;
        }
        const location = res.headers.get('Location') || '';
        const kcUserId = location.split('/').pop() || null;

        // Explicitly clear required actions on the created user (belt-and-suspenders)
        if (kcUserId) await clearKcRequiredActions(token, kcUserId);

        return kcUserId;
    } catch (e) {
        console.warn('[KC] createKcUser error:', e.message);
        return null;
    }
}

/**
 * Clears all required actions on a Keycloak user so they are never redirected
 * to UPDATE_PROFILE / VERIFY_PROFILE / etc. forms after login.
 */
async function clearKcRequiredActions(token, kcUserId) {
    try {
        await fetch(
            `${KC_URL()}/admin/realms/${KC_REALM()}/users/${kcUserId}`,
            {
                method:  'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body:    JSON.stringify({ requiredActions: [] }),
                signal:  AbortSignal.timeout(5000),
            }
        );
        console.log(`[KC] Required actions cleared for ${kcUserId}`);
    } catch (e) {
        console.warn('[KC] clearKcRequiredActions error:', e.message);
    }
}

/** Assigns a realm role to a KC user. Silently skips on failure. */
async function assignKcRole(token, kcUserId, roleName) {
    try {
        const roleRes = await fetch(
            `${KC_URL()}/admin/realms/${KC_REALM()}/roles/${roleName}`,
            { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) }
        );
        if (!roleRes.ok) return;
        const role = await roleRes.json();
        await fetch(
            `${KC_URL()}/admin/realms/${KC_REALM()}/users/${kcUserId}/role-mappings/realm`,
            {
                method:  'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body:    JSON.stringify([role]),
                signal:  AbortSignal.timeout(5000),
            }
        );
    } catch (e) {
        console.warn('[KC] assignKcRole error:', e.message);
    }
}

/** Deletes a KC user. Silently skips on failure. */
async function deleteKcUser(token, kcUserId) {
    if (!kcUserId || !token) return;
    await fetch(`${KC_URL()}/admin/realms/${KC_REALM()}/users/${kcUserId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        signal:  AbortSignal.timeout(5000),
    }).catch(() => {});
}

router.use(protect, restrictTo('admin'));




router.get('/stats', async (req, res) => {
    try {
        const [counts, enrollmentAgg, pendingCount] = await Promise.all([
            User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
            ]),
            Course.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        published: { $sum: { $cond: ['$isPublished', 1, 0] } },
                        totalEnrollments: { $sum: { $size: '$enrolledStudents' } },
                    },
                },
            ]),
            ProfessorVerification.countDocuments({ status: 'pending' }),
        ]);

        const roleMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
        const courseStats = enrollmentAgg[0] || { total: 0, published: 0, totalEnrollments: 0 };

        res.json({
            totalUsers: (roleMap.student || 0) + (roleMap.instructor || 0) + (roleMap.admin || 0),
            totalInstructors: roleMap.instructor || 0,
            totalStudents: roleMap.student || 0,
            totalCourses: courseStats.total,
            publishedCourses: courseStats.published,
            totalEnrollments: courseStats.totalEnrollments,
            pendingVerifications: pendingCount,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});




router.get('/teachers', async (req, res) => {
    try {
        const { search, isActive } = req.query;
        const matchStage = { role: 'instructor' };

        if (search) {
            matchStage.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { speciality: { $regex: search, $options: 'i' } },
            ];
        }
        if (isActive !== undefined) matchStage.isActive = isActive === 'true';

        // Single aggregation: join courses, count students — O(1) queries
        const teachers = await User.aggregate([
            { $match: matchStage },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: 'courses',
                    localField: '_id',
                    foreignField: 'instructor',
                    as: 'courses',
                    pipeline: [
                        { $project: { enrolledStudents: 1 } },
                    ],
                },
            },
            {
                $addFields: {
                    courseCount: { $size: '$courses' },
                    totalStudents: { $sum: { $map: { input: '$courses', as: 'c', in: { $size: '$$c.enrolledStudents' } } } },
                },
            },
            { $project: { password: 0, courses: 0 } },
        ]);

        res.json({ teachers });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


router.post('/teachers', async (req, res) => {
    let kcUserId  = null;
    let kcToken   = null;
    let teacher   = null;
    try {
        // Accept either separate firstName/lastName (new form) or legacy single name field
        const { firstName, lastName, email, bio, speciality, avatar } = req.body;
        const name = req.body.name || `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim();

        if (!name || !email) {
            return res.status(400).json({ message: 'Nom, prénom et email sont requis' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
        }

        // Generate verification token — plain token in the email link,
        // only SHA-256 hash persisted (never the plain value).
        const plainToken          = crypto.randomBytes(32).toString('hex');
        const hashedToken         = sha256(plainToken);
        const tokenExpires        = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
        const placeholderPassword = crypto.randomBytes(24).toString('hex');

        // ── Keycloak (optional) ───────────────────────────────────────────────
        // If Keycloak is unavailable the professor is still created in MongoDB
        // and the invitation email is sent. KC sync can be done later.
        kcToken  = await getKcAdminToken();
        if (kcToken) {
            kcUserId = await createKcUser(kcToken, { email, password: placeholderPassword, name });
            if (kcUserId) {
                await assignKcRole(kcToken, kcUserId, 'instructor');
                console.log(`[KC] User created: ${kcUserId}`);
            }
        } else {
            console.warn('[KC] Keycloak unavailable — professor created without KC account.');
        }
        // ─────────────────────────────────────────────────────────────────────

        teacher = await User.create({
            name,
            email,
            password:                  placeholderPassword,
            role:                      'instructor',
            keycloakId:                kcUserId || '',
            provider:                  kcUserId ? 'keycloak' : 'local',
            bio:                       bio        || '',
            speciality:                speciality || '',
            avatar:                    avatar     || '',
            isActive:                  false,
            emailVerified:             false,
            emailVerificationToken:    hashedToken,
            emailVerificationExpires:  tokenExpires,
        });

        await sendProfessorVerificationEmail({ name, email, token: plainToken });

        const { password: _pw, emailVerificationToken: _t, ...teacherData } = teacher.toObject();
        res.status(201).json({
            teacher: teacherData,
            message: `Un email de confirmation a été envoyé à ${email}${
                kcUserId ? '' : ' (compte Keycloak non créé — KC indisponible)'
            }`,
        });
    } catch (error) {
        // Roll back KC user only if it was created but MongoDB failed
        if (kcUserId && kcToken && !teacher) {
            await deleteKcUser(kcToken, kcUserId);
        }
        console.error('[POST /admin/teachers]', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


router.get('/teachers/:id', async (req, res) => {
    try {
        const teacher = await User.findOne({ _id: req.params.id, role: 'instructor' }).select(
            '-password'
        );
        if (!teacher) return res.status(404).json({ message: 'Professeur non trouvé' });
        res.json({ teacher });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


// ─── Sync Keycloak profile ─────────────────────────────────────────────────────
// POST /api/admin/teachers/:id/sync-kc
// Updates Keycloak profile (firstName, lastName, clears requiredActions) so the
// "complete your profile" form is never shown to the professor on login.
router.post('/teachers/:id/sync-kc', async (req, res) => {
    try {
        const teacher = await User.findOne({ _id: req.params.id, role: 'instructor' });
        if (!teacher) return res.status(404).json({ message: 'Professeur non trouvé' });
        if (!teacher.keycloakId) return res.status(400).json({ message: 'Aucun compte Keycloak associé à ce professeur.' });

        const kcToken = await getKcAdminToken();
        if (!kcToken) return res.status(503).json({ message: 'Keycloak indisponible.' });

        const parts     = (teacher.name || '').trim().split(/\s+/);
        const firstName = parts[0] || 'Professeur';
        const lastName  = parts.slice(1).join(' ') || parts[0] || 'Professeur';

        const kcRes = await fetch(
            `${KC_URL()}/admin/realms/${KC_REALM()}/users/${teacher.keycloakId}`,
            {
                method:  'PUT',
                headers: { Authorization: `Bearer ${kcToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    emailVerified:   true,
                    requiredActions: [],
                    enabled:         true,
                }),
                signal: AbortSignal.timeout(5000),
            }
        );

        if (!kcRes.ok && kcRes.status !== 204) {
            const err = await kcRes.text().catch(() => kcRes.status);
            return res.status(500).json({ message: `Erreur Keycloak (${kcRes.status}): ${err}` });
        }

        res.json({ message: `Profil Keycloak synchronisé pour ${teacher.name}` });
    } catch (error) {
        console.error('[POST /teachers/:id/sync-kc]', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


// ─── Resend verification email ─────────────────────────────────────────────────
// POST /api/admin/teachers/:id/resend-verification
router.post('/teachers/:id/resend-verification', async (req, res) => {
    try {
        const teacher = await User.findOne({ _id: req.params.id, role: 'instructor' });
        if (!teacher) return res.status(404).json({ message: 'Professeur non trouvé' });

        if (teacher.isActive && teacher.emailVerified) {
            return res.status(400).json({ message: 'Ce compte est déjà activé.' });
        }

        // Generate fresh real token (overwrite any stale one)
        const plainToken  = crypto.randomBytes(32).toString('hex');
        const hashedToken = sha256(plainToken);
        const expires     = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

        teacher.emailVerified            = false;
        teacher.isActive                 = false;
        teacher.emailVerificationToken   = hashedToken;
        teacher.emailVerificationExpires = expires;
        await teacher.save();

        await sendProfessorVerificationEmail({
            name:  teacher.name,
            email: teacher.email,
            token: plainToken,
        });

        res.json({ message: `Email de confirmation renvoyé à ${teacher.email}` });
    } catch (error) {
        console.error('[POST /teachers/:id/resend-verification]', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


router.put('/teachers/:id', async (req, res) => {
    try {
        const { name, email, bio, speciality, avatar, isActive } = req.body;

        const teacher = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'instructor' },
            { name, email, bio, speciality, avatar, isActive },
            { new: true, runValidators: true }
        ).select('-password');

        if (!teacher) return res.status(404).json({ message: 'Professeur non trouvé' });
        res.json({ teacher });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


router.delete('/teachers/:id', async (req, res) => {
    try {
        const teacher = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'instructor' },
            { isActive: false },
            { new: true }
        ).select('-password');

        if (!teacher) return res.status(404).json({ message: 'Professeur non trouvé' });
        res.json({ message: 'Instructeur désactivé avec succès', teacher });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


router.get('/teachers/:id/courses', async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.params.id })
            .select('title category level isPublished enrolledStudents createdAt thumbnail')
            .sort({ createdAt: -1 });

        const coursesWithStats = courses.map((c) => ({
            ...c.toObject(),
            enrolledCount: c.enrolledStudents.length,
        }));

        res.json({ courses: coursesWithStats });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


router.get('/students', async (req, res) => {
    try {
        const { search } = req.query;
        const filter = { role: 'student' };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const students = await User.find(filter).select('-password').sort({ createdAt: -1 });
        res.json({ students });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


router.delete('/students/:id', async (req, res) => {
    try {
        const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
        if (!student) return res.status(404).json({ message: 'Étudiant non trouvé' });
        res.json({ message: `Étudiant "${student.name}" supprimé avec succès` });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('instructor', 'name email')
            .select('-lessons.content -lessons.pdfData -vectorIds')
            .sort({ createdAt: -1 });

        const coursesWithStats = courses.map((c) => ({
            ...c.toObject(),
            enrolledCount: c.enrolledStudents.length,
        }));

        res.json({ courses: coursesWithStats });
    } catch (error) {
        console.error('[Admin GET /courses]', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});


router.put('/courses/:id/toggle-publish', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

        course.isPublished = !course.isPublished;
        await course.save();

        res.json({ message: `Cours ${course.isPublished ? 'publié' : 'dépublié'}`, course });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});
// ─── Professor Verification Management ──────────────────────────────────────────────

// GET all verifications (with optional status filter)
router.get('/verifications', async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            filter.status = status;
        }

        const verifications = await ProfessorVerification.find(filter)
            .populate('userId', 'name email avatar role status createdAt speciality')
            .populate('reviewedBy', 'name')
            .select('-certificateData')
            .sort({ createdAt: -1 });

        res.json({ verifications });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// GET single verification with certificate data
router.get('/verifications/:id', async (req, res) => {
    try {
        const verification = await ProfessorVerification.findById(req.params.id)
            .populate('userId', 'name email avatar role status createdAt speciality bio')
            .populate('reviewedBy', 'name');

        if (!verification) return res.status(404).json({ message: 'Vérification non trouvée' });
        res.json({ verification });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// POST approve professor
router.post('/verifications/:id/approve', async (req, res) => {
    try {
        const verification = await ProfessorVerification.findById(req.params.id)
            .populate('userId', 'name email');

        if (!verification) return res.status(404).json({ message: 'Vérification non trouvée' });
        if (verification.status === 'approved') {
            return res.status(400).json({ message: 'Ce professeur est déjà approuvé.' });
        }

        verification.status = 'approved';
        verification.adminComment = req.body.comment || '';
        verification.reviewedBy = req.user._id;
        verification.reviewedAt = new Date();
        await verification.save();

        // Update user status
        await User.findByIdAndUpdate(verification.userId._id, { status: 'approved' });

        // Send email notification
        try {
            await sendProfessorApprovedEmail({
                name: verification.userId.name,
                email: verification.userId.email,
            });
        } catch (emailErr) {
            console.warn('[Verification] Email notification failed:', emailErr.message);
        }

        res.json({ message: `Professeur ${verification.userId.name} approuvé avec succès.` });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// POST reject professor
router.post('/verifications/:id/reject', async (req, res) => {
    try {
        const verification = await ProfessorVerification.findById(req.params.id)
            .populate('userId', 'name email');

        if (!verification) return res.status(404).json({ message: 'Vérification non trouvée' });

        verification.status = 'rejected';
        verification.adminComment = req.body.comment || '';
        verification.reviewedBy = req.user._id;
        verification.reviewedAt = new Date();
        await verification.save();

        // Update user status
        await User.findByIdAndUpdate(verification.userId._id, { status: 'rejected' });

        // Send email notification
        try {
            await sendProfessorRejectedEmail({
                name: verification.userId.name,
                email: verification.userId.email,
                comment: req.body.comment || '',
            });
        } catch (emailErr) {
            console.warn('[Verification] Email notification failed:', emailErr.message);
        }

        res.json({ message: `Professeur ${verification.userId.name} rejeté.` });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

export default router;
