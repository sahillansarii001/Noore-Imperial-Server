import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';
import bcrypt from 'bcrypt';
import { getPagination, getPaginationMetadata } from '../utils/pagination.js';

export const getMe = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, role, is_verified, loyalty_points, avatar_url, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return error(res, 'User not found', 404);
    return success(res, rows[0], 'User profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { name, phone, avatar_url } = req.body;
    const { rows } = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), avatar_url = COALESCE($3, avatar_url), updated_at = NOW() WHERE id = $4 RETURNING id, name, email, phone, role, avatar_url, updated_at',
      [name, phone, avatar_url, req.user.id]
    );
    return success(res, rows[0], 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    
    const isMatch = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!isMatch) return error(res, 'Incorrect current password', 400);

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, req.user.id]);
    return success(res, null, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
};

export const getMyAddresses = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC', [req.user.id]);
    return success(res, rows, 'Addresses retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const { label, street, city, state, pincode, is_default } = req.body;

    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    const { rows } = await pool.query(
      'INSERT INTO addresses (user_id, label, street, city, state, pincode, is_default) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, label, street, city, state, pincode, is_default || false]
    );

    return success(res, rows[0], 'Address added successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, street, city, state, pincode, is_default } = req.body;

    const { rows: addressCheck } = await pool.query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (addressCheck.length === 0) return error(res, 'Address not found or unauthorized', 404);

    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1 AND id != $2', [req.user.id, id]);
    }

    const { rows } = await pool.query(
      'UPDATE addresses SET label = COALESCE($1, label), street = COALESCE($2, street), city = COALESCE($3, city), state = COALESCE($4, state), pincode = COALESCE($5, pincode), is_default = COALESCE($6, is_default) WHERE id = $7 RETURNING *',
      [label, street, city, state, pincode, is_default, id]
    );

    return success(res, rows[0], 'Address updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    
    if (rowCount === 0) return error(res, 'Address not found or unauthorized', 404);
    return success(res, null, 'Address deleted successfully');
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const roleFilter = req.query.role;

    let query = 'SELECT id, name, email, phone, role, is_verified, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) FROM users';
    const params = [];
    const countParams = [];

    if (roleFilter) {
      query += ' WHERE role = $1';
      countQuery += ' WHERE role = $1';
      params.push(roleFilter);
      countParams.push(roleFilter);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows: totalRows } = await pool.query(countQuery, countParams);
    const totalItems = totalRows[0].count;

    const { rows } = await pool.query(query, params);
    const pagination = getPaginationMetadata(totalItems, page, limit);

    return success(res, rows, 'Users retrieved successfully', 200, pagination);
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT id, name, email, phone, role, is_verified, loyalty_points, avatar_url, created_at FROM users WHERE id = $1', [id]);
    
    if (rows.length === 0) return error(res, 'User not found', 404);
    return success(res, rows[0], 'User retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const { rows } = await pool.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role', [role, id]);
    
    if (rows.length === 0) return error(res, 'User not found', 404);
    return success(res, rows[0], 'User role updated successfully');
  } catch (err) {
    next(err);
  }
};
