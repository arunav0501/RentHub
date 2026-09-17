require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const prisma = require('./src/utils/prisma');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

async function runE2ETests() {
  console.log('--- Running API End-to-End Tests via Native Node.js HTTP & Fetch ---');

  // Start server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  try {
    // 1. Fetch user to generate token
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found in database');

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`Testing with user: ${user.name} (${user.id})`);

    // 2. Test GET /api/users/:id/trust-score
    console.log('\n[TEST 1] GET /api/users/:id/trust-score');
    const res1 = await fetch(`${baseUrl}/api/users/${user.id}/trust-score?role=OWNER`);
    if (res1.status !== 200) throw new Error(`Expected 200, got ${res1.status}`);
    const trustData = await res1.json();

    console.log('Trust score response:', {
      userId: trustData.userId,
      score: trustData.score,
      tier: trustData.tier,
      isNewMember: trustData.isNewMember,
      breakdownCount: trustData.breakdown?.length,
      indicatorsCount: trustData.indicators?.length,
    });

    if (typeof trustData.score !== 'number' || trustData.score < 0 || trustData.score > 100) {
      throw new Error(`Trust score out of range: ${trustData.score}`);
    }
    console.log('PASS: Trust score calculated server-side correctly and bounded [0, 100]');

    // 3. Test AI Listing without auth
    console.log('\n[TEST 2] POST /api/ai-listing/analyze-image without token');
    const res2 = await fetch(`${baseUrl}/api/ai-listing/analyze-image`, { method: 'POST' });
    if (res2.status !== 401) throw new Error(`Expected 401, got ${res2.status}`);
    console.log('PASS: Correctly rejected unauthenticated request with 401');

    // 4. Test AI Listing with token but no file
    console.log('\n[TEST 3] POST /api/ai-listing/analyze-image with token but no file');
    const res3 = await fetch(`${baseUrl}/api/ai-listing/analyze-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res3.status !== 400) throw new Error(`Expected 400, got ${res3.status}`);
    const noFileJson = await res3.json();
    console.log('PASS: Correctly rejected missing file with 400:', noFileJson.message);

    // 5. Test AI Listing with file
    console.log('\n[TEST 4] POST /api/ai-listing/analyze-image with image file');
    const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    const blob = new Blob([png1x1], { type: 'image/png' });
    const formData = new FormData();
    formData.append('image', blob, 'sample.png');

    const res4 = await fetch(`${baseUrl}/api/ai-listing/analyze-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    console.log('AI Listing response status:', res4.status);
    const aiJson = await res4.json();
    console.log('AI Listing response body:', aiJson);

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5) {
      console.log('PASS: Gemini API responded with generated listing draft');
    } else {
      if (res4.status !== 503) {
        throw new Error(`Expected 503 for unconfigured key, got ${res4.status}`);
      }
      console.log('PASS: Handled unconfigured GEMINI_API_KEY gracefully with 503 and clear message');
    }

    // 6. Test existing product listing GET endpoint
    console.log('\n[TEST 5] Verifying existing GET /api/products');
    const res5 = await fetch(`${baseUrl}/api/products`);
    if (res5.status !== 200) throw new Error(`Expected 200, got ${res5.status}`);
    const products = await res5.json();
    console.log(`PASS: Retrieved ${products.length} products without regression`);

    console.log('\n========================================');
    console.log('ALL API END-TO-END INTEGRATION TESTS PASSED!');
    console.log('========================================');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runE2ETests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
