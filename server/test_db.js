import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testConnection() {
  try {
    console.log('Testing connection to:', process.env.DATABASE_URL);
    const res = await pool.query('SELECT NOW()');
    console.log('Database Connection Successful:', res.rows[0]);

    const userRes = await pool.query('SELECT id, email, full_name FROM public.app_users WHERE email = $1', ['gedaabay@gmail.com']);
    if (userRes.rows.length > 0) {
      console.log('User gedaabay@gmail.com found:', userRes.rows[0]);
    } else {
      console.log('User gedaabay@gmail.com NOT found in database.');
    }

    const rolesRes = await pool.query('SELECT role FROM public.user_roles');
    console.log('Current roles in database:', rolesRes.rows.map(r => r.role));

    process.exit(0);
  } catch (err) {
    console.error('Database Connection Failed:', err.message);
    process.exit(1);
  }
}

testConnection();
