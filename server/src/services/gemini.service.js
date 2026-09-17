const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');

/**
 * Service to analyze product images using Google Gemini Vision model
 */
async function analyzeProductImage(filePath, mimeType, availableCategories = []) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key') {
    const error = new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in server/.env.');
    error.status = 503;
    error.code = 'GEMINI_KEY_NOT_CONFIGURED';
    throw error;
  }

  const modelName = process.env.GEMINI_VISION_MODEL || 'gemini-3.6-flash';
  const ai = new GoogleGenAI({ apiKey });

  // Read image file and convert to base64
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');

  const categoriesListStr = availableCategories.length > 0 
    ? availableCategories.map(c => `"${c}"`).join(', ')
    : '"Electronics", "Vehicles", "Tools", "Furniture", "Photography", "Sports", "Party & Events", "Audio & Visual"';

  const prompt = `
You are an expert product catalog assistant for RentHub, an online rental marketplace.
Analyze this product image and generate listing details for someone who wants to rent it out.

STRICT ACCURACY RULES:
1. Only identify information that is visible or reasonably inferable from the image.
2. DO NOT invent exact model numbers or arbitrary specifications.
3. DO NOT invent rental prices, quantity, or location.
4. If you are uncertain about the brand or model, return an empty string "" instead of guessing.
5. Condition should be an estimate from these options: "New", "Like New", "Good", "Fair". Do NOT claim "New" unless there is clear visual evidence (e.g. sealed packaging).
6. For categoryName, you MUST select the best match exclusively from the following list of available RentHub categories:
   [${categoriesListStr}]
   If none of these categories reasonably match, return an empty string "".
7. Provide a compelling, professional title (e.g., "Canon EOS 1500D DSLR Camera" or "Cordless Power Drill with Case").
8. Provide an engaging description (30-80 words) highlighting key visible features and rental suitability.

Output must be in JSON format matching the schema.
`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            categoryName: { type: Type.STRING },
            brand: { type: Type.STRING },
            model: { type: Type.STRING },
            condition: { type: Type.STRING },
          },
          required: ['title', 'description', 'categoryName', 'brand', 'model', 'condition'],
        },
      },
    });

    let resultText = response.text;
    if (!resultText && response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      resultText = response.candidates[0].content.parts[0].text;
    }

    if (!resultText) {
      throw new Error('No content returned from Gemini');
    }

    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch (parseErr) {
      // Remove possible markdown formatting e.g. ```json ... ```
      const cleaned = resultText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    // Sanitize and validate fields
    const allowedConditions = ['New', 'Like New', 'Good', 'Fair'];
    let condition = (parsed.condition || 'Good').trim();
    if (!allowedConditions.includes(condition)) {
      condition = 'Good';
    }

    return {
      title: (parsed.title || '').trim(),
      description: (parsed.description || '').trim(),
      categoryName: (parsed.categoryName || '').trim(),
      brand: (parsed.brand || '').trim(),
      model: (parsed.model || '').trim(),
      condition,
    };
  } catch (error) {
    console.error('Gemini API Error:', error.message || error);
    if (error.code === 'GEMINI_KEY_NOT_CONFIGURED') {
      throw error;
    }
    const safeError = new Error(
      error.message?.includes('API_KEY_INVALID')
        ? 'Invalid Gemini API key. Please check your GEMINI_API_KEY configuration.'
        : 'Failed to analyze image with Gemini. Please try again or create the listing manually.'
    );
    safeError.status = 502;
    safeError.originalError = error.message;
    throw safeError;
  }
}

module.exports = {
  analyzeProductImage,
};
