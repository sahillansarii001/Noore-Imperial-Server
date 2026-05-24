import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { sendConsultationConfirmation } from '../services/email.service.js';
import { getPagination, getPaginationMetadata } from '../utils/pagination.js';

export const bookConsultation = async (req, res, next) => {
  try {
    const { expert_id, branch_id, type, date, time_slot, budget, notes } = req.body;

    // Optional: Validate expert is available on this day/slot
    
    const { rows } = await pool.query(
      `INSERT INTO consultations (customer_id, expert_id, branch_id, type, status, date, time_slot, budget, notes)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8) RETURNING *`,
      [req.user.id, expert_id, branch_id, type, date, time_slot, budget, notes]
    );

    const consultation = rows[0];

    // Get expert name for email
    const { rows: expertRows } = await pool.query('SELECT name FROM experts WHERE id = $1', [expert_id]);
    const expertName = expertRows.length > 0 ? expertRows[0].name : 'our expert';

    try {
      await sendConsultationConfirmation(req.user.email, req.user.name, date, expertName);
    } catch (err) {
      console.error('Failed to send consultation confirmation email:', err);
    }

    return success(res, consultation, 'Consultation booked successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getConsultations = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    let query = `
      SELECT c.*, e.name as expert_name, b.name as branch_name, u.name as customer_name
      FROM consultations c
      LEFT JOIN experts e ON c.expert_id = e.id
      LEFT JOIN branches b ON c.branch_id = b.id
      LEFT JOIN users u ON c.customer_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM consultations c';
    const params = [];
    const countParams = [];
    let paramIndex = 1;
    const whereClauses = [];

    if (req.user.role === 'customer') {
      whereClauses.push(`c.customer_id = $${paramIndex}`);
      params.push(req.user.id);
      countParams.push(req.user.id);
      paramIndex++;
    } else if (req.user.role === 'stylist') {
      // Find expert_id for this user
      const { rows: expertRows } = await pool.query('SELECT id FROM experts WHERE user_id = $1', [req.user.id]);
      if (expertRows.length > 0) {
        whereClauses.push(`c.expert_id = $${paramIndex}`);
        params.push(expertRows[0].id);
        countParams.push(expertRows[0].id);
        paramIndex++;
      } else {
        // Not an expert, return empty
        return success(res, [], 'No consultations found', 200, getPaginationMetadata(0, page, limit));
      }
    }

    if (status) {
      whereClauses.push(`c.status = $${paramIndex}`);
      params.push(status);
      countParams.push(status);
      paramIndex++;
    }

    if (whereClauses.length > 0) {
      const whereStr = ' WHERE ' + whereClauses.join(' AND ');
      query += whereStr;
      countQuery += whereStr;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows: countRows } = await pool.query(countQuery, countParams);
    const { rows } = await pool.query(query, params);

    const pagination = getPaginationMetadata(countRows[0].count, page, limit);

    return success(res, rows, 'Consultations retrieved successfully', 200, pagination);
  } catch (err) {
    next(err);
  }
};

export const getConsultationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    let query = `
      SELECT c.*, e.name as expert_name, b.name as branch_name, u.name as customer_name
      FROM consultations c
      LEFT JOIN experts e ON c.expert_id = e.id
      LEFT JOIN branches b ON c.branch_id = b.id
      LEFT JOIN users u ON c.customer_id = u.id
      WHERE c.id = $1
    `;
    const params = [id];
    
    if (req.user.role === 'customer') {
      query += ' AND c.customer_id = $2';
      params.push(req.user.id);
    }
    
    const { rows } = await pool.query(query, params);
    if (rows.length === 0) return error(res, 'Consultation not found or unauthorized', 404);
    
    return success(res, rows[0], 'Consultation retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateConsultationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const { rows } = await pool.query('UPDATE consultations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
    
    if (rows.length === 0) return error(res, 'Consultation not found', 404);
    return success(res, rows[0], 'Consultation status updated');
  } catch (err) {
    next(err);
  }
};

export const addConsultationNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    // In a real scenario, check if this stylist owns this consultation
    
    const { rows } = await pool.query('UPDATE consultations SET notes = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [notes, id]);
    
    if (rows.length === 0) return error(res, 'Consultation not found', 404);
    return success(res, rows[0], 'Consultation notes updated');
  } catch (err) {
    next(err);
  }
};
