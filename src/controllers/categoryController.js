const Category = require('../models/Category');
const Product = require('../models/Product');

const activeOrLegacy = { $or: [{ active: true }, { active: { $exists: false } }] };

const createSlug = (value) => {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const isDuplicateCategory = async (name, slug, excludeId = null) => {
  const query = {
    $or: []
  };

  if (name) {
    query.$or.push({ name: new RegExp(`^${name}$`, 'i') });
  }

  if (slug) {
    query.$or.push({ slug });
  }

  if (!query.$or.length) {
    return false;
  }

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingCategory = await Category.findOne(query);
  return Boolean(existingCategory);
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find(activeOrLegacy).lean();
    return res.status(200).json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

// @desc    Get products in a category
// @route   GET /api/categories/:id/products
// @access  Public
exports.getCategoryProducts = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const products = await Product.find({ category: id, ...activeOrLegacy }).populate('category').populate('brand').lean();
    return res.status(200).json({
      success: true,
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug
      },
      count: products.length,
      products
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin/Manager only)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, slug, description } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const normalizedSlug = slug && String(slug).trim()
      ? createSlug(slug)
      : createSlug(name);

    if (!normalizedSlug) {
      return res.status(400).json({ success: false, message: 'Category slug is invalid' });
    }

    const duplicate = await isDuplicateCategory(name, normalizedSlug);
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Category name or slug already exists' });
    }

    const categoryData = {
      name: String(name).trim(),
      description: description ? String(description).trim() : '',
      slug: normalizedSlug,
      image: req.file && (req.file.path || req.file.secure_url) ? (req.file.path || req.file.secure_url) : undefined
    };

    const category = await Category.create(categoryData);
    return res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin/Manager only)
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const updateData = {};

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }
      updateData.name = String(name).trim();
    }

    if (description !== undefined) {
      updateData.description = String(description).trim();
    }

    if (req.file && (req.file.path || req.file.secure_url)) {
      updateData.image = req.file.path || req.file.secure_url;
    }

    if (slug !== undefined && String(slug).trim()) {
      updateData.slug = createSlug(slug);
    } else if (name !== undefined) {
      updateData.slug = createSlug(updateData.name);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    const duplicate = await isDuplicateCategory(updateData.name, updateData.slug, id);
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Category name or slug already exists' });
    }

    Object.assign(category, updateData);
    const updatedCategory = await category.save();
    return res.status(200).json({ success: true, category: updatedCategory });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin/Manager only)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productsUsingCategory = await Product.findOne({ category: id });
    if (productsUsingCategory) {
      return res.status(400).json({ success: false, message: 'Cannot delete category with existing products' });
    }

    await Category.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};
