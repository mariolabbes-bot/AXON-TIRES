const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDB() {
  try {
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Connecting to Neon database...');
    console.log('Executing schema.sql...');
    await pool.query(schemaSQL);
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

initDB();
