const asyncHandler = require('../utils/asyncHandler');
const { generateRentalPlan } = require('../services/tripPlanner.service');

// POST /api/trip-planner/analyze
const analyzeTrip = asyncHandler(async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400);
    throw new Error('Please describe your trip, event, or activity.');
  }

  if (prompt.trim().length > 1000) {
    res.status(400);
    throw new Error('Trip description is too long (maximum 1,000 characters).');
  }

  try {
    const plan = await generateRentalPlan(prompt.trim());
    res.json(plan);
  } catch (error) {
    const status = error.status || 500;
    res.status(status);
    throw new Error(error.message || 'Something went wrong while building your rental plan.');
  }
});

module.exports = {
  analyzeTrip,
};
