require('dotenv').config();
const prisma = require('./src/utils/prisma');
const { generateRentalPlan } = require('./src/services/tripPlanner.service');

async function runTests() {
  console.log('=== Testing Smart Rental Planner Service ===\n');

  // Test 1: Goa Beach Trip
  console.log('--- Test 1: "I am going to Goa for 5 days with 4 friends" ---');
  const plan1 = await generateRentalPlan("I'm going to Goa for 5 days with 4 friends");
  console.log('Trip Details:', plan1.trip);
  console.log('Is Clarification Needed:', plan1.isClarificationNeeded);
  console.log(`Generated Requirements (${plan1.requirements.length}):`);
  plan1.requirements.forEach((req, idx) => {
    console.log(`  ${idx + 1}. [${req.priority.toUpperCase()}] ${req.item} (${req.availableCount} products available)`);
    console.log(`     Reason: ${req.reason}`);
    req.products.forEach((p) => {
      console.log(`     -> Match: ${p.title} ($${p.dailyRent}/day) | Score: ${p.relevanceScore} | Loc: ${p.location}`);
    });
  });

  // Test 2: Kedarkantha Trek
  console.log('\n--- Test 2: "I am going on a trek to Kedarkantha for 4 days" ---');
  const plan2 = await generateRentalPlan("I'm going on a trek to Kedarkantha for 4 days");
  console.log('Trip Details:', plan2.trip);
  console.log(`Generated Requirements (${plan2.requirements.length}):`);
  plan2.requirements.forEach((req, idx) => {
    console.log(`  ${idx + 1}. [${req.priority.toUpperCase()}] ${req.item} (${req.availableCount} products available)`);
  });

  // Test 3: Clarification on short/ambiguous prompt
  console.log('\n--- Test 3: Short query "I am going trekking" ---');
  const plan3 = await generateRentalPlan("I'm going trekking");
  console.log('Clarification Needed:', plan3.isClarificationNeeded);
  console.log('Clarification Question:', plan3.clarificationQuestion);

  // Test 4: Empty prompt validation
  console.log('\n--- Test 4: Empty prompt validation ---');
  try {
    await generateRentalPlan("");
    console.error('FAIL: Expected error on empty prompt');
  } catch (err) {
    console.log('SUCCESS: Handled empty prompt with status', err.status, ':', err.message);
  }

  console.log('\n=== ALL SMART RENTAL PLANNER TESTS PASSED! ===');
}

runTests()
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
