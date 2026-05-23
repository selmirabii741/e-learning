/**
 * Check Keycloak user attributes for nouveauprof and fix if needed.
 */
async function check() {
  const KC_URL = 'http://localhost:8180';
  
  const tokenRes = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&client_id=admin-cli&username=admin&password=admin',
  });
  const { access_token } = await tokenRes.json();

  // Find user
  const usersRes = await fetch(
    `${KC_URL}/admin/realms/elearning/users?username=nouveauprof&exact=true`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const users = await usersRes.json();
  const user = users[0];
  
  console.log('=== KC User: nouveauprof ===');
  console.log('id:', user.id);
  console.log('email:', user.email);
  console.log('firstName:', user.firstName);
  console.log('lastName:', user.lastName);
  console.log('attributes:', JSON.stringify(user.attributes, null, 2));

  // Check if role attribute exists
  const roleAttr = user.attributes?.role;
  const specAttr = user.attributes?.speciality;
  console.log('\nrole attribute:', roleAttr);
  console.log('speciality attribute:', specAttr);

  // If role is missing, set it
  if (!roleAttr || roleAttr[0] !== 'instructor') {
    console.log('\n⚠️  Role attribute missing or wrong. Setting role=instructor...');
    user.attributes = user.attributes || {};
    user.attributes.role = ['instructor'];
    if (!specAttr) user.attributes.speciality = ['Math'];
    
    const updateRes = await fetch(
      `${KC_URL}/admin/realms/elearning/users/${user.id}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      }
    );
    console.log('Update status:', updateRes.status === 204 ? '✅ OK' : `❌ ${updateRes.status}`);
    
    // Verify token now
    const testRes = await fetch(`${KC_URL}/realms/elearning/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=password&client_id=elearning-frontend&username=nouveauprof&password=NouveauProf123!&scope=openid',
    });
    const { access_token: testToken } = await testRes.json();
    const payload = JSON.parse(Buffer.from(testToken.split('.')[1], 'base64url').toString());
    console.log('\n🔍 After fix:');
    console.log('   role:', payload.role);
    console.log('   speciality:', payload.speciality);
  }
}
check().catch(console.error);
