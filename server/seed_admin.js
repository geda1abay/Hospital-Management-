import pkg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
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

async function seedAdmin() {
  const email = 'gedaabay@gmail.com';
  const password = '15183510';
  const fullName = 'Geda Abay';
  const role = 'admin';

  try {
    console.log('Seeding admin user...');
    
    // Hash password
    const hash = await bcrypt.hash(password, 10);
    
    // Insert user
    const userResult = await pool.query(
      'INSERT INTO public.app_users (email, password_hash, full_name) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password_hash = $2, full_name = $3 RETURNING id',
      [email, hash, fullName]
    );
    const userId = userResult.rows[0].id;
    
    // Insert role
    await pool.query(
      'INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT (user_id, role) DO NOTHING',
      [userId, role]
    );
    
    // Insert profile
    await pool.query(
      'INSERT INTO public.profiles (user_id, full_name, email, role) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET full_name = $2, email = $3, role = $4',
      [userId, fullName, email, role]
    );
    
    console.log('Admin user seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err.message);
    process.exit(1);
  }
}

seedAdmin();
