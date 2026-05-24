import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { error } from '../utils/response.js';
import { pool } from '../config/db.js';

export const verifyToken = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.refreshToken) {
      // Depending on requirements, we might not want to accept refresh token here,
      // but only in the /refresh-token route. Assuming Bearer token is strictly required.
    }

    if (!token) {
      return error(res, 'Not authorized to access this route, no token provided', 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    const { rows } = await pool.query('SELECT id, name, email, role, is_verified FROM users WHERE id = $1', [decoded.id]);
    
    if (rows.length === 0) {
      return error(res, 'Not authorized, user not found', 401);
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return error(res, 'Not authorized to access this route, token failed', 401);
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return error(res, `User role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this route. Requires: ${roles.join(', ')}`, 403);
    }
    next();
  };
};
