const express = require('express');
const BookingController = require('../controllers/bookingController');
const { authenticate, requireBookableRole } = require('../../Backend/middleware/authMiddleware');

const router = express.Router();

router.post('/bookings', authenticate, requireBookableRole, BookingController.createBooking);
router.get('/bookings/my', authenticate, requireBookableRole, BookingController.getMyBookings);
router.get('/bookings/:id', authenticate, requireBookableRole, BookingController.getBookingById);
router.delete('/bookings/:id', authenticate, requireBookableRole, BookingController.deleteBooking);

module.exports = router;
