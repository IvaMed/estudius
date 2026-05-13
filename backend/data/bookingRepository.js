const { dbAll, dbGet, dbRun } = require('../database/db');
const { normalizeBookingInstant } = require('../lib/scheduleUtils');

class BookingRepository {
  static async create({ userId, teacherId, datetime, message, sessionModality = null }) {
    const sql = `INSERT INTO bookings (userId, teacherId, datetime, message, sessionModality) VALUES (?, ?, ?, ?, ?)`;
    const result = await dbRun(sql, [userId, teacherId, datetime, message || null, sessionModality || null]);
    return result.id;
  }

  static async getByUserId(userId) {
    const sql = `
      SELECT b.*,
        t.firstName AS teacherFirstName,
        t.lastName AS teacherLastName,
        t.photo AS teacherPhoto,
        t.location AS teacherLocation,
        t.modality AS teacherModality,
        t.modalities AS teacherModalitiesStr,
        t.classSize AS teacherClassSize,
        t.schedules AS teacherSchedulesStr
      FROM bookings b
      JOIN teachers t ON t.id = b.teacherId
      WHERE b.userId = ?
      ORDER BY b.datetime ASC, b.createdAt DESC
    `;
    return await dbAll(sql, [userId]);
  }

  static async getById(id) {
    const sql = `SELECT * FROM bookings WHERE id = ?`;
    return await dbGet(sql, [id]);
  }

  /** Detalle de una reserva del usuario con datos del profesor (contacto para modalidad virtual) */
  static async getByIdForUserWithTeacher(bookingId, userId) {
    const sql = `
      SELECT b.*,
        t.firstName AS teacherFirstName,
        t.lastName AS teacherLastName,
        t.email AS teacherEmail,
        t.phone AS teacherPhone,
        t.photo AS teacherPhoto,
        t.location AS teacherLocation,
        t.modality AS teacherModality,
        t.modalities AS teacherModalitiesStr,
        t.classSize AS teacherClassSize,
        t.schedules AS teacherSchedulesStr
      FROM bookings b
      JOIN teachers t ON t.id = b.teacherId
      WHERE b.id = ? AND b.userId = ?
    `;
    return await dbGet(sql, [bookingId, userId]);
  }

  static async countByTeacherAndDatetime(teacherId, datetime) {
    const target = normalizeBookingInstant(datetime);
    if (!target) return 0;
    const rows = await dbAll(`SELECT datetime FROM bookings WHERE teacherId = ?`, [teacherId]);
    return (rows || []).filter((r) => normalizeBookingInstant(r.datetime) === target).length;
  }

  static async countForUserTeacherDatetime(userId, teacherId, datetime) {
    const target = normalizeBookingInstant(datetime);
    if (!target) return 0;
    const rows = await dbAll(
      `SELECT datetime FROM bookings WHERE userId = ? AND teacherId = ?`,
      [userId, teacherId]
    );
    return (rows || []).filter((r) => normalizeBookingInstant(r.datetime) === target).length;
  }

  /** Reservas del usuario en el mismo instante canónico (cualquier profesor). */
  static async countForUserAtDatetime(userId, datetime) {
    const target = normalizeBookingInstant(datetime);
    if (!target) return 0;
    const rows = await dbAll(`SELECT datetime FROM bookings WHERE userId = ?`, [userId]);
    return (rows || []).filter((r) => normalizeBookingInstant(r.datetime) === target).length;
  }

  /**
   * Conteo de reservas por slot (instante normalizado) en un rango de fechas calendario.
   * @returns {Record<string, number>} map datetime normalizado -> count
   */
  static async countByTeacherDatetimeRange(teacherId, fromYmd, toYmd) {
    const rows = await dbAll(
      `SELECT datetime FROM bookings
       WHERE teacherId = ?
         AND substr(trim(replace(datetime, 'T', ' ')), 1, 10) >= ?
         AND substr(trim(replace(datetime, 'T', ' ')), 1, 10) <= ?`,
      [teacherId, fromYmd, toYmd]
    );
    const map = {};
    for (const r of rows || []) {
      const nk = normalizeBookingInstant(r.datetime);
      if (!nk) continue;
      map[nk] = (map[nk] || 0) + 1;
    }
    return map;
  }

  static async deleteByIdForUser(bookingId, userId) {
    const result = await dbRun(`DELETE FROM bookings WHERE id = ? AND userId = ?`, [bookingId, userId]);
    return result && result.changes > 0;
  }
}

module.exports = BookingRepository;
