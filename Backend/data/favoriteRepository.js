const { dbAll, dbGet, dbRun } = require('../../Database/db');

class FavoriteRepository {
  static async listTeacherIds(userId) {
    const rows = await dbAll(
      `SELECT teacherId FROM user_favorites WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );
    return (rows || []).map((r) => r.teacherId);
  }

  static async exists(userId, teacherId) {
    const row = await dbGet(
      `SELECT 1 AS x FROM user_favorites WHERE userId = ? AND teacherId = ?`,
      [userId, teacherId]
    );
    return !!row;
  }

  static async add(userId, teacherId) {
    await dbRun(`INSERT OR IGNORE INTO user_favorites (userId, teacherId) VALUES (?, ?)`, [userId, teacherId]);
    return true;
  }

  static async remove(userId, teacherId) {
    const r = await dbRun(`DELETE FROM user_favorites WHERE userId = ? AND teacherId = ?`, [userId, teacherId]);
    return r && r.changes > 0;
  }

  /** @returns {boolean} nuevo estado: true = favorito */
  static async toggle(userId, teacherId) {
    const ex = await this.exists(userId, teacherId);
    if (ex) {
      await this.remove(userId, teacherId);
      return false;
    }
    await this.add(userId, teacherId);
    return true;
  }

  /** Lista de profesores (filas normalizadas vía TeacherRepository.getById en capa superior) — aquí join mínimo */
  static async listTeachersRaw(userId) {
    return await dbAll(
      `SELECT t.id FROM user_favorites f
       JOIN teachers t ON t.id = f.teacherId
       WHERE f.userId = ?
       ORDER BY f.createdAt DESC`,
      [userId]
    );
  }
}

module.exports = FavoriteRepository;
