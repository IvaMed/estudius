const BookingService = require('../services/bookingService');
const TeacherRepository = require('../data/teacherRepository');

(async () => {
  try {
    const teacherId = 1;
    const teacher = await TeacherRepository.getById(teacherId);
    console.log('Teacher schedules:', teacher && teacher.schedules);

    const today = new Date();
    const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    console.log('Trying to create booking for:', ymd, 'teacherId', teacherId);

    try {
      const out = await BookingService.createBookingForUser({ userId: 9999, teacherId, date: ymd, message: 'test booking past' });
      console.log('Booking created (unexpected):', out);
    } catch (e) {
      console.error('Expected error creating booking:', e.message, 'code:', e.code);
    }
  } catch (err) {
    console.error(err);
  }
})();