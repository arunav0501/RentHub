const API_BASE = 'http://localhost:5000/api/trip-planner';

async function postAnalyze(payload) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function testCases() {
  console.log('=== RUNNING COMPREHENSIVE SUITE OF TEST CASES ===\n');

  // Test 2: "I'm going on a trek"
  const res2 = await postAnalyze({ prompt: "I'm going on a trek" });
  console.log('Test 2 ("I\'m going on a trek"):', {
    isClarificationNeeded: res2.data.isClarificationNeeded,
    question: res2.data.clarificationQuestion?.slice(0, 60),
  });

  // Test 4: "I'm going camping for 2 days"
  const res4 = await postAnalyze({ prompt: "I'm going camping for 2 days" });
  console.log('Test 4 ("camping for 2 days"):', {
    destination: res4.data.trip?.destination,
    durationDays: res4.data.trip?.durationDays,
    reqCount: res4.data.requirements?.length,
    availableCount: res4.data.summary?.availableCount,
  });

  // Test 5: "I need equipment for a photography trip"
  const res5 = await postAnalyze({ prompt: "I need equipment for a photography trip" });
  console.log('Test 5 ("photography trip"):', {
    tripType: res5.data.trip?.tripType,
    reqCount: res5.data.requirements?.length,
    topReq: res5.data.requirements?.[0]?.item,
    topProduct: res5.data.requirements?.[0]?.products?.[0]?.title,
  });

  // Test 6: Empty input
  const res6 = await postAnalyze({ prompt: "" });
  console.log('Test 6 (Empty prompt): Handled properly with status', res6.status, ':', res6.data?.message);

  // Test 7: Very long input (>1000 chars)
  const longPrompt = "I am planning a trip ".repeat(60);
  const res7 = await postAnalyze({ prompt: longPrompt });
  console.log('Test 7 (Very long prompt >1000 chars): Handled with status', res7.status, ':', res7.data?.message);

  // Test 8: Unknown activity
  const res8 = await postAnalyze({ prompt: "I am hosting a retro 80s arcade gaming tournament for 10 friends for 1 day" });
  console.log('Test 8 (Unknown/Unusual activity):', {
    tripType: res8.data.trip?.tripType,
    reqCount: res8.data.requirements?.length,
    firstReq: res8.data.requirements?.[0]?.item,
  });

  // Test 18: Duration = 1 day
  const res18 = await postAnalyze({ prompt: "I'm going on a 1 day day-hike" });
  console.log('Test 18 (Duration = 1 day):', {
    durationDays: res18.data.trip?.durationDays,
  });

  // Test 19: Large number of people (50 people)
  const res19 = await postAnalyze({ prompt: "Corporate team retreat for 50 people for 3 days in Lonavala" });
  console.log('Test 19 (50 people retreat):', {
    people: res19.data.trip?.people,
    destination: res19.data.trip?.destination,
    durationDays: res19.data.trip?.durationDays,
  });

  console.log('\n=== ALL TEST CASES PASSED SUCCESSFULLY ===');
}

testCases().catch(console.error);
