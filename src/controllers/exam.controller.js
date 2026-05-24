import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { generateCertificateHTML } from '../utils/generateCertificate.js';
// To upload the certificate to Cloudinary, we'd ideally use a library like html-to-image or puppeteer,
// but for this example, we'll assume a dummy upload or just store the HTML content / URL.
// We'll simulate `certificate.service.js` which is specified in the prompt.
import { generateAndUploadCertificate } from '../services/certificate.service.js';

export const getCourseExams = async (req, res, next) => {
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

    const { rows } = await pool.query('SELECT * FROM exams WHERE course_id = $1 AND is_active = true ORDER BY created_at DESC', [courseId]);
    
    // For students, do not include questions here. We might need a separate endpoint to start the exam.
    // For now, we'll just return the exams list.
    
    return success(res, rows, 'Exams retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createExam = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { courseId } = req.params;
    const { title, duration_minutes, passing_score, questions } = req.body;
    
    const { rows: examRows } = await client.query(
      `INSERT INTO exams (course_id, title, duration_minutes, passing_score)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [courseId, title, duration_minutes || 60, passing_score || 60]
    );
    
    const exam = examRows[0];
    
    if (questions && questions.length > 0) {
      for (const q of questions) {
        await client.query(
          `INSERT INTO exam_questions (exam_id, question, options, correct_option, marks)
           VALUES ($1, $2, $3, $4, $5)`,
          [exam.id, q.question, q.options, q.correct_option, q.marks || 1]
        );
      }
    }
    
    await client.query('COMMIT');
    return success(res, exam, 'Exam created successfully', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

export const attemptExam = async (req, res, next) => {
  try {
    const { id } = req.params; // exam_id
    const { answers } = req.body; // array of option indices mapped to questions sequentially
    
    const { rows: examRows } = await pool.query('SELECT * FROM exams WHERE id = $1 AND is_active = true', [id]);
    if (examRows.length === 0) return error(res, 'Exam not found', 404);
    const exam = examRows[0];

    const { rows: checkRows } = await pool.query('SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2', [req.user.id, exam.course_id]);
    if (checkRows.length === 0) return error(res, 'Not enrolled in this course', 403);

    const { rows: questions } = await pool.query('SELECT id, correct_option, marks FROM exam_questions WHERE exam_id = $1 ORDER BY id ASC', [exam.id]);
    
    let totalMarks = 0;
    let studentScore = 0;
    
    for (let i = 0; i < questions.length; i++) {
      totalMarks += questions[i].marks;
      if (answers[i] === questions[i].correct_option) {
        studentScore += questions[i].marks;
      }
    }
    
    const scorePercentage = totalMarks > 0 ? (studentScore / totalMarks) * 100 : 0;
    const passed = scorePercentage >= exam.passing_score;

    const { rows: attemptRows } = await pool.query(
      `INSERT INTO exam_attempts (exam_id, student_id, answers, score, passed)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [exam.id, req.user.id, answers, Math.round(scorePercentage), passed]
    );

    let certificateUrl = null;
    if (passed) {
      // Check if already has certificate for this course
      const { rows: certRows } = await pool.query('SELECT certificate_url FROM certificates WHERE student_id = $1 AND course_id = $2', [req.user.id, exam.course_id]);
      
      if (certRows.length === 0) {
        // Generate certificate
        const { rows: userRows } = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const { rows: courseRows } = await pool.query('SELECT title FROM courses WHERE id = $1', [exam.course_id]);
        
        const certData = await generateAndUploadCertificate(userRows[0].name, courseRows[0].title, new Date(), req.user.id, exam.course_id);
        certificateUrl = certData.certificateUrl;
        
        await pool.query(
          `INSERT INTO certificates (student_id, course_id, certificate_url, qr_code)
           VALUES ($1, $2, $3, $4)`,
          [req.user.id, exam.course_id, certificateUrl, certData.qrCode]
        );
      } else {
        certificateUrl = certRows[0].certificate_url;
      }
    }

    return success(res, { score: Math.round(scorePercentage), passed, certificateUrl }, 'Exam attempted successfully');
  } catch (err) {
    next(err);
  }
};

export const getExamResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      `SELECT ea.*, u.name as student_name, u.email 
       FROM exam_attempts ea 
       JOIN users u ON ea.student_id = u.id 
       WHERE ea.exam_id = $1 
       ORDER BY ea.attempted_at DESC`,
      [id]
    );
    
    return success(res, rows, 'Results retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getStudentExamResult = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;
    
    // Authorization check: if not faculty/admin, studentId must be req.user.id
    if (req.user.role !== 'faculty' && req.user.role !== 'super_admin' && req.user.id !== studentId) {
      return error(res, 'Unauthorized', 403);
    }
    
    const { rows } = await pool.query('SELECT * FROM exam_attempts WHERE exam_id = $1 AND student_id = $2 ORDER BY attempted_at DESC', [id, studentId]);
    
    return success(res, rows, 'Student results retrieved successfully');
  } catch (err) {
    next(err);
  }
};
