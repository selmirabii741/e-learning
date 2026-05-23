import 'dotenv/config';
import mongoose from 'mongoose';

const KC_URL   = process.env.KEYCLOAK_URL   || 'http://localhost:8180';
const KC_REALM = process.env.KEYCLOAK_REALM || 'elearning';
const KC_ADMIN = process.env.KEYCLOAK_ADMIN_USER || 'admin';
const KC_PASS  = process.env.KEYCLOAK_ADMIN_PASS || 'admin';

async function getToken() {
    const res = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'password', client_id: 'admin-cli',
            username: KC_ADMIN, password: KC_PASS,
        }),
    });
    if (!res.ok) throw new Error('KC admin token failed');
    return (await res.json()).access_token;
}

async function findKcUser(token, email) {
    const res = await fetch(
        `${KC_URL}/admin/realms/${KC_REALM}/users?email=${encodeURIComponent(email)}&exact=true`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const users = await res.json();
    return users[0] || null;
}

async function createKcUser(token, { email, name }) {
    const [firstName, ...rest] = (name || '').split(' ');
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';

    const res = await fetch(`${KC_URL}/admin/realms/${KC_REALM}/users`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: email, email,
            firstName: firstName || '', lastName: rest.join(' ') || '',
            enabled: true, emailVerified: true,
            credentials: [{ type: 'password', value: tempPassword, temporary: true }],
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.errorMessage || `KC create failed: ${res.status}`);
    }
    const location = res.headers.get('Location') || '';
    const kcId = location.split('/').pop();
    return { kcId, tempPassword };
}

async function assignRole(token, kcId, roleName) {
    const roleRes = await fetch(`${KC_URL}/admin/realms/${KC_REALM}/roles/${roleName}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!roleRes.ok) return;
    const role = await roleRes.json();
    await fetch(`${KC_URL}/admin/realms/${KC_REALM}/users/${kcId}/role-mappings/realm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([role]),
    });
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const { default: User } = await import('../src/models/User.js');

    const orphans = await User.find({
        role: 'instructor',
        $or: [{ keycloakId: '' }, { keycloakId: { $exists: false } }],
    });

    if (!orphans.length) {
        console.log('✅ No orphan instructors found — all accounts are synced!');
        await mongoose.disconnect();
        return;
    }

    console.log(`\nFound ${orphans.length} instructor(s) without Keycloak account:\n`);
    orphans.forEach(u => console.log(`  - ${u.name} <${u.email}>`));
    console.log('');

    const token = await getToken();
    const results = [];

    for (const user of orphans) {
        try {
            let kcId;
            let tempPassword = null;

            const existing = await findKcUser(token, user.email);
            if (existing) {
                kcId = existing.id;
                console.log(`  ⚠️  ${user.email} already in Keycloak (id: ${kcId}) — linking only`);
            } else {
                const created = await createKcUser(token, { email: user.email, name: user.name });
                kcId = created.kcId;
                tempPassword = created.tempPassword;
                await assignRole(token, kcId, 'instructor');
                console.log(`  ✅ Created in Keycloak: ${user.email}`);
                if (tempPassword) {
                    console.log(`     ⚠️  TEMP PASSWORD: ${tempPassword} (user must reset on first login)`);
                }
            }

            await User.findByIdAndUpdate(user._id, {
                keycloakId: kcId,
                provider:   'keycloak',
            });

            results.push({ email: user.email, kcId, tempPassword });
        } catch (err) {
            console.error(`  ❌ Failed for ${user.email}: ${err.message}`);
        }
    }

    console.log('\n════════════════════════════════════════');
    console.log('Sync complete. Summary:');
    console.log('════════════════════════════════════════');
    results.forEach(r => {
        console.log(`  ${r.email}`);
        if (r.tempPassword) {
            console.log(`    → Temp password: ${r.tempPassword}`);
            console.log(`    → User must reset password on first login`);
        } else {
            console.log(`    → Linked to existing Keycloak account`);
        }
    });
    console.log('');

    await mongoose.disconnect();
    console.log('Done.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
