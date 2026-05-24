import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';

export const getCourseAssignments = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    let isEnrolled = false;
    if (req.user.role === 'customer' || req.user.role === 'student') {
      const { rows: checkRows } = await pool.query('SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2', [req.user.id, courseId]);
      if (checkRows.length > 0) isEnrolled = true;
    } else {
      isEnrolled = true;
    }

    if (!isEnrolled) return error(res, 'Not enrolled in this course', 403);

    const { rows } = await pool.query('SELECT * FROM assignments WHERE course_id = $1 ORDER BY created_at DESC', [courseId]);
    return success(res, rows, 'Assignments retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createAssignment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { lecture_id, title, description, due_date } = req.body;
    
    const { rows } = await pool.query(
      `INSERT INTO assignments (course_id, lecture_id, title, description, due_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [courseId, lecture_id || null, title, description, due_date]
    );
    
    return success(res, rows[0], 'Assignment created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const submitAssignment = async (req, res, next) => {
  try {
    const { id } = req.params; // assignment_id
    
    if (!req.file) return error(res, 'File is required', 400);

    // Verify enrollment
    const { rows: assignmentRows } = await pool.query('SELECT course_id FROM assignments WHERE id = $1', [id]);
    if (assignmentRows.length === 0) return error(res, 'Assignment not found', 404);
    
    const courseId = assignmentRows[0].course_id;

    const { rows: checkRows } = await pool.query('SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2', [req.user.id, courseId]);
    if (checkRows.length === 0) return error(res, 'Not enrolled in this course', 403);

    const file_url = req.file.path;

    const { rows } = await pool.query(
      `INSERT INTO submissions (assignment_id, student_id, file_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET file_url = EXCLUDED.file_url, submitted_at = NOW()
       RETURNING *`,
      [id, req.user.id, file_url]
    );
    
    return success(res, rows[0], 'Assignment submitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getSubmissions = async (req, res, next) => {
  try {
    const { id } = req.params; // assignment_id
    
    const { rows } = await pool.query(
      `SELECT s.*, u.name as student_name, u.email 
       FROM submissions s 
       JOIN users u ON s.student_id = u.id 
       WHERE s.assignment_id = $1 
       ORDER BY s.submitted_at DESC`,
      [id]
    );
    
    return success(res, rows, 'Submissions retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const gradeSubmission = async (req, res, next) => {
  try {
    const { id } = req.params; // submission_id
    const { grade, feedback } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE submissions SET grade = $1, feedback = $2 WHERE id = $3 RETURNING *`,
      [grade, feedback, id]
    );
    
    if (rows.length === 0) return error(res, 'Submission not found', 404);
    return success(res, rows[0], 'Submission graded successfully');
  } catch (err) {
    next(err);
  }
};
