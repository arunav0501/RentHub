const express = require('express');
const { createBooking, getMyBookings, getOwnerRequests, updateBookingStatus } = require('../controllers/booking.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);
router.get('/owner-requests', getOwnerRequests);
router.put('/:id/status', updateBookingStatus);

module.exports = router;
