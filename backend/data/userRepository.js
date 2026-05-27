const { dbAll, dbGet, dbRun } = require('../../Database/db');

class UserRepository {
  static async create({ firstName, lastName, email, passwordHash, role = 'user', color = null }) {
    const sql = `INSERT INTO users (firstName, lastName, email, passwordHash, role, color) VALUES (?, ?, ?, ?, ?, ?)`;
    const result = await dbRun(sql, [firstName, lastName || '', email, passwordHash, role, color]);
    return result.id;
  }

  static async getByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    return await dbGet(sql, [email]);
  }

  static async getById(id) {
    const sql = `SELECT id, firstName, lastName, email, role, color, createdAt FROM users WHERE id = ?`;
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

  static async updateRole(id, role) {
    const sql = `UPDATE users SET role = ? WHERE id = ?`;
    const res = await dbRun(sql, [role, id]);
    return res.changes > 0;
  }

  static async getAllUsers() {
    const sql = `SELECT id, firstName, lastName, email, role, color, createdAt FROM users ORDER BY createdAt DESC`;
    return await dbAll(sql, []);
  }

  static async getColorsByInitial(initial) {
    const sql = `SELECT color FROM users WHERE UPPER(SUBSTR(firstName,1,1)) = ? AND color IS NOT NULL`;
    const rows = await dbAll(sql, [initial.toUpperCase()]);
    return rows.map(r => r.color).filter(Boolean);
  }

  static async findUsers({ search = null, offset = 0, limit = 10, excludeId = null } = {}) {
    const where = [];
    const params = [];
    if (excludeId) {
      where.push('id <> ?');
      params.push(excludeId);
    }
    if (search) {
      where.push('(LOWER(firstName) LIKE ? OR LOWER(lastName) LIKE ? OR LOWER(email) LIKE ?)');
      const s = `%${String(search).toLowerCase()}%`;
      params.push(s, s, s);
    }
    const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';
    const sql = `SELECT id, firstName, lastName, email, role, color, createdAt FROM users ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    return await dbAll(sql, params);
  }

  static async countUsers({ search = null, excludeId = null } = {}) {
    const where = [];
    const params = [];
    if (excludeId) {
      where.push('id <> ?');
      params.push(excludeId);
    }
    if (search) {
      where.push('(LOWER(firstName) LIKE ? OR LOWER(lastName) LIKE ? OR LOWER(email) LIKE ?)');
      const s = `%${String(search).toLowerCase()}%`;
      params.push(s, s, s);
    }
    const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';
    const sql = `SELECT COUNT(*) as count FROM users ${whereSql}`;
    const row = await dbGet(sql, params);
    return row ? row.count || 0 : 0;
  }

  static async deleteUser(id) {
    const sql = `DELETE FROM users WHERE id = ?`;
    const res = await dbRun(sql, [id]);
    return res.changes > 0;
  }

  static async existsByEmail(email) {
    const user = await this.getByEmail(email);
    return !!user;
  }
}

module.exports = UserRepository;
