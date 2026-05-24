import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';

export const submitFranchiseApplication = async (req, res, next) => {
  try {
    const { applicant_name, email, phone, city, state, investment_budget, comments } = req.body;
    
    const { rows } = await pool.query(
      `INSERT INTO franchise_applications (applicant_name, email, phone, city, state, investment_budget, comments)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [applicant_name, email, phone, city, state, investment_budget, comments]
    );
    
    return success(res, rows[0], 'Franchise application submitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getFranchiseApplications = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM franchise_applications ORDER BY created_at DESC');
    return success(res, rows, 'Franchise applications retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateFranchiseApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const { rows } = await pool.query('UPDATE franchise_applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
    
    if (rows.length === 0) return error(res, 'Application not found', 404);
    return success(res, rows[0], 'Application status updated');
  } catch (err) {
    next(err);
  }
};
