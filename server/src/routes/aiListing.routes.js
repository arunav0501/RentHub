const express = require('express');
const router = express.Router();
const { analyzeImage } = require('../controllers/aiListing.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.post('/analyze-image', protect, upload.single('image'), analyzeImage);

module.exports = router;
