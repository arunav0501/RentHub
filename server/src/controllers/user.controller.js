const asyncHandler = require('../utils/asyncHandler');
const { calculateUserTrustScore } = require('../services/trustScore.service');

const getUserTrustScore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.query; // optional 'OWNER' or 'RENTER'

  try {
    const trustScoreData = await calculateUserTrustScore(id, role);
    res.json(trustScoreData);
  } catch (error) {
    if (error.message === 'User not found') {
      res.status(404);
      throw new Error('User not found');
    }
    throw error;
  }
});

module.exports = {
  getUserTrustScore,
};
