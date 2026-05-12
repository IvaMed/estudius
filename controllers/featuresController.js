const { dbAll, dbGet, dbRun } = require('../database/db');

class FeaturesController {
  // List categories and their items by type (subject|modality)
  static async list(req, res) {
    try {
      const type = String(req.query.type || 'subject');
      const categories = await dbAll('SELECT id, name FROM feature_categories WHERE type = ? ORDER BY name', [type]);
      const result = [];
      for (const c of categories) {
        const items = await dbAll('SELECT id, name, position FROM feature_items WHERE categoryId = ? ORDER BY position ASC, name ASC', [c.id]);
        result.push({ id: c.id, name: c.name, items });
      }
      return res.json({ success: true, categories: result });
    } catch (err) {
      console.error('Error listing features:', err);
      return res.status(500).json({ success: false, message: 'Error listando características' });
    }
  }

  static async createCategory(req, res) {
    try {
      const { type, name } = req.body || {};
      if (!type || !name) return res.status(400).json({ success: false, message: 'type y name son requeridos' });
      const slug = String(name).toLowerCase().replace(/\s+/g, '-');
      const existing = await dbGet('SELECT id FROM feature_categories WHERE type = ? AND name = ?', [type, name]);
      if (existing) return res.status(400).json({ success: false, message: 'Categoría ya existe' });
      const r = await dbRun('INSERT INTO feature_categories (type, name, slug) VALUES (?, ?, ?)', [type, name, slug]);
      return res.json({ success: true, category: { id: r.id, type, name } });
    } catch (err) {
      console.error('Error crear categoría:', err);
      return res.status(500).json({ success: false, message: 'Error creando categoría' });
    }
  }

  static async updateCategory(req, res) {
    try {
      const id = Number(req.params.id);
      const { name } = req.body || {};
      if (!id || !name) return res.status(400).json({ success: false, message: 'id y name son requeridos' });
      const slug = String(name).toLowerCase().replace(/\s+/g, '-');
      const r = await dbRun('UPDATE feature_categories SET name = ?, slug = ? WHERE id = ?', [name, slug, id]);
      return res.json({ success: true, updated: r.changes > 0 });
    } catch (err) {
      console.error('Error updateCategory:', err);
      return res.status(500).json({ success: false, message: 'Error actualizando categoría' });
    }
  }

  static async deleteCategory(req, res) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, message: 'id requerido' });
      const r = await dbRun('DELETE FROM feature_categories WHERE id = ?', [id]);
      return res.json({ success: true, deleted: r.changes > 0 });
    } catch (err) {
      console.error('Error deleteCategory:', err);
      return res.status(500).json({ success: false, message: 'Error eliminando categoría' });
    }
  }

  static async createItem(req, res) {
    try {
      const { categoryId, name } = req.body || {};
      if (!categoryId || !name) return res.status(400).json({ success: false, message: 'categoryId y name son requeridos' });
      const slug = String(name).toLowerCase().replace(/\s+/g, '-');
      const r = await dbRun('INSERT INTO feature_items (categoryId, name, slug) VALUES (?, ?, ?)', [categoryId, name, slug]);
      return res.json({ success: true, item: { id: r.id, categoryId, name } });
    } catch (err) {
      console.error('Error createItem:', err);
      return res.status(500).json({ success: false, message: 'Error creando item' });
    }
  }

  static async updateItem(req, res) {
    try {
      const id = Number(req.params.id);
      const { name, categoryId } = req.body || {};
      if (!id || !name) return res.status(400).json({ success: false, message: 'id y name son requeridos' });
      const slug = String(name).toLowerCase().replace(/\s+/g, '-');
      const r = await dbRun('UPDATE feature_items SET name = ?, slug = ?, categoryId = ? WHERE id = ?', [name, slug, categoryId || null, id]);
      return res.json({ success: true, updated: r.changes > 0 });
    } catch (err) {
      console.error('Error updateItem:', err);
      return res.status(500).json({ success: false, message: 'Error actualizando item' });
    }
  }

  static async deleteItem(req, res) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, message: 'id requerido' });
      const r = await dbRun('DELETE FROM feature_items WHERE id = ?', [id]);
      return res.json({ success: true, deleted: r.changes > 0 });
    } catch (err) {
      console.error('Error deleteItem:', err);
      return res.status(500).json({ success: false, message: 'Error eliminando item' });
    }
  }
}

module.exports = FeaturesController;
