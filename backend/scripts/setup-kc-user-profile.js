/**
 * Configure Keycloak User Profile to accept "role" and "speciality" attributes.
 * Keycloak 26+ requires explicit User Profile configuration for custom attributes.
 */
async function configure() {
  const KC_URL = 'http://localhost:8180';

  // 1. Admin token
  console.log('🔑 Getting admin token...');
  const tokenRes = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&client_id=admin-cli&username=admin&password=admin',
  });
  if (!tokenRes.ok) { console.error('❌', await tokenRes.text()); return; }
  const { access_token } = await tokenRes.json();
  console.log('✅ Token obtained\n');

  // 2. Get current User Profile config
  console.log('📋 Fetching current User Profile...');
  const profileRes = await fetch(
    `${KC_URL}/admin/realms/elearning/users/profile`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const profile = await profileRes.json();
  console.log('   Current attributes:', profile.attributes?.map(a => a.name).join(', '));

  // 3. Add role and speciality if not present
  const attrNames = profile.attributes.map(a => a.name);

  if (!attrNames.includes('role')) {
    profile.attributes.push({
      name: 'role',
      displayName: 'Role',
      validations: {
        length: { min: 1, max: 50 }
      },
      annotations: {},
      permissions: {
        view: ['admin', 'user'],
        edit: ['admin', 'user']
      },
      multivalued: false,
      required: {
        roles: ['user']
      }
    });
    console.log('   ➕ Added "role" attribute');
  } else {
    console.log('   ✅ "role" already exists');
  }

  if (!attrNames.includes('speciality')) {
    profile.attributes.push({
      name: 'speciality',
      displayName: 'Speciality',
      validations: {
        length: { max: 255 }
      },
      annotations: {},
      permissions: {
        view: ['admin', 'user'],
        edit: ['admin', 'user']
      },
      multivalued: false
    });
    console.log('   ➕ Added "speciality" attribute');
  } else {
    console.log('   ✅ "speciality" already exists');
  }

  // 4. Save
  const updateRes = await fetch(
    `${KC_URL}/admin/realms/elearning/users/profile`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    }
  );

  if (updateRes.ok) {
    console.log('\n✅ User Profile updated successfully!');
  } else {
    console.error('❌ Update failed:', updateRes.status, await updateRes.text());
  }

  // 5. Verify: check nouveauprof attributes
  console.log('\n🔍 Checking nouveauprof attributes...');
  const usersRes = await fetch(
    `${KC_URL}/admin/realms/elearning/users?username=nouveauprof&exact=true`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const users = await usersRes.json();
  if (users[0]) {
    const fullUser = await (await fetch(
      `${KC_URL}/admin/realms/elearning/users/${users[0].id}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )).json();
    console.log('   attributes:', JSON.stringify(fullUser.attributes));
  }
}

configure().catch(console.error);
