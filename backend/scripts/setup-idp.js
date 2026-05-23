

async function setupIdP() {
  const KC_URL = 'http://localhost:8180';
  const REALM = 'elearning';

  // 1. Get admin token
  const tokenRes = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&client_id=admin-cli&username=admin&password=admin',
  });
  if (!tokenRes.ok) { console.error('Token fail'); return; }
  const { access_token } = await tokenRes.json();

  const idps = [
    {
      alias: 'google',
      providerId: 'google',
      enabled: true,
      config: {
        clientId: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
        useJwksUrl: 'true',
      }
    },
    {
      alias: 'github',
      providerId: 'github',
      enabled: true,
      config: {
        clientId: 'GITHUB_CLIENT_ID_PLACEHOLDER',
        clientSecret: 'GITHUB_CLIENT_SECRET_PLACEHOLDER',
      }
    }
  ];

  for (const idp of idps) {
    const res = await fetch(`${KC_URL}/admin/realms/${REALM}/identity-provider/instances`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(idp)
    });
    
    if (res.ok || res.status === 201) {
      console.log(`✅ Configured ${idp.alias}`);
    } else {
      const err = await res.text();
      if (res.status === 409) {
        console.log(`⚠️  ${idp.alias} already exists.`);
        // Try to update
        const updateRes = await fetch(`${KC_URL}/admin/realms/${REALM}/identity-provider/instances/${idp.alias}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(idp)
        });
        if (updateRes.ok) {
           console.log(`✅ Updated ${idp.alias}`);
        } else {
           console.log(`❌ Failed to update ${idp.alias}`, await updateRes.text());
        }
      } else {
        console.log(`❌ Failed to configure ${idp.alias}:`, res.status, err);
      }
    }
  }
}

setupIdP().catch(console.error);
