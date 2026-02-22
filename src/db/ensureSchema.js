const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function ensureSchema() {
  const sqlPath = path.join(__dirname, 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
}

module.exports = { ensureSchema };
