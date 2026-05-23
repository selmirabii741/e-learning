import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const { default: User } = await import('../src/models/User.js');
const { sendProfessorVerificationEmail } = await import('../src/services/emailService.js');

await mongoose.connect(process.env.MONGODB_URI);

const email = process.argv[2] || 'bensalahaymen2004@gmail.com';
const prof = await User.findOne({ email, role: 'instructor' });

if (!prof) {
  console.log('❌ Professor not found:', email);
  await mongoose.disconnect();
  process.exit(1);
}

console.log('\n── Professor state ─────────────────────────────');
console.log('  name        :', prof.name);
console.log('  email       :', prof.email);
console.log('  isActive    :', prof.isActive);
console.log('  emailVerified:', prof.emailVerified);
console.log('  token set   :', !!prof.emailVerificationToken);
console.log('  expires     :', prof.emailVerificationExpires);
console.log('  expires ok  :', prof.emailVerificationExpires > new Date());
console.log('  keycloakId  :', prof.keycloakId || '(none)');
console.log('────────────────────────────────────────────────\n');

// Always reset and resend a clean token
const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');
const plainToken  = crypto.randomBytes(32).toString('hex');
prof.emailVerified            = false;
prof.isActive                 = false;
prof.emailVerificationToken   = sha256(plainToken);
prof.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
await prof.save();

console.log('🔑 Fresh token stored. Sending email…');
const result = await sendProfessorVerificationEmail({ name: prof.name, email: prof.email, token: plainToken });

if (result.devMode) {
  const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${plainToken}`;
  console.log('⚠️  Dev mode — use this link:', url);
} else {
  console.log('✅ Email sent to', prof.email);
}

await mongoose.disconnect();
