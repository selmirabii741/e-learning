/**
 * Test script: Upload a fake PDF certificate for a test professor.
 * Run: node backend/scripts/test-upload-cert.js
 */
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const KC_URL = process.env.KEYCLOAK_URL || 'http://localhost:8180';
const BACKEND_URL = 'http://localhost:5000';

async function test() {
  // 1. Get token for test professor
  console.log('🔑 Getting token for testprof2026...');
  const tokenRes = await fetch(`${KC_URL}/realms/elearning/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&client_id=elearning-frontend&username=testprof2026&password=TestProf123!&scope=openid',
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('❌ Token error:', err);
    return;
  }

  const { access_token } = await tokenRes.json();
  console.log('✅ Token obtained\n');

  // 2. Upload a fake PDF certificate
  console.log('📄 Uploading test certificate...');
  const fakePdf = Buffer.from('%PDF-1.4 Fake certificate content for testing EduAI professor verification');
  const blob = new Blob([fakePdf], { type: 'application/pdf' });

  const formData = new FormData();
  formData.append('certificate', blob, 'certificat-enseignement.pdf');

  const uploadRes = await fetch(`${BACKEND_URL}/api/auth/upload-certificate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}` },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  console.log(`Status: ${uploadRes.status}`);
  console.log(JSON.stringify(uploadData, null, 2));

  if (uploadRes.ok) {
    console.log('\n✅ Certificate uploaded successfully!');
  } else {
    console.log('\n❌ Upload failed');
  }

  // 3. Check verification status
  console.log('\n📋 Checking verification status...');
  const statusRes = await fetch(`${BACKEND_URL}/api/auth/my-verification`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const statusData = await statusRes.json();
  console.log(JSON.stringify(statusData, null, 2));
}

test().catch(console.error);
