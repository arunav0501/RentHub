const OpenAI = require('openai');
const fs = require('fs/promises');
const path = require('path');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const analyzeProductImage = async (filePath, categories) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const absolutePath = path.resolve(filePath);
  const imageBuffer = await fs.readFile(absolutePath);
  const mimeType = getMimeType(filePath);

  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    throw new Error('Unsupported image type');
  }

  const base64Image = imageBuffer.toString('base64');
  const categoryNames = categories.map(category => category.name);

  const response = await client.responses.create({
    model: process.env.OPENAI_VISION_MODEL || 'gpt-5.6-luna',
    input: [{
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: `You are RentHub's listing assistant. Analyze the uploaded product image and suggest a rental listing. Only identify information that is reasonably visible or inferable from the image. Never invent an exact brand, model, condition, specifications, or price. If uncertain, use an empty string or a cautious generic value.\n\nAvailable categories: ${JSON.stringify(categoryNames)}\n\nReturn only JSON with these keys: title, description, categoryName, brand, model, condition.\n- title: concise marketplace title.\n- description: 2-4 sentence rental listing description.\n- categoryName: exactly one category from the available categories.\n- brand/model: only if clearly visible.\n- condition: one of New, Like New, Good, Fair, or empty if the image cannot establish condition.`
        },
        {
          type: 'input_image',
          image_url: `data:${mimeType};base64,${base64Image}`
        }
      ]
    }],
    text: {
      format: {
        type: 'json_schema',
        name: 'renthub_listing',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            categoryName: { type: 'string' },
            brand: { type: 'string' },
            model: { type: 'string' },
            condition: { type: 'string' }
          },
          required: ['title', 'description', 'categoryName', 'brand', 'model', 'condition'],
          additionalProperties: false
        }
      }
    }
  });

  const text = response.output_text;
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