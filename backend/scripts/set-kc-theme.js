/**
 * Configure Keycloak elearning realm to use the eduai login theme.
 */
async function configureTheme() {
  const KC_URL = 'http://localhost:8180';
  
  // 1. Get admin token
  console.log('🔑 Getting admin token...');
  const tokenRes = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&client_id=admin-cli&username=admin&password=admin',
  });
  
  if (!tokenRes.ok) {
    console.error('❌ Token failed:', tokenRes.status, await tokenRes.text());
    return;
  }
  
  const { access_token } = await tokenRes.json();
  console.log('✅ Token obtained');
  
  // 2. Get current realm config
  console.log('📋 Getting realm config...');
  const realmRes = await fetch(`${KC_URL}/admin/realms/elearning`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  
  if (!realmRes.ok) {
    console.error('❌ Realm fetch failed:', realmRes.status, await realmRes.text());
    return;
  }
  
  const realm = await realmRes.json();
  console.log(`   Current loginTheme: "${realm.loginTheme || 'default'}"`);
  
  // 3. Update theme
  realm.loginTheme = 'eduai';
  
  const updateRes = await fetch(`${KC_URL}/admin/realms/elearning`, {
    method: 'PUT',
    headers: { 
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(realm),
  });
  
  if (!updateRes.ok) {
    console.error('❌ Update failed:', updateRes.status, await updateRes.text());
    return;
  }
  
  console.log('✅ Login theme set to "eduai"');
  
  // 4. Verify
  const verifyRes = await fetch(`${KC_URL}/admin/realms/elearning`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const verified = await verifyRes.json();
  console.log(`✅ Verified loginTheme: "${verified.loginTheme}"`);
}

configureTheme().catch(console.error);
