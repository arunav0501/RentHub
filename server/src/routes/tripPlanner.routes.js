const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { analyzeTrip } = require('../controllers/tripPlanner.controller');

// Optional auth helper: attaches user if token is provided, but allows unauthenticated visitors
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true },
      });
    } catch {
      // Ignored for optional auth
    }
  }
  next();
};

// POST /api/trip-planner/analyze
router.post('/analyze', optionalAuth, analyzeTrip);

module.exports = router;
