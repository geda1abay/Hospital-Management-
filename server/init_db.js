import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDb() {
  try {
    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, '../neon/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Initializing database tables...');
    // Split by semicolon but be careful with functions/triggers
    // Actually, pg pool.query can execute multiple statements if they are separated by semicolons
    await pool.query(sql);

    console.log('Database initialization successful!');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err.message);
    process.exit(1);
  }
}

initDb();
