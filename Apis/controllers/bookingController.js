const BookingService = require('../../Backend/services/bookingService');
const BookingRepository = require('../../Backend/data/bookingRepository');
const { parseSchedulesField, parseYMDLocal, getSlotsForDow, normalizeTimeHM } = require('../../Backend/lib/scheduleUtils');
const { formatTeacherAddress } = require('../../Backend/lib/locationUtils');

class BookingController {
  static async createBooking(req, res) {
    try {
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'No autenticado' });

      const {
        teacherId: tidBody,
        datetime,
        date,
        slotStart,
        message,
        teacher_id,
        sessionModality,
        bookingSubjects
      } = req.body || {};
      const teacherId = tidBody ?? teacher_id;
      if (teacherId === undefined || teacherId === null || teacherId === '') {
        return res.status(400).json({ success: false, message: 'Falta teacherId' });
      }
      const tidNum = parseInt(String(teacherId).trim(), 10);
      if (!Number.isFinite(tidNum) || tidNum < 1) {
        return res.status(400).json({ success: false, message: 'teacherId inválido' });
      }

      try {
        const out = await BookingService.createBookingForUser({
          userId: user.id,
          teacherId: tidNum,
          date,
          datetime,
          slotStart,
          message,
          sessionModality,
          bookingSubjects
        });
        return res.json({ success: true, message: 'Reserva creada', bookingId: out.bookingId, datetime: out.datetime });
      } catch (err) {
        if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
        if (
          err.code === 'FULL' ||
          err.code === 'DUPLICATE' ||
          err.code === 'USER_BUSY' ||
          err.code === 'NO_CLASS' ||
          err.code === 'SLOT_MISMATCH' ||
          err.code === 'MODALITY_REQUIRED' ||
          err.code === 'PAST' ||
          err.code === 'TOO_FAR' ||
          err.code === 'SUBJECTS_REQUIRED' ||
          err.code === 'SUBJECTS_INVALID'
        ) {
          return res.status(400).json({ success: false, message: err.message, code: err.code });
        }
        if (err.code === 'VALIDATION' || err.code === 'BAD_RANGE') {
          return res.status(400).json({ success: false, message: err.message });
        }
        throw err;
      }
    } catch (error) {
      console.error('Error createBooking:', error);
      return res.status(500).json({ success: false, message: 'Error interno al crear reserva' });
    }
  }

  static async getMyBookings(req, res) {
    try {
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'No autenticado' });
      const bookings = await BookingRepository.getByUserId(user.id);
      const data = (bookings || []).map((b) => {
        let modalities = [];
        try {
          modalities = b.teacherModalitiesStr ? JSON.parse(b.teacherModalitiesStr) : [];
          if (!Array.isArray(modalities)) modalities = [];
        } catch (_) {
          modalities = b.teacherModality ? [b.teacherModality] : [];
        }
        let timeEnd = null;
        try {
          const dm = String(b.datetime || '').match(/^(\d{4}-\d{2}-\d{2})/);
          const ymd = dm ? dm[1] : '';
          if (ymd) {
            const schedRaw = b.teacherSchedulesStr != null ? b.teacherSchedulesStr : b.teacherschedulesstr;
            const day = parseYMDLocal(ymd);
            const dow = day ? day.getDay() : null;
            const slots = dow != null ? getSlotsForDow(parseSchedulesField(schedRaw), dow) : [];
            if (slots.length) {
              const tm = String(b.datetime || '').match(/[T\s](\d{1,2}):(\d{2})/);
              const hm = tm ? normalizeTimeHM(`${tm[1]}:${tm[2]}`) : null;
              let slot = hm ? slots.find((sl) => sl.start === hm) || null : null;
              if (!slot) slot = slots[0];
              if (slot && slot.end) timeEnd = slot.end;
            }
          }
        } catch (_) {
          /* ignore */
        }
        let bookingSubjects = [];
        try {
          bookingSubjects = b.bookingSubjects ? JSON.parse(b.bookingSubjects) : [];
          if (!Array.isArray(bookingSubjects)) bookingSubjects = [];
        } catch (_) {
          bookingSubjects = [];
        }
        return {
          id: b.id,
          teacherId: b.teacherId,
          datetime: b.datetime,
          timeEnd,
          sessionModality: b.sessionModality || null,
          message: b.message,
          bookingSubjects,
          createdAt: b.createdAt,
          teacherFirstName: b.teacherFirstName,
          teacherLastName: b.teacherLastName,
          teacherPhoto: b.teacherPhoto,
          teacherLocation: formatTeacherAddress(b) || b.teacherLocation,
          teacherDescription: b.teacherDescription,
          teacherCurriculum: b.teacherCurriculum,
          teacherModalities: modalities,
          teacherClassSize: b.teacherClassSize
        };
      });
      return res.json({ success: true, data });
    } catch (error) {
      console.error('Error getMyBookings:', error);
      return res.status(500).json({ success: false, message: 'Error interno' });
    }
  }

  static async getBookingById(req, res) {
    try {
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'No autenticado' });
      const id = parseInt(req.params.id, 10);
      if (!id) return res.status(400).json({ success: false, message: 'Id inválido' });
      const detail = await BookingService.getBookingDetailForUser(id, user.id);
      if (!detail) return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
      return res.json({ success: true, data: detail });
    } catch (error) {
      console.error('Error getBookingById:', error);
      return res.status(500).json({ success: false, message: 'Error interno' });
    }
  }

  static async deleteBooking(req, res) {
    try {
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'No autenticado' });
      const id = parseInt(req.params.id, 10);
      if (!id) return res.status(400).json({ success: false, message: 'Id inválido' });
      const out = await BookingService.deleteBookingForUser(id, user.id);
      if (!out.ok) {
        if (out.code === 'CANCEL_TOO_LATE') {
          return res.status(400).json({ success: false, message: out.message, code: out.code });
        }
        return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
      }
      return res.json({ success: true, message: 'Reserva eliminada' });
    } catch (error) {
      console.error('Error deleteBooking:', error);
      return res.status(500).json({ success: false, message: 'Error interno' });
    }
  }
}

module.exports = BookingController;
