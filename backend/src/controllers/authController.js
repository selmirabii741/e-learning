import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import User from '../models/User.js';
import ProfessorVerification from '../models/ProfessorVerification.js';
import { protect, protectAllowPending } from '../middleware/auth.js';
import { sendProfessorPendingEmail } from '../services/emailService.js';

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sha256 = (token) => crypto.createHash('sha256').update(token).digest('hex');

const KC_URL = () => process.env.KEYCLOAK_URL || 'http://localhost:8180';
const KC_REALM = () => process.env.KEYCLOAK_REALM || 'elearning';

/**
 * Get an admin access token from Keycloak master realm.
 * Returns null if Keycloak is unreachable (graceful degradation).
 */
async function getKcAdminToken() {
  try {
    const res = await fetch(
      `${KC_URL()}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: process.env.KEYCLOAK_ADMIN_USER || 'admin',
          password: process.env.KEYCLOAK_ADMIN_PASS || 'admin',
        }),
        signal: AbortSignal.timeout(5000), // 5 s timeout
      }
    );
    if (!res.ok) return null;
    return (await res.json()).access_token;
  } catch {
    return null; // Keycloak not running — handled gracefully
  }
}

/**
 * Update a Keycloak user's password via the admin REST API.
 * Silently skips if Keycloak is unavailable.
 */
async function updateKcPassword(kcUserId, newPassword) {
  if (!kcUserId) return;
  try {
    const adminToken = await getKcAdminToken();
    if (!adminToken) {
      console.warn('[set-password] Keycloak unreachable — skipping KC password sync');
      return;
    }
    const res = await fetch(
      `${KC_URL()}/admin/realms/${KC_REALM()}/users/${kcUserId}/reset-password`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'password', value: newPassword, temporary: false }),
        signal: AbortSignal.timeout(5000),
      }
    );
    if (res.ok || res.status === 204) {
      console.log(`[set-password] ✅ Password synced to Keycloak for user ${kcUserId}`);
    } else {
      const err = await res.text().catch(() => res.status);
      console.warn(`[set-password] ⚠️  KC password sync failed (${res.status}):`, err);
    }
  } catch (e) {
    console.warn('[set-password] ⚠️  KC password sync error:', e.message);
  }
}

/**
 * Update a Keycloak user's profile (firstName, lastName) and clear
 * all requiredActions so the verify-profile form never appears on login.
 * Silently skips if Keycloak is unavailable.
 */
async function updateKcProfile(kcUserId, name) {
  if (!kcUserId) return;
  try {
    const adminToken = await getKcAdminToken();
    if (!adminToken) {
      console.warn('[set-password] Keycloak unreachable — skipping KC profile update');
      return;
    }
    const parts = (name || '').trim().split(/\s+/);
    const firstName = parts[0] || 'Professeur';
    const lastName = parts.slice(1).join(' ') || parts[0] || 'Professeur';

    const res = await fetch(
      `${KC_URL()}/admin/realms/${KC_REALM()}/users/${kcUserId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          emailVerified: true,
          requiredActions: [],   // clear VERIFY_PROFILE + UPDATE_PROFILE + etc.
          enabled: true,
        }),
        signal: AbortSignal.timeout(5000),
      }
    );
    if (res.ok || res.status === 204) {
      console.log(`[set-password] ✅ KC profile updated for user ${kcUserId} → ${firstName} ${lastName}`);
    } else {
      const err = await res.text().catch(() => res.status);
      console.warn(`[set-password] ⚠️  KC profile update failed (${res.status}):`, err);
    }
  } catch (e) {
    console.warn('[set-password] ⚠️  KC profile update error:', e.message);
  }
}

// ─── Protected routes ──────────────────────────────────────────────────────────

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

router.post('/keycloak-sync', protectAllowPending, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status || 'approved',
        avatar: req.user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur de synchronisation', error: err.message });
  }
});

// ─── Certificate upload for professors ─────────────────────────────────────────
const certUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Format accepté : PDF, PNG, JPG, WEBP'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.post('/upload-certificate', protectAllowPending, certUpload.single('certificate'), async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(400).json({ message: 'Seuls les professeurs peuvent envoyer un certificat.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Fichier certificat requis.' });
    }

    const base64 = req.file.buffer.toString('base64');

    const verification = await ProfessorVerification.findOneAndUpdate(
      { userId: req.user._id },
      {
        certificateData: base64,
        certificateType: req.file.mimetype,
        certificateName: req.file.originalname,
        status: 'pending',
        adminComment: '',
        reviewedBy: null,
        reviewedAt: null,
      },
      { upsert: true, new: true }
    );

    // Ensure user status is pending
    if (req.user.status !== 'pending') {
      await User.findByIdAndUpdate(req.user._id, { status: 'pending' });
    }

    // Send confirmation email to professor
    try {
      await sendProfessorPendingEmail({ name: req.user.name, email: req.user.email });
    } catch (emailErr) {
      console.warn('[upload-certificate] Email notification failed:', emailErr.message);
    }

    res.json({
      message: 'Certificat envoyé avec succès. Votre compte est en attente de validation.',
      verification: {
        id: verification._id,
        status: verification.status,
        certificateName: verification.certificateName,
        createdAt: verification.createdAt,
      },
    });
  } catch (err) {
    console.error('[POST /upload-certificate]', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// GET verification status for current professor
router.get('/my-verification', protectAllowPending, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(400).json({ message: 'Route réservée aux professeurs.' });
    }
    const verification = await ProfessorVerification.findOne({ userId: req.user._id })
      .select('-certificateData');
    res.json({
      status: req.user.status || 'approved',
      verification: verification ? {
        id: verification._id,
        status: verification.status,
        certificateName: verification.certificateName,
        adminComment: verification.adminComment,
        createdAt: verification.createdAt,
        reviewedAt: verification.reviewedAt,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ─── Public: verify email ──────────────────────────────────────────────────────
// POST /api/auth/verify-email  { token }
// Hashes the token, finds the matching user, marks emailVerified and issues a
// short-lived (1 h) set-password token for the next step.
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token manquant' });

    const hashed = sha256(token);

    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: Date.now() },
      emailVerified: false,
    });

    if (!user) {
      return res.status(400).json({ message: 'Lien invalide ou expiré. Contactez l\'administrateur.' });
    }

    // Generate a fresh one-time set-password token (1 h TTL)
    const setPasswordPlain = crypto.randomBytes(32).toString('hex');
    const setPasswordHash = sha256(setPasswordPlain);

    user.emailVerified = true;
    user.emailVerificationToken = setPasswordHash;
    user.emailVerificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 h
    await user.save();

    res.json({
      message: 'Email vérifié. Définissez maintenant votre mot de passe.',
      setPasswordToken: setPasswordPlain,
    });
  } catch (err) {
    console.error('[POST /verify-email]', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ─── Public: set password ──────────────────────────────────────────────────────
// POST /api/auth/set-password  { token, password, confirmPassword }
// 1. Validates the set-password token in MongoDB
// 2. Saves bcrypt-hashed password to MongoDB
// 3. Syncs the plain password to Keycloak (so KC login works immediately)
// 4. Activates the account
router.post('/set-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) return res.status(400).json({ message: 'Token manquant' });
    if (!password) return res.status(400).json({ message: 'Mot de passe requis' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });

    const hashed = sha256(token);

    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: Date.now() },
      emailVerified: true,
      isActive: false,
    });

    if (!user) {
      return res.status(400).json({
        message: 'Lien invalide ou expiré. Recommencez depuis le mail de vérification.',
      });
    }

    // ── 1. Save to MongoDB (bcrypt hook fires on save) ──────────────────────
    user.password = password;
    user.isActive = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // ── 2. Resolve KC user ID (find by email if keycloakId was not stored) ──
    let kcId = user.keycloakId;
    if (!kcId) {
      try {
        const adminToken = await getKcAdminToken();
        if (adminToken) {
          const searchRes = await fetch(
            `${KC_URL()}/admin/realms/${KC_REALM()}/users?email=${encodeURIComponent(user.email)}&exact=true`,
            { headers: { Authorization: `Bearer ${adminToken}` }, signal: AbortSignal.timeout(5000) }
          );
          if (searchRes.ok) {
            const users = await searchRes.json();
            kcId = users?.[0]?.id || null;
            if (kcId) {
              // Persist the keycloakId so future operations work correctly
              await User.findByIdAndUpdate(user._id, { keycloakId: kcId, provider: 'keycloak' });
              console.log(`[set-password] 🔗 Linked existing KC user ${kcId} to MongoDB user ${user._id}`);
            }
          }
        }
      } catch (e) {
        console.warn('[set-password] Could not resolve KC user by email:', e.message);
      }
    }

    // ── 3. Sync password + profile to Keycloak so KC login works immediately ──
    //      - updateKcPassword : sets the new password
    //      - updateKcProfile  : ensures firstName/lastName are filled and clears
    //                           ALL requiredActions (incl. VERIFY_PROFILE) so the
    //                           "complete your profile" form is never shown again.
    if (kcId) {
      await updateKcPassword(kcId, password);
      await updateKcProfile(kcId, user.name);
    } else {
      console.warn('[set-password] No KC account found for', user.email, '— KC sync skipped');
    }

    res.json({ message: 'Mot de passe défini. Votre compte est maintenant actif !' });
  } catch (err) {
    console.error('[POST /set-password]', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});


export default router;
