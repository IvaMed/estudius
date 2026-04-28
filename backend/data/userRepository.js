const { dbAll, dbGet, dbRun } = require('../database/db');

class UserRepository {
  static async create({ firstName, lastName, email, passwordHash, role = 'user' }) {
    const sql = `INSERT INTO users (firstName, lastName, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)`;
    const result = await dbRun(sql, [firstName, lastName || '', email, passwordHash, role]);
    return result.id;
  }

  static async getByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    return await dbGet(sql, [email]);
  }

  static async getById(id) {
    const sql = `SELECT id, firstName, lastName, email, role, createdAt FROM users WHERE id = ?`;
    return await dbGet(sql, [id]);
  }

  static async getByIdWithHash(id) {
    const sql = `SELECT * FROM users WHERE id = ?`;
    return await dbGet(sql, [id]);
  }

  static async updatePassword(id, passwordHash) {
    const sql = `UPDATE users SET passwordHash = ? WHERE id = ?`;
    const res = await dbRun(sql, [passwordHash, id]);
    return res.changes > 0;
  }

  static async existsByEmail(email) {
    const user = await this.getByEmail(email);
    return !!user;
  }
}

module.exports = UserRepository;
