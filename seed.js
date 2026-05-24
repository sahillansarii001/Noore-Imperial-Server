import { pool, initDb } from './src/config/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const seedAdminUser = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('Admin credentials not provided in environment variables.');
    return;
  }

  try {
    const bcrypt = await import('bcrypt');

    // Hash password
    const hashedPassword = await bcrypt.default.hash(password, 10);

    // Insert or update admin user
    await (await import('./config/db.js')).pool.query(`
      INSERT INTO users (
        id,
        name,
        email,
        password_hash,
        role,
        is_verified
      )
      VALUES (
        gen_random_uuid(),
        'System Admin',
        $1,
        $2,
        'admin',
        true
      )
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        is_verified = EXCLUDED.is_verified
    `, [email, hashedPassword]);

    console.log('✅ Admin user verified/updated successfully.');

  } catch (err) {
    console.error('❌ Admin seed error:', err.message);
  }
};

seedAdmin();
