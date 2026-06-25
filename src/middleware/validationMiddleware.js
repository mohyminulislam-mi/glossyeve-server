// Validation middleware for product-related inputs

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Validate and sanitize query params for GET /api/products
exports.validateGetProductsQuery = (req, res, next) => {
  try {
    const q = req.query || {};

    // search: escape regex and trim
    if (q.search) {
      const s = String(q.search).trim();
      req.query.search = s ? escapeRegex(s) : undefined;
    }

    // category/brand: simple trim
    if (q.category) req.query.category = String(q.category).trim();
    if (q.brand) req.query.brand = String(q.brand).trim();

    // Prices: parse numbers, ignore invalid
    if (q.minPrice !== undefined) {
      const v = Number(q.minPrice);
      req.query.minPrice = Number.isFinite(v) && v >= 0 ? v : undefined;
    }
    if (q.maxPrice !== undefined) {
      const v = Number(q.maxPrice);
      req.query.maxPrice = Number.isFinite(v) && v >= 0 ? v : undefined;
    }

    // Pagination
    let page = parseInt(q.page, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    req.query.page = page;

    let limit = parseInt(q.limit, 10);
    if (!Number.isFinite(limit) || limit < 1) limit = 12;
    if (limit > 100) limit = 100;
    req.query.limit = limit;

    // Sort: allow known values only
    const allowedSorts = new Set(['priceAsc', 'priceDesc', 'nameAsc', 'nameDesc', 'ratingDesc']);
    if (q.sort && allowedSorts.has(q.sort)) req.query.sort = q.sort;
    else delete req.query.sort;

    next();
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid query parameters' });
  }
};

// Validate create product body (basic checks)
exports.validateCreateProduct = (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = [];

    if (!body.name || !String(body.name).trim()) errors.push('name is required');
    if (!body.sku || !String(body.sku).trim()) errors.push('sku is required');

    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) errors.push('price must be a non-negative number');

    if (body.discountPrice !== undefined) {
      const d = Number(body.discountPrice);
      if (!Number.isFinite(d) || d < 0) errors.push('discountPrice must be a non-negative number');
    }

    if (body.stock !== undefined) {
      const s = Number(body.stock);
      if (!Number.isFinite(s) || s < 0) errors.push('stock must be a non-negative number');
    }

    if (body.images !== undefined && !Array.isArray(body.images)) {
      errors.push('images must be an array of URLs');
    }

    if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });

    // Normalize some values to expected types
    req.body.name = String(body.name).trim();
    req.body.sku = String(body.sku).trim();
    req.body.price = Number(body.price);
    if (body.discountPrice !== undefined) req.body.discountPrice = Number(body.discountPrice);
    if (body.stock !== undefined) req.body.stock = Number(body.stock);

    next();
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid product data' });
  }
};

// Validate update product body (allow partial but validate types)
exports.validateUpdateProduct = (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = [];

    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) errors.push('price must be a non-negative number');
      else req.body.price = price;
    }

    if (body.discountPrice !== undefined) {
      const d = Number(body.discountPrice);
      if (!Number.isFinite(d) || d < 0) errors.push('discountPrice must be a non-negative number');
      else req.body.discountPrice = d;
    }

    if (body.stock !== undefined) {
      const s = Number(body.stock);
      if (!Number.isFinite(s) || s < 0) errors.push('stock must be a non-negative number');
      else req.body.stock = s;
    }

    if (body.images !== undefined && !Array.isArray(body.images)) {
      errors.push('images must be an array of URLs');
    }

    if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });

    next();
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid product update data' });
  }
};
