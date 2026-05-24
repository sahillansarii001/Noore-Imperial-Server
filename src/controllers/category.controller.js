import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { slugify } from '../utils/slugify.js';

export const getCategories = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY created_at DESC');
    
    // Build tree
    const categoryMap = {};
    const tree = [];
    
    rows.forEach(cat => categoryMap[cat.id] = { ...cat, children: [] });
    
    rows.forEach(cat => {
      if (cat.parent_id) {
        if (categoryMap[cat.parent_id]) {
          categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
        }
      } else {
        tree.push(categoryMap[cat.id]);
      }
    });

    return success(res, tree, 'Categories retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getCategoryProducts = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows: categories } = await pool.query('SELECT id FROM categories WHERE slug = $1', [slug]);
    if (categories.length === 0) return error(res, 'Category not found', 404);

    const categoryId = categories[0].id;

    // Get products in this category or its subcategories
    const query = `
      WITH RECURSIVE CategoryTree AS (
        SELECT id FROM categories WHERE id = $1
        UNION
        SELECT c.id FROM categories c
        INNER JOIN CategoryTree ct ON c.parent_id = ct.id
      )
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id IN (SELECT id FROM CategoryTree) AND p.is_active = true
      ORDER BY p.created_at DESC LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      WITH RECURSIVE CategoryTree AS (
        SELECT id FROM categories WHERE id = $1
        UNION
        SELECT c.id FROM categories c
        INNER JOIN CategoryTree ct ON c.parent_id = ct.id
      )
      SELECT COUNT(*) FROM products WHERE category_id IN (SELECT id FROM CategoryTree) AND is_active = true
    `;

    const { rows: countRows } = await pool.query(countQuery, [categoryId]);
    const { rows } = await pool.query(query, [categoryId, limit, offset]);

    return success(res, rows, 'Products retrieved successfully', 200, {
      totalItems: parseInt(countRows[0].count),
      currentPage: page,
      totalPages: Math.ceil(parseInt(countRows[0].count) / limit),
      limit
    });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, parent_id, image_url } = req.body;
    const slug = slugify(name);

    const { rows: existing } = await pool.query('SELECT id FROM categories WHERE slug = $1', [slug]);
    if (existing.length > 0) return error(res, 'Category with similar name already exists', 400);

    const { rows } = await pool.query(
      'INSERT INTO categories (name, slug, parent_id, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug, parent_id || null, image_url]
    );

    return success(res, rows[0], 'Category created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, parent_id, image_url, is_active } = req.body;
    
    let slug;
    if (name) slug = slugify(name);

    const { rows } = await pool.query(
      'UPDATE categories SET name = COALESCE($1, name), slug = COALESCE($2, slug), parent_id = COALESCE($3, parent_id), image_url = COALESCE($4, image_url), is_active = COALESCE($5, is_active) WHERE id = $6 RETURNING *',
      [name, slug, parent_id, image_url, is_active, id]
    );

    if (rows.length === 0) return error(res, 'Category not found', 404);
    return success(res, rows[0], 'Category updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: products } = await pool.query('SELECT id FROM products WHERE category_id = $1 LIMIT 1', [id]);
    if (products.length > 0) return error(res, 'Cannot delete category with linked products', 400);

    const { rows: subcats } = await pool.query('SELECT id FROM categories WHERE parent_id = $1 LIMIT 1', [id]);
    if (subcats.length > 0) return error(res, 'Cannot delete category with subcategories', 400);

    const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    
    if (rowCount === 0) return error(res, 'Category not found', 404);
    return success(res, null, 'Category deleted successfully');
  } catch (err) {
    next(err);
  }
};
