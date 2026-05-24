import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';

export const enrollInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // In a real scenario, check if the course exists and is paid.
    // Assuming payment is handled externally and this just creates the enrollment.
    
    const { rows } = await pool.query(
      `INSERT INTO enrollments (student_id, course_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id, course_id) DO NOTHING
       RETURNING *`,
      [req.user.id, courseId]
    );

    if (rows.length === 0) {
      return error(res, 'Already enrolled in this course', 400);
    }

    return success(res, rows[0], 'Successfully enrolled in course', 201);
  } catch (err) {
    next(err);
  }
};

export const getMyEnrollments = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, c.title as course_title, c.slug as course_slug, c.thumbnail_url 
       FROM enrollments e 
       JOIN courses c ON e.course_id = c.id 
       WHERE e.student_id = $1 
       ORDER BY e.enrolled_at DESC`,
      [req.user.id]
    );
    
    return success(res, rows, 'Enrollments retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params; // enrollment_id
    const { progress } = req.body; // percentage 0-100
    
    if (progress < 0 || progress > 100) {
      return error(res, 'Progress must be between 0 and 100', 400);
    }

    let query = 'UPDATE enrollments SET progress = $1';
    const params = [progress, id, req.user.id];
    
    if (progress === 100) {
      query += ', completed_at = COALESCE(completed_at, NOW())';
    }
    
    query += ' WHERE id = $2 AND student_id = $3 RETURNING *';
    
    const { rows } = await pool.query(query, params);
    
    if (rows.length === 0) return error(res, 'Enrollment not found or unauthorized', 404);
    return success(res, rows[0], 'Progress updated successfully');
  } catch (err) {
    next(err);
  }
};
