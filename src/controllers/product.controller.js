import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { slugify } from '../utils/slugify.js';
import { getPagination, getPaginationMetadata } from '../utils/pagination.js';

export const getProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { category, minPrice, maxPrice, size, color, search, sort } = req.query;

    let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true';
    let countQuery = 'SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true';
    const params = [];
    const countParams = [];

    let paramIndex = 1;

    if (category) {
      query += ` AND c.slug = $${paramIndex}`;
      countQuery += ` AND c.slug = $${paramIndex}`;
      params.push(category);
      countParams.push(category);
      paramIndex++;
    }
    
    if (minPrice) {
      query += ` AND p.price >= $${paramIndex}`;
      countQuery += ` AND p.price >= $${paramIndex}`;
      params.push(minPrice);
      countParams.push(minPrice);
      paramIndex++;
    }

    if (maxPrice) {
      query += ` AND p.price <= $${paramIndex}`;
      countQuery += ` AND p.price <= $${paramIndex}`;
      params.push(maxPrice);
      countParams.push(maxPrice);
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      countQuery += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      paramIndex++;
    }

    if (sort === 'price_asc') query += ' ORDER BY p.price ASC';
    else if (sort === 'price_desc') query += ' ORDER BY p.price DESC';
    else if (sort === 'popular') query += ' ORDER BY p.stock DESC'; // Dummy popular logic
    else query += ' ORDER BY p.created_at DESC';

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows: totalRows } = await pool.query(countQuery, countParams);
    const totalItems = totalRows[0].count;

    const { rows } = await pool.query(query, params);
    
    // Fetch variants for all these products
    if (rows.length > 0) {
      const productIds = rows.map(r => r.id);
      const { rows: variants } = await pool.query('SELECT * FROM product_variants WHERE product_id = ANY($1)', [productIds]);
      
      rows.forEach(product => {
        product.variants = variants.filter(v => v.product_id === product.id);
      });
    }

    const pagination = getPaginationMetadata(totalItems, page, limit);

    return success(res, rows, 'Products retrieved successfully', 200, pagination);
  } catch (err) {
    next(err);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const { rows } = await pool.query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = $1 AND p.is_active = true', [slug]);
    
    if (rows.length === 0) return error(res, 'Product not found', 404);
    
    const product = rows[0];

    const { rows: variants } = await pool.query('SELECT * FROM product_variants WHERE product_id = $1', [product.id]);
    product.variants = variants;

    const { rows: reviews } = await pool.query(
      'SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = $1 ORDER BY r.created_at DESC', 
      [product.id]
    );
    product.reviews = reviews;
    
    let avgRating = 0;
    if (reviews.length > 0) {
      avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }
    product.avg_rating = avgRating.toFixed(1);

    return success(res, product, 'Product retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, description, category_id, price, discount_price, fabric, sku, barcode, stock, tags } = req.body;
    const slug = slugify(name);

    const { rows: existing } = await pool.query('SELECT id FROM products WHERE slug = $1 OR sku = $2', [slug, sku]);
    if (existing.length > 0) return error(res, 'Product with this name or SKU already exists', 400);

    const { rows } = await pool.query(
      'INSERT INTO products (name, slug, description, category_id, price, discount_price, fabric, sku, barcode, stock, tags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [name, slug, description, category_id, price, discount_price, fabric, sku, barcode, stock, tags || []]
    );

    return success(res, rows[0], 'Product created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, price, discount_price, fabric, sku, barcode, stock, tags, is_active } = req.body;
    
    let slug;
    if (name) slug = slugify(name);

    const { rows } = await pool.query(
      'UPDATE products SET name = COALESCE($1, name), slug = COALESCE($2, slug), description = COALESCE($3, description), category_id = COALESCE($4, category_id), price = COALESCE($5, price), discount_price = COALESCE($6, discount_price), fabric = COALESCE($7, fabric), sku = COALESCE($8, sku), barcode = COALESCE($9, barcode), stock = COALESCE($10, stock), tags = COALESCE($11, tags), is_active = COALESCE($12, is_active), updated_at = NOW() WHERE id = $13 RETURNING *',
      [name, slug, description, category_id, price, discount_price, fabric, sku, barcode, stock, tags, is_active, id]
    );

    if (rows.length === 0) return error(res, 'Product not found', 404);
    return success(res, rows[0], 'Product updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query('UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id', [id]);
    
    if (rows.length === 0) return error(res, 'Product not found', 404);
    return success(res, null, 'Product deactivated successfully');
  } catch (err) {
    next(err);
  }
};

export const uploadProductImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return error(res, 'No files uploaded', 400);
    }

    const imageUrls = req.files.map(file => file.path); // Cloudinary sets 'path' to secure_url

    const { rows } = await pool.query(
      'UPDATE products SET images = array_cat(images, $1), updated_at = NOW() WHERE id = $2 RETURNING images',
      [imageUrls, id]
    );

    if (rows.length === 0) return error(res, 'Product not found', 404);
    return success(res, rows[0], 'Images uploaded successfully');
  } catch (err) {
    next(err);
  }
};

export const addVariant = async (req, res, next) => {
  try {
    const { id } = req.params; // product_id
    const { size, color, stock, price_modifier } = req.body;

    const { rows } = await pool.query(
      'INSERT INTO product_variants (product_id, size, color, stock, price_modifier) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, size, color, stock || 0, price_modifier || 0]
    );

    return success(res, rows[0], 'Variant added successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const removeVariant = async (req, res, next) => {
  try {
    const { id, variantId } = req.params;

    const { rowCount } = await pool.query('DELETE FROM product_variants WHERE id = $1 AND product_id = $2', [variantId, id]);
    
    if (rowCount === 0) return error(res, 'Variant not found', 404);
    return success(res, null, 'Variant removed successfully');
  } catch (err) {
    next(err);
  }
};
