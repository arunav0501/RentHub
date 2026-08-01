const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/product.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.route('/')
  .get(getProducts)
  .post(protect, upload.single('image'), createProduct);

router.get('/owner/my-products', protect, getMyProducts);

router.route('/:id')
  .get(getProductById)
  .put(protect, upload.single('image'), updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;
