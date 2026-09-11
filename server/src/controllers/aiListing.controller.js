const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../utils/prisma');
const { analyzeProductImage } = require('../services/aiListing.service');
const fs = require('fs/promises');
const path = require('path');

const analyzeImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Product image is required');
  }

  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    const result = await analyzeProductImage(
      path.join(__dirname, '../..', 'uploads', req.file.filename),
      categories
    );

    res.json(result);
  } finally {
    await fs.unlink(req.file.path).catch(() => {});
  }
});

module.exports = { analyzeImage };