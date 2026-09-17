const express = require('express');
const {
  getProductReviews,
  checkCanReview,
  createReview,
} = require('../controllers/review.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/product/:productId', getProductReviews);
router.get('/can-review/:productId', protect, checkCanReview);
router.post('/', protect, createReview);

module.exports = router;
