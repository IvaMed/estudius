const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', '..', 'Database', 'estudius.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('ERROR opening DB:', err);
    process.exit(1);
  }
});

const queryDups = `SELECT UPPER(SUBSTR(firstName,1,1)) AS initial, color, COUNT(*) AS cnt FROM users WHERE color IS NOT NULL GROUP BY initial,color HAVING cnt>1 ORDER BY initial`;
const queryAll = `SELECT id, firstName, lastName, email, color FROM users ORDER BY createdAt DESC`;

db.all(queryDups, [], (err, dups) => {
  if (err) {
    console.error('ERROR running dup query:', err);
    db.close();
    process.exit(1);
  }
  console.log('DUPLICATES:', JSON.stringify(dups, null, 2));
  db.all(queryAll, [], (err2, all) => {
    if (err2) {
      console.error('ERROR running all users query:', err2);
      db.close();
      process.exit(1);
    }
    console.log('ALL_USERS:', JSON.stringify(all, null, 2));
    db.close();
  });
});
