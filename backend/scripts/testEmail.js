/**
 * testEmail.js  — sends a REAL verification email with a REAL token stored in MongoDB.
 *
 * Usage:
 *   node scripts/testEmail.js [email]
 *
 * If [email] is omitted it defaults to bensalahaymen2004@gmail.com.
 * The script will:
 *   1. Connect to MongoDB
 *   2. Find the professor account with that email (role = instructor)
 *   3. Regenerate a valid 24-hour verification token and persist its hash
 *   4. Send the confirmation email
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';

// ── 1. Load env ────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

// ── 2. Dynamic imports (after dotenv so env vars are available) ────────────────
const { default: User } = await import('../src/models/User.js');
const { sendProfessorVerificationEmail } = await import('../src/services/emailService.js');

const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');

// ── 3. Target email (CLI arg or default) ──────────────────────────────────────
const targetEmail = process.argv[2] || 'bensalahaymen2004@gmail.com';

// ── 4. Connect to MongoDB ──────────────────────────────────────────────────────
console.log('\n📦 Connexion à MongoDB…');
await mongoose.connect(process.env.MONGODB_URI);
console.log('   ✅ Connecté\n');

// ── 5. Find the professor ──────────────────────────────────────────────────────
const professor = await User.findOne({ email: targetEmail, role: 'instructor' });

if (!professor) {
  console.error(`❌ Aucun professeur trouvé avec l'email : ${targetEmail}`);
  console.error('   Créez d\'abord le compte depuis l\'interface administrateur.');
  await mongoose.disconnect();
  process.exit(1);
}

console.log(`👤 Professeur trouvé : ${professor.name} <${professor.email}>`);
console.log(`   Statut actuel : emailVerified=${professor.emailVerified} | isActive=${professor.isActive}`);

if (professor.isActive && professor.emailVerified) {
  console.warn('\n⚠️  Ce compte est déjà actif. Le lien sera quand même renvoyé pour test.');
}

// ── 6. Generate a fresh real token ────────────────────────────────────────────
const plainToken  = crypto.randomBytes(32).toString('hex');
const hashedToken = sha256(plainToken);
const expires     = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

professor.emailVerified            = false;
professor.isActive                 = false;
professor.emailVerificationToken   = hashedToken;
professor.emailVerificationExpires = expires;
await professor.save();

console.log('\n🔑 Nouveau token généré et enregistré en base.');
console.log(`   Expire le : ${expires.toLocaleString()}`);

// ── 7. Send the email ──────────────────────────────────────────────────────────
console.log('\n📧 Envoi de l\'email de confirmation…');
console.log(`   SMTP_USER : ${process.env.SMTP_USER || '(manquant)'}`);
console.log(`   SMTP_PASS : ${process.env.SMTP_PASS ? 'défini ✓' : '(manquant)'}`);
console.log('');

try {
  const result = await sendProfessorVerificationEmail({
    name:  professor.name,
    email: professor.email,
    token: plainToken,          // ← plain token goes in the URL
  });

  if (result.devMode) {
    console.log('⚠️  Mode DEV — aucun SMTP configuré, email non envoyé.');
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${plainToken}`;
    console.log(`   Lien de vérification : ${verifyUrl}`);
  } else {
    console.log(`✅ Email envoyé avec succès à ${professor.email}`);
    console.log('   Le lien expire dans 24 heures.');
  }
} catch (err) {
  console.error('❌ Erreur lors de l\'envoi :', err.message);
  await mongoose.disconnect();
  process.exit(1);
}

await mongoose.disconnect();
console.log('\n📦 MongoDB déconnecté. Terminé.\n');
