const BookingService = require('../services/bookingService');
const BookingRepository = require('../data/bookingRepository');
const { parseSchedulesField, getSlotForCalendarDate } = require('../lib/scheduleUtils');

class BookingController {
  static async createBooking(req, res) {
    try {
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'No autenticado' });
      if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Los administradores no pueden agendar clases' });

      const { teacherId: tidBody, datetime, date, message, teacher_id, sessionModality } = req.body || {};
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
          message,
          sessionModality
        });
        return res.json({ success: true, message: 'Reserva creada', bookingId: out.bookingId, datetime: out.datetime });
      } catch (err) {
        if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
        if (err.code === 'FULL' || err.code === 'DUPLICATE' || err.code === 'USER_BUSY' || err.code === 'NO_CLASS' || err.code === 'SLOT_MISMATCH' || err.code === 'MODALITY_REQUIRED') {
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
            const slot = getSlotForCalendarDate(parseSchedulesField(schedRaw), ymd);
            if (slot && slot.end) timeEnd = slot.end;
          }
        } catch (_) {
          /* ignore */
        }
        return {
          id: b.id,
          teacherId: b.teacherId,
          datetime: b.datetime,
          timeEnd,
          sessionModality: b.sessionModality || null,
          message: b.message,
          createdAt: b.createdAt,
          teacherFirstName: b.teacherFirstName,
          teacherLastName: b.teacherLastName,
          teacherPhoto: b.teacherPhoto,
          teacherLocation: b.teacherLocation,
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
      if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Los administradores no gestionan reservas desde aquí' });
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
