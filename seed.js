import { pool, initDb } from './src/config/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Please provide ADMIN_EMAIL and ADMIN_PASSWORD in .env');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await initDb();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await client.query(`
      INSERT INTO users (id, name, email, password_hash, role, is_verified)
      VALUES (gen_random_uuid(), 'System Admin', $1, $2, 'admin', true)
      ON CONFLICT (email) 
      DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', is_verified = true
      RETURNING *
    `, [email, hashedPassword]);
    
    console.log('Admin user seeded successfully!');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    client.release();
    pool.end();
  }
};

seedAdmin();
