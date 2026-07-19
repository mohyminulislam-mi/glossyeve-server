const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

const activeOrLegacy = { $or: [{ active: true }, { active: { $exists: false } }] };

const collectProductImages = (req) => {
  const uploadedFiles = req.files && req.files.length ? req.files : req.file ? [req.file] : [];
  const uploadedImages = uploadedFiles.map((file) => file.path || file.secure_url).filter(Boolean);

  if (uploadedImages.length) {
    return uploadedImages;
  }

  if (req.body?.images !== undefined) {
    if (Array.isArray(req.body.images)) {
      return req.body.images.filter(Boolean);
    }

    if (typeof req.body.images === 'string') {
      if (req.body.images.startsWith('[')) {
        try {
          const parsedImages = JSON.parse(req.body.images);
          return Array.isArray(parsedImages) ? parsedImages.filter(Boolean) : [];
        } catch (err) {
          return [];
        }
      }

      if (req.body.images.includes(',')) {
        return req.body.images.split(',').map((value) => value.trim()).filter(Boolean);
      }

      return req.body.images ? [req.body.images] : [];
    }
  }

  if (req.body?.image_url) {
    return [req.body.image_url];
  }

  return [];
};

// @desc    Get all products (with search, filter, sort, paginate)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, brand, minPrice, maxPrice, sort, page, limit } = req.query;

    const queryObj = { ...activeOrLegacy };

    if (search) {
      queryObj.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    if (category) {
      const foundCat = await Category.findOne({ slug: category });
      queryObj.category = foundCat ? foundCat._id : category;
    }

    if (brand) {
      const foundBrand = await Brand.findOne({ slug: brand });
      queryObj.brand = foundBrand ? foundBrand._id : brand;
    }

    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = parseFloat(minPrice);
      if (maxPrice) queryObj.price.$lte = parseFloat(maxPrice);
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skipNum = (pageNum - 1) * limitNum;

    let mongooseQuery = Product.find(queryObj).populate('category').populate('brand').lean();

    if (sort) {
      if (sort === 'priceAsc') mongooseQuery = mongooseQuery.sort('price');
      else if (sort === 'priceDesc') mongooseQuery = mongooseQuery.sort('-price');
      else if (sort === 'nameAsc') mongooseQuery = mongooseQuery.sort('name');
      else if (sort === 'nameDesc') mongooseQuery = mongooseQuery.sort('-name');
      else if (sort === 'ratingDesc') mongooseQuery = mongooseQuery.sort('-ratingsAverage');
    } else {
      mongooseQuery = mongooseQuery.sort('-createdAt');
    }

    const total = await Product.countDocuments(queryObj);
    const products = await mongooseQuery.skip(skipNum).limit(limitNum);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      products: products.map(normalizeProduct)
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product details
// @route   GET /api/products/:id_or_slug
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const { id_or_slug } = req.params;
    let product;

    if (id_or_slug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id_or_slug).populate('category').populate('brand').lean();
    } else {
      product = await Product.findOne({ slug: id_or_slug }).populate('category').populate('brand').lean();
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, product: normalizeProduct(product) });
  } catch (err) {
    next(err);
  }
};

// Helper: resolve brand value to ObjectId
const resolveBrand = async (brandValue) => {
  if (!brandValue) return null;

  // Already a valid ObjectId string
  if (/^[0-9a-fA-F]{24}$/.test(String(brandValue).trim())) {
    return brandValue;
  }

  // It's a name — find or create
  const name = String(brandValue).trim();
  let brand = await Brand.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (!brand) {
    brand = await Brand.create({ name });
  }
  return brand._id;
};

// Helper: parse specifications safely
const parseSpecifications = (specs) => {
  if (!specs) return undefined;
  if (Array.isArray(specs)) return specs;
  if (typeof specs === 'string') {
    try {
      const parsed = JSON.parse(specs);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch (_) {
      return undefined;
    }
  }
  return undefined;
};

// Helper: parse array fields from FormData safely
const parseArrayField = (field) => {
  if (!field) return undefined;
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [field];
    } catch (_) {
      if (field.includes(',')) {
        return field.split(',').map((item) => item.trim()).filter(Boolean);
      }
      return [field.trim()];
    }
  }
  return undefined;
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin/Manager only)
exports.createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };
    const images = collectProductImages(req);

    if (images.length) {
      productData.images = images;
    }

    // Parse specifications from JSON string
    const parsedSpecs = parseSpecifications(productData.specifications);
    if (parsedSpecs !== undefined) {
      productData.specifications = parsedSpecs;
    }

    // Parse array fields
    const parsedDivisions = parseArrayField(productData.availableDivisions);
    if (parsedDivisions !== undefined) {
      productData.availableDivisions = parsedDivisions;
    }

    const parsedColors = parseArrayField(productData.colors);
    if (parsedColors !== undefined) {
      productData.colors = parsedColors;
    }

    const parsedSizes = parseArrayField(productData.sizes);
    if (parsedSizes !== undefined) {
      productData.sizes = parsedSizes;
    }

    // Map compareAtPrice to discountPrice
    if (productData.compareAtPrice !== undefined) {
      productData.discountPrice = productData.compareAtPrice === '' ? null : Number(productData.compareAtPrice);
    }

    // Resolve brand name → ObjectId
    if (productData.brand) {
      productData.brand = await resolveBrand(productData.brand);
    }

    const product = await Product.create(productData);
    const populatedProduct = await Product.findById(product._id).populate('category').populate('brand');
    return res.status(201).json({ success: true, product: populatedProduct });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin/Manager only)
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.files || req.file || req.body.images !== undefined || req.body.image_url) {
      const images = collectProductImages(req);
      updateData.images = images;
    }

    // Parse specifications from JSON string
    const parsedSpecs = parseSpecifications(updateData.specifications);
    if (parsedSpecs !== undefined) {
      updateData.specifications = parsedSpecs;
    }

    // Parse array fields
    const parsedDivisions = parseArrayField(updateData.availableDivisions);
    if (parsedDivisions !== undefined) {
      updateData.availableDivisions = parsedDivisions;
    }

    const parsedColors = parseArrayField(updateData.colors);
    if (parsedColors !== undefined) {
      updateData.colors = parsedColors;
    }

    const parsedSizes = parseArrayField(updateData.sizes);
    if (parsedSizes !== undefined) {
      updateData.sizes = parsedSizes;
    }

    // Map compareAtPrice to discountPrice
    if (updateData.compareAtPrice !== undefined) {
      updateData.discountPrice = updateData.compareAtPrice === '' ? null : Number(updateData.compareAtPrice);
    }

    // Resolve brand name → ObjectId
    if (updateData.brand) {
      updateData.brand = await resolveBrand(updateData.brand);
    }

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('category').populate('brand');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin/Manager only)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(id, { active: false }, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find(activeOrLegacy).lean();
    return res.status(200).json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all brands
// @route   GET /api/products/brands
// @access  Public
exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ active: true });
    return res.status(200).json({ success: true, brands });
  } catch (err) {
    next(err);
  }
};

const normalizeProduct = (product) => {
  if (!product) return product;

  return {
    ...product,
    images: product.images && product.images.length ? product.images : product.image_url ? [product.image_url] : [],
    discountPrice: product.discountPrice ?? product.compare_at_price ?? null,
    specifications: Array.isArray(product.specifications)
      ? product.specifications
      : Object.entries(product.specs || {}).map(([key, value]) => ({ key, value: String(value) })),
    active: product.active !== false
  };
};
