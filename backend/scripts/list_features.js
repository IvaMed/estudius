const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', '..', 'Database', 'estudius.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) { console.error('ERROR opening DB:', err); process.exit(1); }
});

db.all('SELECT id, type, name FROM feature_categories ORDER BY type, name', [], (err, rows) => {
  if (err) { console.error('ERROR:', err); db.close(); process.exit(1); }
  console.log('CATEGORIES:');
  console.log(rows);
  const next = () => {
    db.all('SELECT id, categoryId, name FROM feature_items ORDER BY name', [], (e2, items) => {
      if (e2) { console.error('ERROR items:', e2); db.close(); process.exit(1); }
      console.log('ITEMS:', items.length);
      console.log(items.slice(0,50));
      db.close();
    });
  };
  next();
});
