/**
 * fixKcUser.js — Clears required actions on an existing Keycloak user so they
 *               can log in directly without the "Update Profile" form.
 *
 * Usage:  node scripts/fixKcUser.js [email]
 */
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const KC_URL   = process.env.KEYCLOAK_URL   || 'http://localhost:8180';
const KC_REALM = process.env.KEYCLOAK_REALM || 'elearning';
const email    = process.argv[2] || 'bensalahaymen2004@gmail.com';

// ── 1. Get keycloakId from MongoDB ────────────────────────────────────────────
console.log('📦 Connecting to MongoDB…');
await mongoose.connect(process.env.MONGODB_URI);
const { default: User } = await import('../src/models/User.js');
const user = await User.findOne({ email, role: 'instructor' });
if (!user) { console.error('❌ User not found:', email); process.exit(1); }

console.log('👤 Found:', user.name, '| kcId:', user.keycloakId || '(none)');
await mongoose.disconnect();

if (!user.keycloakId) {
  console.error('❌ No keycloakId — user was created without Keycloak. Nothing to fix.');
  process.exit(0);
}

// ── 2. Get KC admin token ─────────────────────────────────────────────────────
console.log('\n🔑 Getting Keycloak admin token…');
const tokenRes = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
  method:  'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'password',
    client_id:  'admin-cli',
    username:   process.env.KEYCLOAK_ADMIN_USER || 'admin',
    password:   process.env.KEYCLOAK_ADMIN_PASS || 'admin',
  }),
  signal: AbortSignal.timeout(5000),
}).catch(() => null);

if (!tokenRes?.ok) {
  console.error('❌ Cannot reach Keycloak at', KC_URL, '— make sure it is running.');
  process.exit(1);
}
const { access_token } = await tokenRes.json();
console.log('   ✅ Admin token obtained');

// ── 3. Fetch current KC user state ────────────────────────────────────────────
const getRes = await fetch(
  `${KC_URL}/admin/realms/${KC_REALM}/users/${user.keycloakId}`,
  { headers: { Authorization: `Bearer ${access_token}` }, signal: AbortSignal.timeout(5000) }
);
const kcUser = await getRes.json();
console.log('\n── Keycloak user state ───────────────────────');
console.log('  username       :', kcUser.username);
console.log('  firstName      :', kcUser.firstName);
console.log('  lastName       :', kcUser.lastName);
console.log('  enabled        :', kcUser.enabled);
console.log('  emailVerified  :', kcUser.emailVerified);
console.log('  requiredActions:', JSON.stringify(kcUser.requiredActions));
console.log('──────────────────────────────────────────────\n');

// ── 4. Clear required actions + ensure firstName/lastName set ─────────────────
const parts     = (user.name || '').trim().split(/\s+/);
const firstName = kcUser.firstName || parts[0] || 'Professeur';
const lastName  = kcUser.lastName  || parts.slice(1).join(' ') || parts[0] || '-';

const patchRes = await fetch(
  `${KC_URL}/admin/realms/${KC_REALM}/users/${user.keycloakId}`,
  {
    method:  'PUT',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...kcUser,
      firstName,
      lastName,
      enabled:         true,
      emailVerified:   true,
      requiredActions: [],      // ← this is the key fix
    }),
    signal: AbortSignal.timeout(5000),
  }
);

if (patchRes.ok || patchRes.status === 204) {
  console.log('✅ Required actions cleared! The user can now log in directly.');
  console.log(`   firstName: ${firstName} | lastName: ${lastName}`);
} else {
  const err = await patchRes.text();
  console.error('❌ Failed to update KC user:', patchRes.status, err);
}
