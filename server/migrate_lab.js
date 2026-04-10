import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Starting migration...');
    
    // Check if role exists
    const roleCheck = await pool.query("SELECT n.nspname as schema, t.typname as type FROM pg_type t LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'app_role'");
    
    if (roleCheck.rows.length > 0) {
      console.log('Adding database role value...');
      try {
        await pool.query("ALTER TYPE public.app_role ADD VALUE 'laboratory_technician'");
      } catch (e) {
        if (e.code === '42710') {
           console.log('Role already exists, skipping ADD VALUE');
        } else {
           throw e;
        }
      }
    }

    console.log('Creating lab_requests table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.lab_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
        doctor_id UUID NOT NULL REFERENCES public.app_users(id),
        test_description TEXT NOT NULL,
        cost_birr NUMERIC(10, 2) DEFAULT 0,
        result_note TEXT,
        payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    console.log('Adding triggers...');
    await pool.query(`
      DROP TRIGGER IF EXISTS update_lab_requests_updated_at ON public.lab_requests;
      CREATE TRIGGER update_lab_requests_updated_at
      BEFORE UPDATE ON public.lab_requests
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    `);

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
