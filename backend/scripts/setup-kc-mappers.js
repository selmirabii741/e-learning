/**
 * Configure Keycloak Protocol Mappers for the elearning-frontend client
 * to include user attributes "role" and "speciality" in the JWT access token.
 */
async function configure() {
  const KC_URL = 'http://localhost:8180';

  // 1. Get admin token
  console.log('🔑 Getting admin token...');
  const tokenRes = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&client_id=admin-cli&username=admin&password=admin',
  });
  if (!tokenRes.ok) { console.error('❌ Token failed:', await tokenRes.text()); return; }
  const { access_token } = await tokenRes.json();
  console.log('✅ Token obtained\n');

  // 2. Find client ID for elearning-frontend
  const clientsRes = await fetch(
    `${KC_URL}/admin/realms/elearning/clients?clientId=elearning-frontend`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const clients = await clientsRes.json();
  const clientUUID = clients[0]?.id;
  if (!clientUUID) { console.error('❌ Client not found'); return; }
  console.log(`📋 Client UUID: ${clientUUID}`);

  // 3. Check existing mappers
  const mappersRes = await fetch(
    `${KC_URL}/admin/realms/elearning/clients/${clientUUID}/protocol-mappers/models`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const existingMappers = await mappersRes.json();
  const existingNames = existingMappers.map(m => m.name);
  console.log(`   Existing mappers: ${existingNames.join(', ')}\n`);

  // 4. Create mappers
  const mappers = [
    {
      name: 'user-attr-role',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-attribute-mapper',
      config: {
        'user.attribute': 'role',
        'claim.name': 'role',
        'jsonType.label': 'String',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'userinfo.token.claim': 'true',
        'multivalued': 'false',
      },
    },
    {
      name: 'user-attr-speciality',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-attribute-mapper',
      config: {
        'user.attribute': 'speciality',
        'claim.name': 'speciality',
        'jsonType.label': 'String',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'userinfo.token.claim': 'true',
        'multivalued': 'false',
      },
    },
  ];

  for (const mapper of mappers) {
    if (existingNames.includes(mapper.name)) {
      console.log(`⏭️  Mapper "${mapper.name}" already exists, skipping`);
      continue;
    }
    const createRes = await fetch(
      `${KC_URL}/admin/realms/elearning/clients/${clientUUID}/protocol-mappers/models`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(mapper),
      }
    );
    if (createRes.status === 201) {
      console.log(`✅ Created mapper: "${mapper.name}"`);
    } else {
      console.error(`❌ Failed to create "${mapper.name}":`, createRes.status, await createRes.text());
    }
  }

  // 5. Verify by decoding a new token
  console.log('\n🔍 Verifying with nouveauprof token...');
  const testRes = await fetch(`${KC_URL}/realms/elearning/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&client_id=elearning-frontend&username=nouveauprof&password=NouveauProf123!&scope=openid',
  });
  if (testRes.ok) {
    const { access_token: testToken } = await testRes.json();
    const payload = JSON.parse(Buffer.from(testToken.split('.')[1], 'base64url').toString());
    console.log('   role:', payload.role);
    console.log('   speciality:', payload.speciality);
  }
}

configure().catch(console.error);
