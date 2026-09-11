const { GoogleGenAI } = require('@google/genai');
const fs = require('fs/promises');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const analyzeProductImage = async (filePath, categories) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const absolutePath = path.resolve(filePath);
  const imageBuffer = await fs.readFile(absolutePath);
  const mimeType = getMimeType(filePath);

  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    throw new Error('Unsupported image type');
  }

  const base64Image = imageBuffer.toString('base64');
  const categoryNames = categories.map(category => category.name);

  const prompt = `You are RentHub's listing assistant. Analyze the uploaded product image and suggest a rental listing. Only identify information that is reasonably visible or inferable from the image. Never invent an exact brand, model, condition, specifications, or price. If uncertain, use an empty string or a cautious generic value.

Available categories: ${JSON.stringify(categoryNames)}

Return a JSON object with these keys: title, description, categoryName, brand, model, condition.
- title: concise marketplace title.
- description: 2-4 sentence rental listing description.
- categoryName: exactly one category from the available categories.
- brand/model: only if clearly visible.
- condition: one of New, Like New, Good, Fair, or empty if the image cannot establish condition.`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          data: base64Image,
          mimeType
        }
      },
      { text: prompt }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          categoryName: { type: 'string' },
          brand: { type: 'string' },
          model: { type: 'string' },
          condition: { type: 'string' }
        },
        required: ['title', 'description', 'categoryName', 'brand', 'model', 'condition']
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error('AI returned an empty response');
  }

  const result = JSON.parse(text);
  const matchedCategory = categories.find(
    category => category.name.toLowerCase() === result.categoryName.trim().toLowerCase()
  );

  return {
    ...result,
    categoryId: matchedCategory?.id || ''
  };
};

function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  return '';
}

module.exports = { analyzeProductImage };
