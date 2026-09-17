const { GoogleGenAI, Type } = require('@google/genai');
const prisma = require('../utils/prisma');

/**
 * Common fallback templates when Gemini API is offline or times out
 */
const FALLBACK_TEMPLATES = {
  beach: {
    destination: 'Beach Destination',
    durationDays: 4,
    people: 2,
    tripType: 'Beach Vacation',
    activities: ['Swimming', 'Beach hopping', 'Water sports', 'Sunset photography'],
    requirements: [
      {
        item: 'Action Camera',
        priority: 'essential',
        reason: 'Essential for capturing waterproof photos and videos while swimming or participating in water sports.',
        searchKeywords: ['action camera', 'gopro', 'waterproof camera', 'dji action'],
        suggestedCategory: 'Photography',
      },
      {
        item: 'Portable Bluetooth Speaker',
        priority: 'recommended',
        reason: 'Great for enjoying music on the beach or during evening get-togethers.',
        searchKeywords: ['speaker', 'bluetooth speaker', 'soundbar', 'audio'],
        suggestedCategory: 'Audio & Visual',
      },
      {
        item: 'Power Bank',
        priority: 'recommended',
        reason: 'Keeps phones and cameras charged throughout long days exploring the coast.',
        searchKeywords: ['power bank', 'charger', 'battery', 'portable power'],
        suggestedCategory: 'Electronics',
      },
      {
        item: 'Travel Backpack',
        priority: 'optional',
        reason: 'Handy for carrying day trip essentials, towels, and gear comfortably.',
        searchKeywords: ['backpack', 'travel bag', 'rucksack'],
        suggestedCategory: 'Sports',
      },
    ],
  },
  trek: {
    destination: 'Mountain Trail',
    durationDays: 4,
    people: 2,
    tripType: 'High Altitude Trek',
    activities: ['Trekking', 'Camping', 'Landscape photography', 'Stargazing'],
    requirements: [
      {
        item: 'Trekking Tent',
        priority: 'essential',
        reason: 'Provides essential shelter against mountain winds and nighttime cold temperatures.',
        searchKeywords: ['tent', 'camping tent', 'trekking tent', 'dome tent'],
        suggestedCategory: 'Sports',
      },
      {
        item: 'Sleeping Bag',
        priority: 'essential',
        reason: 'Critical for insulation and warmth during cold mountain nights.',
        searchKeywords: ['sleeping bag', 'mattress', 'camping mat'],
        suggestedCategory: 'Sports',
      },
      {
        item: 'Action / DSLR Camera',
        priority: 'recommended',
        reason: 'Captures panoramic mountain summits, sunrise vistas, and trail highlights.',
        searchKeywords: ['camera', 'dslr', 'gopro', 'mirrorless'],
        suggestedCategory: 'Photography',
      },
      {
        item: 'Portable Stove / Camp Cookware',
        priority: 'optional',
        reason: 'Enables hot meals and warm drinks at high altitude campsites.',
        searchKeywords: ['stove', 'camp stove', 'cookware', 'burner'],
        suggestedCategory: 'Tools',
      },
    ],
  },
  photography: {
    destination: 'Photo Expedition',
    durationDays: 3,
    people: 1,
    tripType: 'Photography Expedition',
    activities: ['Wildlife photography', 'Landscape shots', 'Portraits', 'Videography'],
    requirements: [
      {
        item: 'DSLR / Mirrorless Camera Kit',
        priority: 'essential',
        reason: 'High-resolution sensor and manual controls required for professional-grade captures.',
        searchKeywords: ['sony', 'canon', 'nikon', 'dslr', 'camera'],
        suggestedCategory: 'Photography',
      },
      {
        item: 'Camera Tripod',
        priority: 'essential',
        reason: 'Essential for stability in low-light, long exposures, and landscape photography.',
        searchKeywords: ['tripod', 'monopod', 'stand', 'gimbal'],
        suggestedCategory: 'Photography',
      },
      {
        item: 'Drone Camera',
        priority: 'recommended',
        reason: 'Offers breathtaking aerial perspectives and cinematic establishing shots.',
        searchKeywords: ['drone', 'dji', 'mavic', 'quadcopter'],
        suggestedCategory: 'Photography',
      },
    ],
  },
  camping: {
    destination: 'Outdoor Campsite',
    durationDays: 2,
    people: 4,
    tripType: 'Weekend Camping',
    activities: ['Campfire', 'Outdoor cooking', 'Hiking', 'Relaxing'],
    requirements: [
      {
        item: '4-Person Camping Tent',
        priority: 'essential',
        reason: 'Weatherproof shelter designed to accommodate your group comfortably outdoors.',
        searchKeywords: ['tent', 'camping tent', 'dome tent', 'shelter'],
        suggestedCategory: 'Sports',
      },
      {
        item: 'Camping Lantern & Headlamps',
        priority: 'essential',
        reason: 'Provides hands-free and ambient illumination around the campsite after dark.',
        searchKeywords: ['lantern', 'headlamp', 'torch', 'light'],
        suggestedCategory: 'Tools',
      },
      {
        item: 'Portable Bluetooth Speaker',
        priority: 'optional',
        reason: 'Great for music around the campfire and evening relaxation.',
        searchKeywords: ['speaker', 'bluetooth speaker', 'audio'],
        suggestedCategory: 'Audio & Visual',
      },
    ],
  },
};

/**
 * Detects fallback template matching the prompt keywords or parses items directly
 */
function getFallbackPlan(prompt) {
  const p = prompt.toLowerCase();
  const requirements = [];

  // 1. Musical instruments
  if (p.includes('piano') || p.includes('keyboard')) {
    requirements.push({
      item: 'Digital Piano / Stage Keyboard',
      priority: 'essential',
      reason: 'Full 88-key weighted keyboard with sustain pedal and sound engine for performance or practice.',
      searchKeywords: ['piano', 'keyboard', 'digital piano', 'yamaha'],
      suggestedCategory: 'Audio & Visual',
    });
  }
  if (p.includes('guitar')) {
    requirements.push({
      item: 'Acoustic / Electric Guitar',
      priority: 'essential',
      reason: 'Quality dreadnought guitar with rich resonance for playing and recording.',
      searchKeywords: ['guitar', 'acoustic guitar', 'fender'],
      suggestedCategory: 'Audio & Visual',
    });
  }
  if (p.includes('drum')) {
    requirements.push({
      item: 'Electronic / Acoustic Drum Kit',
      priority: 'essential',
      reason: 'Complete drum kit for rhythm, rehearsal, or live sessions.',
      searchKeywords: ['drum', 'percussion', 'cajon'],
      suggestedCategory: 'Audio & Visual',
    });
  }

  // 2. Audio / Speakers / DJ
  if (p.includes('speaker') || p.includes('audio') || p.includes('sound') || p.includes('dj') || p.includes('party')) {
    requirements.push({
      item: 'Portable Party Speaker',
      priority: 'essential',
      reason: 'High-output waterproof sound system for music playback and event entertainment.',
      searchKeywords: ['speaker', 'bluetooth speaker', 'jbl', 'party speaker'],
      suggestedCategory: 'Audio & Visual',
    });
  }

  // 3. Cameras / Photography / Drones
  if (p.includes('action camera') || p.includes('gopro')) {
    requirements.push({
      item: 'Waterproof Action Camera',
      priority: 'essential',
      reason: 'Rugged high-definition camera with stabilization for water sports and outdoor action.',
      searchKeywords: ['gopro', 'action camera', 'dji osmo', 'camera'],
      suggestedCategory: 'Photography',
    });
  } else if (p.includes('camera') || p.includes('photo') || p.includes('shoot') || p.includes('wedding')) {
    requirements.push({
      item: 'Full-Frame Mirrorless Camera Kit',
      priority: 'essential',
      reason: 'High-resolution full-frame camera with fast zoom lens for crisp photography and 4K cinema video.',
      searchKeywords: ['camera', 'sony', 'mirrorless', 'alpha'],
      suggestedCategory: 'Photography',
    });
  }

  if (p.includes('drone')) {
    requirements.push({
      item: 'Camera Drone',
      priority: 'recommended',
      reason: 'Compact 4K camera drone for aerial landscape footage and cinematic perspectives.',
      searchKeywords: ['drone', 'dji mini', 'quadcopter'],
      suggestedCategory: 'Electronics',
    });
  }

  // 4. Electronics / Computers / Power Banks
  if (p.includes('laptop') || p.includes('computer') || p.includes('gaming')) {
    requirements.push({
      item: 'High-Performance Laptop',
      priority: 'essential',
      reason: 'Powerful laptop for gaming, content creation, or on-the-go productivity.',
      searchKeywords: ['laptop', 'gaming laptop', 'lenovo'],
      suggestedCategory: 'Electronics',
    });
  }
  if (p.includes('power bank') || p.includes('battery') || p.includes('charger')) {
    requirements.push({
      item: 'High-Capacity Fast-Charging Power Bank',
      priority: 'recommended',
      reason: 'Keep phones, cameras, and accessories charged throughout long outings.',
      searchKeywords: ['power bank', 'anker', 'portable charger'],
      suggestedCategory: 'Electronics',
    });
  }

  // 5. Trekking / Camping / Outdoors (ONLY if explicitly mentioned)
  if (p.includes('tent') || p.includes('camping') || p.includes('camp')) {
    requirements.push({
      item: 'Waterproof Camping Tent',
      priority: 'essential',
      reason: 'Spacious weatherproof dome tent for outdoor shelter and overnight camping.',
      searchKeywords: ['tent', 'camping tent', 'quechua', 'coleman'],
      suggestedCategory: 'Sports',
    });
  }
  if (p.includes('trek') || p.includes('hike') || p.includes('poles') || p.includes('kedarkantha')) {
    requirements.push({
      item: 'Adjustable Trekking Poles',
      priority: 'essential',
      reason: 'Lightweight shock-absorbing trekking poles for trail stability.',
      searchKeywords: ['trekking poles', 'hiking poles', 'black diamond'],
      suggestedCategory: 'Sports',
    });
    requirements.push({
      item: 'Rechargeable Headlamp',
      priority: 'essential',
      reason: 'High-lumen hands-free illumination for night trail safety.',
      searchKeywords: ['headlamp', 'torch', 'petzl'],
      suggestedCategory: 'Sports',
    });
  }

  // If specific recognized items were extracted:
  if (requirements.length > 0) {
    let tripType = 'Equipment Rental';
    if (p.includes('piano') || p.includes('guitar') || p.includes('music')) {
      tripType = 'Musical Instruments Rental';
    } else if (p.includes('wedding') || p.includes('photo')) {
      tripType = 'Photography & Videography Equipment';
    } else if (p.includes('goa') || p.includes('beach')) {
      tripType = 'Beach Vacation';
    } else if (p.includes('trek') || p.includes('camp')) {
      tripType = 'Outdoor Adventure';
    }

    const dest = p.includes('goa') ? 'Goa' : p.includes('kedarkantha') ? 'Kedarkantha' : '';

    return {
      destination: dest,
      durationDays: 3,
      people: 1,
      tripType,
      activities: ['Equipment Rental'],
      requirements,
      isClarificationNeeded: false,
    };
  }

  // Check trip templates
  if (p.includes('goa') || p.includes('beach') || p.includes('sea')) {
    return { ...FALLBACK_TEMPLATES.beach, destination: 'Goa' };
  }
  if (p.includes('mountain') || p.includes('himalaya')) {
    return { ...FALLBACK_TEMPLATES.trek, destination: 'Mountain Trail' };
  }

  // Dynamic noun phrase extraction for "i want X and Y" or "need X"
  const cleanPrompt = p.replace(/i want|i need|looking for|please provide|rental for/gi, '').trim();
  const rawParts = cleanPrompt.split(/\band\b|,|\+/i).map((s) => s.trim()).filter((s) => s.length > 1);
  if (rawParts.length > 0) {
    return {
      destination: '',
      durationDays: 3,
      people: 1,
      tripType: 'Custom Equipment Rental',
      activities: ['Rental Request'],
      requirements: rawParts.map((item) => ({
        item: item.charAt(0).toUpperCase() + item.slice(1),
        priority: 'essential',
        reason: `Rental equipment for your request: ${item}.`,
        searchKeywords: [item, item.split(' ')[0]],
        suggestedCategory: 'General',
      })),
      isClarificationNeeded: false,
    };
  }

  return { ...FALLBACK_TEMPLATES.camping };
}

/**
 * Uses Gemini to extract rental parameters and requirements
 */
async function analyzeTripIntentWithGemini(prompt, availableCategories = []) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key') {
    console.warn('Gemini API key not configured, using smart template fallback');
    return getFallbackPlan(prompt);
  }

  const ai = new GoogleGenAI({ apiKey });

  const categoriesStr = availableCategories.length > 0
    ? availableCategories.map((c) => `"${c}"`).join(', ')
    : '"Electronics", "Photography", "Vehicles", "Tools", "Furniture", "Sports", "Party & Events", "Audio & Visual"';

  const systemInstruction = `
You are the Smart Rental Planner & AI Equipment Assistant for RentHub, an online peer-to-peer equipment and item rental marketplace.
Users will provide natural language requests for ANY rental need. This includes:
1. Specific items or equipment they want to rent (e.g. "i want piano and guitar", "looking for a projector and screen", "need a lawn mower").
2. Trips, travel, and outdoor adventures (e.g. "Going to Goa for 5 days with 4 friends", "Trekking to Kedarkantha").
3. Events, weddings, concerts, and parties (e.g. "wedding photography gear", "DJ sound system for birthday").
4. Hobbies, DIY, music, and sports (e.g. "musical instruments for jam session", "tools for home renovation").

Your role:
1. Parse the user's natural language request.
2. If the user explicitly asks for specific items (e.g. "i want piano and guitar"):
   - Directly extract EACH requested item as an essential requirement! (e.g. Item 1: "Digital Piano / Keyboard", Item 2: "Acoustic / Electric Guitar").
   - Set tripType to a relevant title matching the request (e.g. "Musical Instruments Rental", "Audio & Visual Gear", "Home Equipment Rental").
   - If no destination was specified, leave destination as "" or null. DO NOT invent fake destinations like "Outdoor Campsite".
   - DO NOT replace their requested items with unrelated camping, trekking, or travel gear.
3. If the user describes a trip or activity (e.g. "Going to Goa for 5 days"):
   - Extract destination, duration in days, party size, trip type, activities.
   - Curate a checklist of essential and recommended gear for that trip.
4. If the prompt is completely ambiguous (e.g. only 1 word like "Rent" or "Help"), set isClarificationNeeded to true and ask what they would like to rent. If they mention specific items (like "i want piano and guitar"), set isClarificationNeeded to false.
5. For each requirement:
   - item: clean name (e.g. "Digital Piano", "Acoustic Guitar", "Action Camera")
   - priority: "essential" | "recommended" | "optional"
   - reason: concise explanation of why it fits their request
   - searchKeywords: 2-4 search terms to query the database (e.g. ["piano", "keyboard", "yamaha"] for piano, ["guitar", "acoustic guitar"] for guitar)
   - suggestedCategory: the best matching category from this list: [${categoriesStr}]

Respond strictly in JSON matching the schema.
`;

  const candidateModels = [
    process.env.GEMINI_TEXT_MODEL,
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.6-flash',
  ].filter(Boolean);

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Rental Request:\n"${prompt}"` }],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              destination: { type: Type.STRING },
              durationDays: { type: Type.INTEGER },
              people: { type: Type.INTEGER },
              tripType: { type: Type.STRING },
              activities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              isClarificationNeeded: { type: Type.BOOLEAN },
              clarificationQuestion: { type: Type.STRING },
              requirements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    searchKeywords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    suggestedCategory: { type: Type.STRING },
                  },
                  required: ['item', 'priority', 'reason', 'searchKeywords'],
                },
              },
            },
            required: ['tripType', 'requirements', 'isClarificationNeeded'],
          },
        },
      });

      let resultText = response.text;
      if (!resultText && response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
        resultText = response.candidates[0].content.parts[0].text;
      }

      if (!resultText) {
        throw new Error('Empty response from Gemini');
      }

      const parsed = JSON.parse(resultText);

      // Sanitize priority & keywords
      if (Array.isArray(parsed.requirements)) {
        parsed.requirements = parsed.requirements.map((req) => ({
          ...req,
          priority: ['essential', 'recommended', 'optional'].includes(req.priority?.toLowerCase())
            ? req.priority.toLowerCase()
            : 'recommended',
          searchKeywords: Array.isArray(req.searchKeywords) && req.searchKeywords.length > 0
            ? req.searchKeywords
            : [req.item],
        }));
      }

      return parsed;
    } catch (error) {
      console.warn(`Model ${modelName} encountered error:`, error.message?.slice(0, 120));
      // Continue to next candidate model
    }
  }

  // If all models failed (e.g. network or quota), use smart fallback
  console.warn('All Gemini models exhausted, applying smart rental fallback');
  return getFallbackPlan(prompt);
}

/**
 * Calculates relevance score (0-100) between a requirement and a product
 */
function calculateRelevanceScore(product, requirement, tripDestination) {
  let score = 0;

  const reqItem = requirement.item.toLowerCase();
  const title = (product.title || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const model = (product.model || '').toLowerCase();
  const categoryName = (product.category?.name || '').toLowerCase();
  const suggestedCategory = (requirement.suggestedCategory || '').toLowerCase();
  const productLocation = (product.location || '').toLowerCase();
  const destination = (tripDestination || '').toLowerCase();

  // 1. Title direct match or keyword match (+40 pts)
  const keywords = requirement.searchKeywords || [];
  let hasTitleMatch = false;
  if (title.includes(reqItem)) {
    score += 40;
    hasTitleMatch = true;
  } else {
    for (const kw of keywords) {
      const k = kw.toLowerCase();
      if (title.includes(k)) {
        score += 35;
        hasTitleMatch = true;
        break;
      }
    }
  }

  // 2. Brand or model match (+20 pts)
  let hasBrandMatch = false;
  if (brand || model) {
    for (const kw of keywords) {
      const k = kw.toLowerCase();
      if (brand.includes(k) || model.includes(k)) {
        score += 20;
        hasBrandMatch = true;
        break;
      }
    }
  }

  // 3. Category match (+20 pts - only awards if there is at least some title, brand, or description relevance)
  if (suggestedCategory && categoryName.includes(suggestedCategory)) {
    score += 20;
  }

  // 4. Description match (+10 pts)
  if (description.includes(reqItem) || keywords.some((kw) => description.includes(kw.toLowerCase()))) {
    score += 10;
  }

  // 5. Destination location proximity / match (+10 pts)
  if (destination && productLocation && (productLocation.includes(destination) || destination.includes(productLocation))) {
    score += 10;
  }

  // If there's neither title, brand, nor item match, cap score below 40 to avoid false positives
  if (!hasTitleMatch && !hasBrandMatch && !title.includes(reqItem.split(' ')[0])) {
    score = Math.min(30, score);
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Searches real RentHub inventory in MariaDB for each requirement and ranks results
 */
async function matchRequirementsWithInventory(requirements, tripDestination, tripDurationDays) {
  // Fetch all available active products with category and bookings
  const allProducts = await prisma.product.findMany({
    include: {
      category: true,
      bookings: {
        where: {
          status: { in: ['PENDING', 'APPROVED'] },
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
    },
  });

  const matchedRequirements = [];

  for (const req of requirements) {
    const keywords = (req.searchKeywords || [req.item]).map((k) => k.toLowerCase());
    const itemWord = req.item.toLowerCase();
    const suggestedCat = (req.suggestedCategory || '').toLowerCase();

    // Filter candidate products
    const candidateProducts = allProducts.filter((product) => {
      const title = (product.title || '').toLowerCase();
      const desc = (product.description || '').toLowerCase();
      const brand = (product.brand || '').toLowerCase();
      const model = (product.model || '').toLowerCase();
      const cat = (product.category?.name || '').toLowerCase();

      // Check item word tokens (singular/plural handling)
      const itemTokens = itemWord.split(/\s+/).filter((w) => w.length > 2);
      const hasItemTokenInTitle = itemTokens.some((t) => {
        const singular = t.endsWith('s') ? t.slice(0, -1) : t;
        return title.includes(t) || title.includes(singular);
      });

      if (hasItemTokenInTitle) {
        return true;
      }

      // Exact requirement item match in title or description
      if (title.includes(itemWord) || desc.includes(itemWord)) {
        return true;
      }

      // Search keyword matches
      const hasKeywordMatch = keywords.some(
        (kw) =>
          title.includes(kw) ||
          brand.includes(kw) ||
          model.includes(kw) ||
          (desc.includes(kw) && kw.length > 3)
      );

      if (hasKeywordMatch) {
        return true;
      }

      // If category matches, ONLY include if there's at least some contextual connection in desc/brand/model
      if (suggestedCat && (cat.includes(suggestedCat) || suggestedCat.includes(cat))) {
        return itemTokens.some((t) => desc.includes(t) || brand.includes(t) || model.includes(t));
      }

      return false;
    });

    // Score and rank candidates
    const scoredProducts = candidateProducts.map((product) => {
      const relevanceScore = calculateRelevanceScore(product, req, tripDestination);

      // Check booking availability
      const activeBookingsCount = product.bookings.length;
      const isAvailable = activeBookingsCount < (product.quantity || 1);

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        dailyRent: product.dailyRent,
        location: product.location,
        image: product.image,
        condition: product.condition,
        brand: product.brand,
        model: product.model,
        category: product.category?.name || 'General',
        relevanceScore,
        available: isAvailable,
        locationMatch: Boolean(
          tripDestination &&
            product.location &&
            (product.location.toLowerCase().includes(tripDestination.toLowerCase()) ||
              tripDestination.toLowerCase().includes(product.location.toLowerCase()))
        ),
      };
    });

    // Filter by minimum relevance threshold and sort descending
    const validProducts = scoredProducts.filter((p) => p.relevanceScore >= 45);
    validProducts.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit to top 3 products per requirement
    const topProducts = validProducts.slice(0, 3);

    matchedRequirements.push({
      item: req.item,
      priority: req.priority || 'recommended',
      reason: req.reason,
      suggestedCategory: req.suggestedCategory,
      availableCount: topProducts.length,
      products: topProducts,
    });
  }

  return matchedRequirements;
}

/**
 * Main service entry point for Smart Rental Planner
 */
async function generateRentalPlan(prompt) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    const error = new Error('Please describe your trip, event, or activity.');
    error.status = 400;
    throw error;
  }

  const trimmedPrompt = prompt.trim();

  // 1. Fetch available categories from database
  const dbCategories = await prisma.category.findMany({ select: { name: true } });
  const categoryNames = dbCategories.map((c) => c.name);

  // 2. Call Gemini structured NLU
  const tripAnalysis = await analyzeTripIntentWithGemini(trimmedPrompt, categoryNames);

  // If Gemini determined clarification is needed
  if (tripAnalysis.isClarificationNeeded && tripAnalysis.clarificationQuestion) {
    return {
      isClarificationNeeded: true,
      clarificationQuestion: tripAnalysis.clarificationQuestion,
      trip: {
        destination: tripAnalysis.destination || '',
        durationDays: tripAnalysis.durationDays || null,
        people: tripAnalysis.people || null,
        tripType: tripAnalysis.tripType || 'Trip',
        activities: tripAnalysis.activities || [],
      },
      requirements: [],
      summary: {
        totalRequirements: 0,
        availableCount: 0,
        unavailableCount: 0,
      },
    };
  }

  const destination = tripAnalysis.destination || '';
  const durationDays = tripAnalysis.durationDays || 3;
  const people = tripAnalysis.people || 1;
  const tripType = tripAnalysis.tripType || 'Equipment Rental';
  const activities = tripAnalysis.activities && tripAnalysis.activities.length > 0
    ? tripAnalysis.activities
    : ['Equipment Rental'];

  // 3. Search and rank matching real marketplace inventory
  const requirements = tripAnalysis.requirements || [];
  const processedRequirements = await matchRequirementsWithInventory(
    requirements,
    destination,
    durationDays
  );

  const totalRequirements = processedRequirements.length;
  const availableCount = processedRequirements.filter(
    (r) => r.products && r.products.length > 0
  ).length;
  const unavailableCount = totalRequirements - availableCount;

  return {
    isClarificationNeeded: false,
    trip: {
      destination,
      durationDays,
      people,
      tripType,
      activities,
    },
    requirements: processedRequirements,
    summary: {
      totalRequirements,
      availableCount,
      unavailableCount,
    },
  };
}

module.exports = {
  generateRentalPlan,
};
