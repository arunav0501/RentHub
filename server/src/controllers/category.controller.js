const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }

  const categoryExists = await prisma.category.findUnique({ where: { name } });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category already exists');
  }

  const category = await prisma.category.create({
    data: { name }
  });

  res.status(201).json(category);
});

module.exports = {
  getCategories,
  createCategory
};
