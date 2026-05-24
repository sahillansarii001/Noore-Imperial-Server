import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { generateOTP, verifyOTP } from '../services/otp.service.js';
import { sendWelcomeEmail, sendOTPEmail, sendPasswordReset } from '../services/email.service.js';
import { env } from '../config/env.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const { rows: existingUser } = await pool.query('SELECT id FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (existingUser.length > 0) {
      return error(res, 'User with email or phone already exists', 400);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const { rows: newUser } = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, role, is_verified',
      [name, email, phone, passwordHash]
    );

    const user = newUser[0];
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }

    return success(res, { user, accessToken }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await pool.query('SELECT id, name, email, role, is_verified, password_hash FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return error(res, 'Invalid email or password', 401);
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return error(res, 'Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    delete user.password_hash;
    return success(res, { user, accessToken }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    });
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return error(res, 'No refresh token provided', 401);

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const accessToken = generateAccessToken(decoded.id);

    return success(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    return error(res, 'Invalid or expired refresh token', 401);
  }
};

export const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const otp = generateOTP(email);
    await sendOTPEmail(email, otp);
    return success(res, null, 'OTP sent successfully');
  } catch (err) {
    next(err);
  }
};

export const verifyOtpController = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const isValid = verifyOTP(email, otp);

    if (!isValid) return error(res, 'Invalid or expired OTP', 400);

    await pool.query('UPDATE users SET is_verified = true WHERE email = $1', [email]);
    return success(res, null, 'Account verified successfully');
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return error(res, 'User not found', 404);

    const user = rows[0];
    const resetToken = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendPasswordReset(email, resetLink);
    return success(res, null, 'Password reset link sent to email');
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, decoded.id]);
    return success(res, null, 'Password reset successfully');
  } catch (err) {
    return error(res, 'Invalid or expired token', 400);
  }
};
