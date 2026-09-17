const express = require('express');
const router = express.Router();
const { getUserTrustScore } = require('../controllers/user.controller');

// Publicly readable trust score for marketplace transparency
router.get('/:id/trust-score', getUserTrustScore);

module.exports = router;
