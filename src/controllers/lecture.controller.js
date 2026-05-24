import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';

export const getCourseLectures = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // Check enrollment
    let isEnrolled = false;
    if (req.user.role === 'customer' || req.user.role === 'student') {
      const { rows: checkRows } = await pool.query('SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2', [req.user.id, courseId]);
      if (checkRows.length > 0) isEnrolled = true;
    } else {
      isEnrolled = true; // faculty, admin
    }

    if (!isEnrolled) return error(res, 'Not enrolled in this course', 403);

    const { rows } = await pool.query('SELECT * FROM lectures WHERE course_id = $1 ORDER BY order_index ASC', [courseId]);
    return success(res, rows, 'Lectures retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getLectureById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { rows: lectureRows } = await pool.query('SELECT * FROM lectures WHERE id = $1', [id]);
    if (lectureRows.length === 0) return error(res, 'Lecture not found', 404);
    
    const lecture = lectureRows[0];

    // Check enrollment
    let isEnrolled = false;
    if (req.user.role === 'customer' || req.user.role === 'student') {
      const { rows: checkRows } = await pool.query('SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2', [req.user.id, lecture.course_id]);
      if (checkRows.length > 0) isEnrolled = true;
    } else {
      isEnrolled = true;
    }

    if (!isEnrolled) return error(res, 'Not enrolled in this course', 403);

    return success(res, lecture, 'Lecture retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createLecture = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, video_url, pdf_url, duration_minutes, order_index } = req.body;
    
    const { rows } = await pool.query(
      `INSERT INTO lectures (course_id, title, video_url, pdf_url, duration_minutes, order_index)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [courseId, title, video_url, pdf_url, duration_minutes, order_index || 0]
    );
    
    return success(res, rows[0], 'Lecture created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateLecture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, video_url, pdf_url, duration_minutes, order_index } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE lectures 
       SET title = COALESCE($1, title), 
           video_url = COALESCE($2, video_url), 
           pdf_url = COALESCE($3, pdf_url), 
           duration_minutes = COALESCE($4, duration_minutes), 
           order_index = COALESCE($5, order_index)
       WHERE id = $6 RETURNING *`,
      [title, video_url, pdf_url, duration_minutes, order_index, id]
    );
    
    if (rows.length === 0) return error(res, 'Lecture not found', 404);
    return success(res, rows[0], 'Lecture updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteLecture = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { rowCount } = await pool.query('DELETE FROM lectures WHERE id = $1', [id]);
    
    if (rowCount === 0) return error(res, 'Lecture not found', 404);
    return success(res, null, 'Lecture deleted successfully');
  } catch (err) {
    next(err);
  }
};
