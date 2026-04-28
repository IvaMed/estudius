const express = require('express');
const BookingController = require('../controllers/bookingController');
const { authenticate, requireUserRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/bookings', authenticate, requireUserRole, BookingController.createBooking);
router.get('/bookings/my', authenticate, BookingController.getMyBookings);

module.exports = router;
