const BookingRepository = require('../data/bookingRepository');
const TeacherRepository = require('../data/teacherRepository');

class BookingController {
  static async createBooking(req, res) {
    try {
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'No autenticado' });
      // No permitir que admins reserven desde la interfaz de usuario
      if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Los administradores no pueden agendar clases' });

      const { teacherId, datetime, message } = req.body || {};
      if (!teacherId || !datetime) return res.status(400).json({ success: false, message: 'Faltan datos (teacherId, datetime)' });

      // Verificar existencia de profesor
      const teacher = await TeacherRepository.getById(parseInt(teacherId));
      if (!teacher) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });

      const bookingId = await BookingRepository.create({ userId: user.id, teacherId: parseInt(teacherId), datetime, message });
      return res.json({ success: true, message: 'Reserva creada', bookingId });
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
      return res.json({ success: true, data: bookings });
    } catch (error) {
      console.error('Error getMyBookings:', error);
      return res.status(500).json({ success: false, message: 'Error interno' });
    }
  }
}

module.exports = BookingController;
