const { dbAll, dbGet, dbRun } = require('../../Database/db');

function inferSubjectIcon(name = '') {
  const value = String(name || '').toLowerCase();
  if (value.includes('matem') || value.includes('álgebra') || value.includes('algebra') || value.includes('estad')) return '📐';
  if (value.includes('fís') || value.includes('fis') || value.includes('mecán') || value.includes('mecan') || value.includes('electr')) return '⚛️';
  if (value.includes('quím') || value.includes('quim') || value.includes('biolog')) return '🧪';
  if (value.includes('hist') || value.includes('geograf') || value.includes('cívica') || value.includes('civica') || value.includes('filos') || value.includes('psic') || value.includes('econom') || value.includes('derecho')) return '📚';
  if (value.includes('program') || value.includes('algorit') || value.includes('base de datos') || value.includes('desarrollo web') || value.includes('ciber')) return '💻';
  if (value.includes('inglés') || value.includes('ingles') || value.includes('franc') || value.includes('alem') || value.includes('ital') || value.includes('portugu') || value.includes('japon') || value.includes('chino')) return '🗣️';
  if (value.includes('dibujo') || value.includes('pintura') || value.includes('música') || value.includes('musica')) return '🎨';
  if (value.includes('marketing') || value.includes('admin')) return '📈';
  return '📘';
}

class FeaturesController {
  // List categories and their items by type (subject|modality)
  static async list(req, res) {
    try {
      const type = String(req.query.type || 'subject');
      const categories = await dbAll('SELECT id, name, icon FROM feature_categories WHERE type = ? ORDER BY name', [type]);
      const result = [];
      for (const c of categories) {
        const items = await dbAll('SELECT id, name, icon, position FROM feature_items WHERE categoryId = ? ORDER BY position ASC, name ASC', [c.id]);
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
      const { type, name, icon } = req.body || {};
      if (!type || !name) return res.status(400).json({ success: false, message: 'type y name son requeridos' });
      const slug = String(name).toLowerCase().replace(/\s+/g, '-');
      const existing = await dbGet('SELECT id FROM feature_categories WHERE type = ? AND name = ?', [type, name]);
      if (existing) return res.status(400).json({ success: false, message: 'Categoría ya existe' });
      const r = await dbRun('INSERT INTO feature_categories (type, name, slug, icon) VALUES (?, ?, ?, ?)', [type, name, slug, icon || '📁']);
      return res.json({ success: true, category: { id: r.id, type, name, icon: icon || '📁' } });
    } catch (err) {
      console.error('Error crear categoría:', err);
      return res.status(500).json({ success: false, message: 'Error creando categoría' });
    }
  }

  static async updateCategory(req, res) {
    try {
      const id = Number(req.params.id);
      const { name, icon } = req.body || {};
      if (!id || !name) return res.status(400).json({ success: false, message: 'id y name son requeridos' });
      const slug = String(name).toLowerCase().replace(/\s+/g, '-');
      const r = await dbRun('UPDATE feature_categories SET name = ?, slug = ?, icon = COALESCE(?, icon) WHERE id = ?', [name, slug, icon || null, id]);
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
      const { categoryId, name, icon } = req.body || {};
      if (!categoryId || !name) return res.status(400).json({ success: false, message: 'categoryId y name son requeridos' });
      const slug = String(name).toLowerCase().replace(/\s+/g, '-');
      const finalIcon = (icon && String(icon).trim()) || inferSubjectIcon(name);
      const r = await dbRun('INSERT INTO feature_items (categoryId, name, slug, icon) VALUES (?, ?, ?, ?)', [categoryId, name, slug, finalIcon]);
      return res.json({ success: true, item: { id: r.id, categoryId, name, icon: finalIcon } });
    } catch (err) {
      console.error('Error createItem:', err);
      return res.status(500).json({ success: false, message: 'Error creando item' });
    }
  }

  static async updateItem(req, res) {
    try {
      const id = Number(req.params.id);
      const { name, categoryId, icon } = req.body || {};
      if (!id || !name) return res.status(400).json({ success: false, message: 'id y name son requeridos' });
      const slug = String(name).toLowerCase().replace(/\s+/g, '-');
      const finalIcon = (icon && String(icon).trim()) || inferSubjectIcon(name);
      const r = await dbRun('UPDATE feature_items SET name = ?, slug = ?, categoryId = ?, icon = ? WHERE id = ?', [name, slug, categoryId || null, finalIcon, id]);
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
