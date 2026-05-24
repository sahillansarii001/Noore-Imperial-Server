import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { slugify } from '../utils/slugify.js';
import { getPagination, getPaginationMetadata } from '../utils/pagination.js';

export const getCourses = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { category, search } = req.query;

    let query = `
      SELECT c.*, u.name as instructor_name 
      FROM courses c 
      LEFT JOIN users u ON c.instructor_id = u.id 
      WHERE c.is_active = true
    `;
    let countQuery = 'SELECT COUNT(*) FROM courses c WHERE c.is_active = true';
    const params = [];
    const countParams = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND c.category = $${paramIndex}`;
      countQuery += ` AND c.category = $${paramIndex}`;
      params.push(category);
      countParams.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      countQuery += ` AND (c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows: countRows } = await pool.query(countQuery, countParams);
    const { rows } = await pool.query(query, params);

    const pagination = getPaginationMetadata(countRows[0].count, page, limit);

    return success(res, rows, 'Courses retrieved successfully', 200, pagination);
  } catch (err) {
    next(err);
  }
};

export const getCourseBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const { rows } = await pool.query(
      `SELECT c.*, u.name as instructor_name 
       FROM courses c 
       LEFT JOIN users u ON c.instructor_id = u.id 
       WHERE c.slug = $1 AND c.is_active = true`,
      [slug]
    );
    
    if (rows.length === 0) return error(res, 'Course not found', 404);
    
    const course = rows[0];

    // Get lectures without video_url for public view
    const { rows: lectures } = await pool.query(
      'SELECT id, title, duration_minutes, order_index FROM lectures WHERE course_id = $1 ORDER BY order_index ASC',
      [course.id]
    );
    
    course.lectures = lectures;

    return success(res, course, 'Course retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const { title, description, category, instructor_id, price, duration_hours, thumbnail_url } = req.body;
    const slug = slugify(title);

    const { rows: existing } = await pool.query('SELECT id FROM courses WHERE slug = $1', [slug]);
    if (existing.length > 0) return error(res, 'Course with similar title already exists', 400);

    const { rows } = await pool.query(
      `INSERT INTO courses (title, slug, description, category, instructor_id, price, duration_hours, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, slug, description, category, instructor_id || req.user.id, price, duration_hours, thumbnail_url]
    );

    return success(res, rows[0], 'Course created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, instructor_id, price, duration_hours, thumbnail_url, is_active } = req.body;
    
    let slug;
    if (title) slug = slugify(title);

    const { rows } = await pool.query(
      `UPDATE courses 
       SET title = COALESCE($1, title), 
           slug = COALESCE($2, slug), 
           description = COALESCE($3, description), 
           category = COALESCE($4, category), 
           instructor_id = COALESCE($5, instructor_id), 
           price = COALESCE($6, price), 
           duration_hours = COALESCE($7, duration_hours), 
           thumbnail_url = COALESCE($8, thumbnail_url),
           is_active = COALESCE($9, is_active),
           updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [title, slug, description, category, instructor_id, price, duration_hours, thumbnail_url, is_active, id]
    );

    if (rows.length === 0) return error(res, 'Course not found', 404);
    return success(res, rows[0], 'Course updated successfully');
  } catch (err) {
    next(err);
  }
};

export const getEnrolledStudents = async (req, res, next) => {
  try {
    const { id } = req.params; // course_id
    
    const { rows } = await pool.query(
      `SELECT e.progress, e.enrolled_at, e.completed_at, u.id, u.name, u.email 
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_id = $1
       ORDER BY e.enrolled_at DESC`,
      [id]
    );
    
    return success(res, rows, 'Enrolled students retrieved successfully');
  } catch (err) {
    next(err);
  }
};
