const fs = require('fs');
const path = require('path');
const { pool } = require('../db/pool');

async function main() {
  const sqlPath = path.join(__dirname, '..', 'db', 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
  console.log('Database initialized');
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
