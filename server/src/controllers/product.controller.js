const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { productSchema } = require('../validators/product.validator');
const fs = require('fs');
const path = require('path');

const getProducts = asyncHandler(async (req, res) => {
  const { search, category, location } = req.query;
  
  let where = {};
  if (search) {
    where.title = { contains: search };
  }
  if (category) {
    where.categoryId = category;
  }
  if (location) {
    where.location = { contains: location };
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true, owner: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(products);
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true, owner: { select: { name: true, email: true } } }
  });

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

const getMyProducts = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { ownerId: req.user.id },
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(products);
});

const createProduct = asyncHandler(async (req, res) => {
  const parsedData = productSchema.safeParse(req.body);
  
  if (!parsedData.success) {
    // If validation fails, delete the uploaded file if it exists
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, '../../uploads', req.file.filename));
    }
    res.status(400);
    throw new Error(parsedData.error.errors[0].message);
  }

  let imagePath = null;
  if (req.file) {
    imagePath = `/uploads/${req.file.filename}`;
  }

  const product = await prisma.product.create({
    data: {
      ...parsedData.data,
      image: imagePath,
      ownerId: req.user.id
    }
  });

  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });

  if (!product) {
    if (req.file) fs.unlinkSync(path.join(__dirname, '../../uploads', req.file.filename));
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.ownerId !== req.user.id) {
    if (req.file) fs.unlinkSync(path.join(__dirname, '../../uploads', req.file.filename));
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  const parsedData = productSchema.partial().safeParse(req.body);
  
  if (!parsedData.success) {
    if (req.file) fs.unlinkSync(path.join(__dirname, '../../uploads', req.file.filename));
    res.status(400);
    throw new Error(parsedData.error.errors[0].message);
  }

  let imagePath = product.image;
  if (req.file) {
    imagePath = `/uploads/${req.file.filename}`;
    // Optional: Delete old image
    if (product.image) {
      const oldPath = path.join(__dirname, '../..', product.image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...parsedData.data,
      image: imagePath
    }
  });

  res.json(updatedProduct);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.ownerId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this product');
  }

  if (product.image) {
    const oldPath = path.join(__dirname, '../..', product.image);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ message: 'Product removed' });
});

module.exports = {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
