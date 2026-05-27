const TeacherRepository = require('../data/teacherRepository');
const BookingService = require('../services/bookingService');
const ScheduleUtils = require('../lib/scheduleUtils');

(async () => {
  try {
    const all = await TeacherRepository.getAll();
    const now = new Date();
    const todayDow = now.getDay();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    console.log('Today dow:', todayDow, 'nowMin:', nowMin);

    let candidate = null;
    for (const t of all) {
      const slots = ScheduleUtils.getSlotsForDow(t.schedules, todayDow);
      if (!slots || !slots.length) continue;
      const slot = slots[0];
      const startMin = ScheduleUtils.timeToMinutes(slot.start);
      if (startMin != null && startMin < nowMin) {
        candidate = { teacher: t, slot };
        break;
      }
    }
    if (!candidate) {
      console.log('No teacher found with a slot earlier than now for today. Listing teachers with today slots:');
      for (const t of all) {
        const slots = ScheduleUtils.getSlotsForDow(t.schedules, todayDow);
        if (slots && slots.length) console.log('id', t.id, 'name', t.firstName, t.lastName, 'slot', slots[0]);
      }
      return;
    }

    console.log('Found candidate teacher:', candidate.teacher.id, candidate.teacher.firstName, candidate.teacher.lastName, 'slot', candidate.slot);
    const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    try {
      const out = await BookingService.createBookingForUser({ userId: 9999, teacherId: candidate.teacher.id, date: ymd, message: 'test overlap' });
      console.log('Booking created (unexpected):', out);
    } catch (e) {
      console.error('Expected/error response:', e && e.message, 'code:', e && e.code);
    }
  } catch (err) {
    console.error(err);
  }
})();