const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const createUploadMiddleware = require('../middleware/uploadMiddleware');

const uploadCategoryImage = createUploadMiddleware({ folder: 'aonelube/categories' });

router.get('/', getCategories);
router.get('/:id/products', getCategoryProducts);
router.post('/', protect, authorize('admin', 'manager'), uploadCategoryImage, createCategory);
router.put('/:id', protect, authorize('admin', 'manager'), uploadCategoryImage, updateCategory);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteCategory);

module.exports = router;
