/**
 * fix-kc-profile.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time fix for existing Keycloak professors whose lastName is empty,
 * causing the "Verify Profile" form to appear on login.
 *
 * What it does:
 *  1. Connects to Keycloak as admin
 *  2. Lists ALL users in the realm
 *  3. For anyone missing a lastName → fills it from firstName
 *  4. Clears all requiredActions (VERIFY_PROFILE, UPDATE_PROFILE, etc.)
 *  5. Disables the "verify-profile" authenticator in the browser flow globally
 *
 * Run: node fix-kc-profile.mjs
 */

import 'dotenv/config';

const KC_URL   = process.env.KEYCLOAK_URL   || 'http://localhost:8180';
const KC_REALM = process.env.KEYCLOAK_REALM || 'elearning';
const KC_ADMIN = process.env.KEYCLOAK_ADMIN_USER || 'admin';
const KC_PASS  = process.env.KEYCLOAK_ADMIN_PASS || 'admin';

// ── 1. Get admin token ────────────────────────────────────────────────────────
async function getAdminToken() {
  const res = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id:  'admin-cli',
      username:   KC_ADMIN,
      password:   KC_PASS,
    }),
  });
  if (!res.ok) throw new Error(`Admin token failed: ${res.status}`);
  return (await res.json()).access_token;
}

// ── 2. Fix all users without lastName ────────────────────────────────────────
async function fixUsers(token) {
  let fixed = 0, skipped = 0;
  let first = 0;
  const MAX = 100;

  while (true) {
    const res = await fetch(
      `${KC_URL}/admin/realms/${KC_REALM}/users?first=${first}&max=${MAX}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`List users failed: ${res.status}`);
    const users = await res.json();
    if (!users.length) break;

    for (const u of users) {
      const needsFix = !u.lastName || u.lastName.trim() === '' ||
                       !u.firstName || u.firstName.trim() === '' ||
                       (u.requiredActions && u.requiredActions.length > 0);

      if (!needsFix) { skipped++; continue; }

      const firstName = (u.firstName || u.username || 'Utilisateur').trim();
      const lastName  = (u.lastName  && u.lastName.trim())
                          ? u.lastName.trim()
                          : firstName;   // fallback: use firstName as lastName

      const patch = await fetch(
        `${KC_URL}/admin/realms/${KC_REALM}/users/${u.id}`,
        {
          method:  'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            lastName,
            emailVerified:   true,
            requiredActions: [],
            enabled:         true,
          }),
        }
      );

      if (patch.ok || patch.status === 204) {
        console.log(`  ✅ Fixed: ${u.email || u.username}  →  "${firstName} ${lastName}"  (actions cleared)`);
        fixed++;
      } else {
        console.warn(`  ⚠️  Failed to fix ${u.email || u.username}: ${patch.status}`);
      }
    }

    first += MAX;
    if (users.length < MAX) break;
  }

  console.log(`\n  Users fixed: ${fixed} | Skipped (already OK): ${skipped}`);
}

// ── 3. Disable verify-profile in browser flow ─────────────────────────────────
async function disableVerifyProfile(token) {
  // Get all authentication flows
  const flowsRes = await fetch(
    `${KC_URL}/admin/realms/${KC_REALM}/authentication/flows`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!flowsRes.ok) { console.warn('  ⚠️  Could not list flows'); return; }
  const flows = await flowsRes.json();

  const browserFlow = flows.find(f =>
    f.alias === 'browser' || f.alias === 'Browser' ||
    f.builtIn === true && f.alias.toLowerCase().includes('browser')
  );

  if (!browserFlow) { console.warn('  ⚠️  Browser flow not found'); return; }
  console.log(`  📋 Browser flow found: "${browserFlow.alias}" (id: ${browserFlow.id})`);

  // Get executions of the browser flow
  const execRes = await fetch(
    `${KC_URL}/admin/realms/${KC_REALM}/authentication/flows/${browserFlow.alias}/executions`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!execRes.ok) { console.warn('  ⚠️  Could not list executions'); return; }
  const executions = await execRes.json();

  // Find verify-profile execution
  const vpExec = executions.find(e =>
    e.providerId === 'idp-review-profile' ||
    e.displayName?.toLowerCase().includes('verify profile') ||
    e.providerId?.toLowerCase().includes('verify') ||
    e.providerId?.toLowerCase().includes('profile')
  );

  if (!vpExec) {
    console.log('  ℹ️  verify-profile execution not found in browser flow (may already be disabled or not present).');
    return;
  }

  console.log(`  🔍 Found execution: "${vpExec.displayName}" (${vpExec.providerId}) — current: ${vpExec.requirement}`);

  if (vpExec.requirement === 'DISABLED') {
    console.log('  ✅ Already DISABLED — nothing to do.');
    return;
  }

  // Disable it
  const disableRes = await fetch(
    `${KC_URL}/admin/realms/${KC_REALM}/authentication/flows/${browserFlow.alias}/executions`,
    {
      method:  'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...vpExec, requirement: 'DISABLED' }),
    }
  );

  if (disableRes.ok || disableRes.status === 202) {
    console.log('  ✅ verify-profile execution DISABLED in browser flow.');
  } else {
    const err = await disableRes.text();
    console.warn(`  ⚠️  Could not disable verify-profile: ${disableRes.status} — ${err}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('━━━ KC Profile Fix Script ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Realm : ${KC_REALM}  |  KC : ${KC_URL}\n`);

  try {
    const token = await getAdminToken();
    console.log('  ✅ Admin token obtained\n');

    console.log('─── Step 1: Fix user profiles ───────────────────────────────────');
    await fixUsers(token);

    console.log('\n─── Step 2: Disable verify-profile in browser flow ──────────────');
    await disableVerifyProfile(token);

    console.log('\n━━━ Done! Restart Keycloak session or clear browser cache. ━━━━━━');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
})();
