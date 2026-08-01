const express = require('express');
const router = express.Router();
const { getCategories, createCategory } = require('../controllers/category.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.route('/')
  .get(getCategories)
  .post(protect, createCategory);

module.exports = router;
