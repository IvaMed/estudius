const { dbAll, dbGet, dbRun } = require('../database/db');

class BookingRepository {
  static async create({ userId, teacherId, datetime, message }) {
    const sql = `INSERT INTO bookings (userId, teacherId, datetime, message) VALUES (?, ?, ?, ?)`;
    const result = await dbRun(sql, [userId, teacherId, datetime, message || null]);
    return result.id;
  }

  static async getByUserId(userId) {
    const sql = `SELECT b.*, t.firstName as teacherFirstName, t.lastName as teacherLastName FROM bookings b JOIN teachers t ON t.id = b.teacherId WHERE b.userId = ? ORDER BY b.createdAt DESC`;
    return await dbAll(sql, [userId]);
  }

  static async getById(id) {
    const sql = `SELECT * FROM bookings WHERE id = ?`;
    return await dbGet(sql, [id]);
  }
}

module.exports = BookingRepository;
