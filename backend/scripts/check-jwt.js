/**
 * Decode the JWT of nouveauprof to check role + attributes
 */
async function check() {
  const KC_URL = 'http://localhost:8180';
  const res = await fetch(`${KC_URL}/realms/elearning/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&client_id=elearning-frontend&username=nouveauprof&password=NouveauProf123!&scope=openid',
  });
  if (!res.ok) { console.error('Token error:', await res.text()); return; }
  const { access_token } = await res.json();
  
  // Decode without verifying
  const [,payloadB64] = access_token.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  
  console.log('=== JWT Claims for nouveauprof ===');
  console.log('realm_access.roles:', payload.realm_access?.roles);
  console.log('payload.role:', payload.role);
  console.log('payload.attributes:', payload.attributes);
  console.log('payload.speciality:', payload.speciality);
  console.log('payload.given_name:', payload.given_name);
  console.log('payload.family_name:', payload.family_name);
  console.log('payload.email:', payload.email);
}
check().catch(console.error);
