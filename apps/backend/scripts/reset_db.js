require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetDb() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    await pool.query(schemaSql);
    console.log('Database schema reset successfully.');
  } catch (err) {
    console.error('Error resetting database:', err);
  } finally {
    pool.end();
  }
}

resetDb();
