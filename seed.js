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
    console.log('Admin credentials missing.');
    return;
  }

  try {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    const dbModule = await import('./config/db.js');
    const pool = dbModule.pool;

    // Delete old admin user completely
    await pool.query(
      'DELETE FROM users WHERE email = $1',
      [email]
    );

    // Create fresh admin user
    await pool.query(`
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
    `, [email, hashedPassword]);

    console.log('✅ Fresh admin user created successfully.');

  } catch (err) {
    console.error('❌ Admin seed error:', err);
  }
};

seedAdmin();
