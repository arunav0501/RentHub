const express = require('express');
const {
  getWallet,
  addFunds,
  withdrawFunds,
} = require('../controllers/wallet.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getWallet);
router.post('/add-funds', addFunds);
router.post('/withdraw', withdrawFunds);

module.exports = router;
