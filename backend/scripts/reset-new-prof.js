/**
 * 1. Delete the "nouveauprof" user from Keycloak and MongoDB
 * 2. Verify that the User Profile accepts role/speciality
 * So we can re-test registration cleanly.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

const KC_URL = process.env.KEYCLOAK_URL || 'http://localhost:8180';

async function run() {
  // 1. Get admin token
  console.log('🔑 Getting KC admin token...');
  const tokenRes = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&client_id=admin-cli&username=admin&password=admin',
  });
  if (!tokenRes.ok) { console.error('❌ Token fail'); return; }
  const { access_token } = await tokenRes.json();

  // 2. Delete user from KC
  console.log('🗑️  Deleting nouveauprof from Keycloak...');
  const usersRes = await fetch(
    `${KC_URL}/admin/realms/elearning/users?username=nouveauprof&exact=true`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const users = await usersRes.json();
  if (users[0]) {
    const delRes = await fetch(
      `${KC_URL}/admin/realms/elearning/users/${users[0].id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${access_token}` } }
    );
    console.log(`   KC delete: ${delRes.status === 204 ? '✅' : '❌ ' + delRes.status}`);
  } else {
    console.log('   Not found in KC (already deleted)');
  }

  // 3. Delete from MongoDB
  console.log('🗑️  Deleting from MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({
    email: String, name: String, role: String, status: String, keycloakId: String,
  }));
  const ProfVerification = mongoose.model('ProfessorVerification', new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
  }));

  const mongoUser = await User.findOne({ email: 'nouveau.prof@test.com' });
  if (mongoUser) {
    await ProfVerification.deleteMany({ userId: mongoUser._id });
    await User.deleteOne({ _id: mongoUser._id });
    console.log('   ✅ Deleted from MongoDB');
  } else {
    console.log('   Not found in MongoDB');
  }

  // 4. Verify User Profile has role+speciality
  console.log('\n📋 Verifying User Profile config...');
  const profileRes = await fetch(
    `${KC_URL}/admin/realms/elearning/users/profile`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const profile = await profileRes.json();
  const attrs = profile.attributes.map(a => a.name);
  console.log('   Attributes:', attrs.join(', '));
  console.log('   role configured:', attrs.includes('role') ? '✅' : '❌');
  console.log('   speciality configured:', attrs.includes('speciality') ? '✅' : '❌');

  console.log('\n✅ Ready for re-test! Register "nouveauprof" again via the form.');
  await mongoose.disconnect();
}

run().catch(console.error);
