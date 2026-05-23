import 'dotenv/config';
import mongoose from 'mongoose';

const KC_URL = process.env.KEYCLOAK_URL || 'http://localhost:8180';
const KC_REALM = process.env.KEYCLOAK_REALM || 'elearning';

async function getToken() {
    const res = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'password', client_id: 'admin-cli', username: 'admin', password: 'admin',
        }),
    });
    return (await res.json()).access_token;
}

async function resetPassword(token, kcId, newPassword) {
    const res = await fetch(`${KC_URL}/admin/realms/${KC_REALM}/users/${kcId}/reset-password`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'password', value: newPassword, temporary: false }),
    });
    return res.ok;
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const { default: User } = await import('../src/models/User.js');

    const instructors = await User.find({ role: 'instructor', keycloakId: { $ne: '' } })
        .select('name email keycloakId isActive')
        .lean();

    console.log(`\nFound ${instructors.length} instructor(s) in MongoDB:\n`);
    instructors.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.name} — ${u.email}`);
    });

    const token = await getToken();

    const NEW_PASSWORD = 'Instructor@2026';
    console.log(`\nResetting Keycloak password for all instructors to: ${NEW_PASSWORD}\n`);

    for (const u of instructors) {
        const ok = await resetPassword(token, u.keycloakId, NEW_PASSWORD);
        if (ok) {
            console.log(`  OK  ${u.email} => password set to "${NEW_PASSWORD}"`);
        } else {
            console.log(`  ERR ${u.email} => failed to reset password`);
        }
    }

    console.log('\nDone! Instructors can now login with:');
    console.log(`  Email    : their email address`);
    console.log(`  Password : ${NEW_PASSWORD}`);
    console.log('\nAsk them to change their password after first login.');

    await mongoose.disconnect();
}

main().catch(e => { console.error('ERR:', e.message); });
