const FavoriteRepository = require('../../Backend/data/favoriteRepository');
const TeacherRepository = require('../../Backend/data/teacherRepository');

class FavoriteController {
  static async listIds(req, res) {
    try {
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'No autenticado' });
      const ids = await FavoriteRepository.listTeacherIds(user.id);
      return res.json({ success: true, data: ids });
    } catch (error) {
      console.error('listIds favorites:', error);
      return res.status(500).json({ success: false, message: 'No se pudieron obtener los favoritos' });
    }
  }

  static async listTeachers(req, res) {
    try {
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'No autenticado' });
      const rows = await FavoriteRepository.listTeachersRaw(user.id);
      const teachers = [];
      for (const row of rows || []) {
        const t = await TeacherRepository.getById(row.id);
        if (t) teachers.push(t);
      }
      return res.json({ success: true, data: teachers });
    } catch (error) {
      console.error('listTeachers favorites:', error);
      return res.status(500).json({ success: false, message: 'No se pudieron obtener los profesores favoritos' });
    }
  }

  static async toggle(req, res) {
    try {
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'No autenticado' });
      const teacherId = parseInt(req.params.teacherId, 10);
      if (!teacherId) return res.status(400).json({ success: false, message: 'teacherId inválido' });

      const teacher = await TeacherRepository.getById(teacherId);
      if (!teacher) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });

      const isFavorite = await FavoriteRepository.toggle(user.id, teacherId);
      return res.json({ success: true, isFavorite });
    } catch (error) {
      console.error('toggle favorite:', error);
      return res.status(500).json({ success: false, message: 'No se pudo actualizar el favorito' });
    }
  }

  /** POST /api/favorites/toggle { teacherId } — misma lógica que toggle por URL (más compatible con proxies) */
  static async toggleFromBody(req, res) {
    try {
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'No autenticado' });
      const raw = req.body && (req.body.teacherId ?? req.body.id ?? req.body.teacher_id);
      const teacherId = raw === undefined || raw === null || raw === '' ? NaN : parseInt(String(raw).trim(), 10);
      if (!teacherId) return res.status(400).json({ success: false, message: 'Falta teacherId en el cuerpo' });

      const teacher = await TeacherRepository.getById(teacherId);
      if (!teacher) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });

      const isFavorite = await FavoriteRepository.toggle(user.id, teacherId);
      return res.json({ success: true, isFavorite });
    } catch (error) {
      console.error('toggleFromBody favorite:', error);
      return res.status(500).json({ success: false, message: 'No se pudo actualizar el favorito' });
    }
  }

  static async remove(req, res) {
    try {
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'No autenticado' });
      const teacherId = parseInt(req.params.teacherId, 10);
      if (!teacherId) return res.status(400).json({ success: false, message: 'teacherId inválido' });
      await FavoriteRepository.remove(user.id, teacherId);
      return res.json({ success: true });
    } catch (error) {
      console.error('remove favorite:', error);
      return res.status(500).json({ success: false, message: 'No se pudo quitar el favorito' });
    }
  }

  /** DELETE /api/favorites?teacherId= */
  static async removeByQuery(req, res) {
    try {
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'No autenticado' });
      const teacherId = parseInt(req.query && req.query.teacherId, 10);
      if (!teacherId) return res.status(400).json({ success: false, message: 'Falta teacherId' });
      await FavoriteRepository.remove(user.id, teacherId);
      return res.json({ success: true });
    } catch (error) {
      console.error('removeByQuery favorite:', error);
      return res.status(500).json({ success: false, message: 'No se pudo quitar el favorito' });
    }
  }
}

module.exports = FavoriteController;
