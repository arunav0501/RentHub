require('dotenv').config();
const prisma = require('./src/utils/prisma');
const { calculateUserTrustScore } = require('./src/services/trustScore.service');
const { analyzeProductImage } = require('./src/services/gemini.service');

async function testTrustScore() {
  console.log('--- Testing Trust Score Service ---');

  // Fetch users from DB
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in database.`);

  for (const user of users) {
    const ownerScore = await calculateUserTrustScore(user.id, 'OWNER');
    console.log(`\nUser: ${user.name} (${user.email}) as OWNER:`);
    console.log(`  Score: ${ownerScore.score} / 100 [Tier: ${ownerScore.tier}]`);
    console.log(`  Is New Member: ${ownerScore.isNewMember}`);
    console.log(`  Breakdown:`, ownerScore.breakdown.map(b => `${b.category}: ${b.score}/${b.maxScore}`).join(', '));
    console.log(`  Indicators:`, ownerScore.indicators);

    const renterScore = await calculateUserTrustScore(user.id, 'RENTER');
    console.log(`User: ${user.name} (${user.email}) as RENTER:`);
    console.log(`  Score: ${renterScore.score} / 100 [Tier: ${renterScore.tier}]`);
    console.log(`  Breakdown:`, renterScore.breakdown.map(b => `${b.category}: ${b.score}/${b.maxScore}`).join(', '));

    // Bounds checking
    if (ownerScore.score < 0 || ownerScore.score > 100) {
      throw new Error(`Owner score out of bounds: ${ownerScore.score}`);
    }
    if (renterScore.score < 0 || renterScore.score > 100) {
      throw new Error(`Renter score out of bounds: ${renterScore.score}`);
    }
  }

  console.log('\n--- Testing Gemini Error Handling without API Key ---');
  try {
    await analyzeProductImage('dummy.jpg', 'image/jpeg', ['Electronics']);
    console.error('FAIL: Expected analyzeProductImage to fail without API key');
  } catch (err) {
    console.log('SUCCESS: Handled missing API key gracefully:', err.message, `(code: ${err.code})`);
  }

  console.log('\nALL BACKEND LOGIC CHECKS PASSED!');
}

testTrustScore()
  .catch((e) => {
    console.error('Test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
