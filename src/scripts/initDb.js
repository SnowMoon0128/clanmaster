const { pool } = require('../db/pool');
const { ensureSchema } = require('../db/ensureSchema');

async function main() {
  await ensureSchema();
  console.log('Database initialized');
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
