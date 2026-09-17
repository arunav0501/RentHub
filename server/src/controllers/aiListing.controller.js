const fs = require('fs');
const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { analyzeProductImage } = require('../services/gemini.service');

const analyzeImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please provide an image file to analyze');
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  try {
    // 1. Fetch available categories from database
    const dbCategories = await prisma.category.findMany({
      select: { id: true, name: true },
    });
    const categoryNames = dbCategories.map((c) => c.name);

    // 2. Call Gemini service
    const aiResult = await analyzeProductImage(filePath, mimeType, categoryNames);

    // 3. Match category name with real database categoryId
    let matchedCategoryId = null;
    let matchedCategoryName = null;

    if (aiResult.categoryName) {
      const match = dbCategories.find(
        (c) => c.name.toLowerCase() === aiResult.categoryName.toLowerCase()
      );
      if (match) {
        matchedCategoryId = match.id;
        matchedCategoryName = match.name;
      }
    }

    // 4. Return structured response to pre-fill frontend form
    res.json({
      title: aiResult.title || '',
      description: aiResult.description || '',
      categoryId: matchedCategoryId,
      categoryName: matchedCategoryName,
      brand: aiResult.brand || '',
      model: aiResult.model || '',
      condition: aiResult.condition || 'Good',
    });
  } finally {
    // Always clean up the temporary uploaded image from AI analysis
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      console.error('Failed to remove temp upload file:', cleanupErr.message);
    }
  }
});

module.exports = {
  analyzeImage,
};
