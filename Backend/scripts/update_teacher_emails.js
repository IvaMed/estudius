const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', '..', 'Database', 'estudius.db');

function normalizeForEmail(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '')
    .toLowerCase();
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error abriendo DB:', err.message);
    process.exit(1);
  }
});

db.serialize(async () => {
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all('SELECT id, firstName, lastName, email FROM teachers', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });

    for (const r of rows) {
      const f = normalizeForEmail(r.firstName || 'user');
      const l = normalizeForEmail(r.lastName || 'prof');
      let email = `${f}.${l}.fakeprof@gmail.com`;
      // Ensure unique if collisions: append id
      try {
        const existing = await new Promise((resolve, reject) => db.get('SELECT id FROM teachers WHERE LOWER(email)=?', [email.toLowerCase()], (err, row) => (err ? reject(err) : resolve(row))));
        if (existing && Number(existing.id) !== Number(r.id)) {
          email = `${f}.${l}.${r.id}.fakeprof@gmail.com`;
        }
      } catch (_) {
        email = `${f}.${l}.${r.id}.fakeprof@gmail.com`;
      }

      await new Promise((resolve, reject) => {
        db.run('UPDATE teachers SET email = ? WHERE id = ?', [email, r.id], function (err) {
          if (err) return reject(err);
          console.log(`Updated id=${r.id} -> ${email}`);
          resolve();
        });
      });
    }

    console.log('Email update completed.');
  } catch (err) {
    console.error('Error:', err.message || err);
  } finally {
    db.close();
  }
});
