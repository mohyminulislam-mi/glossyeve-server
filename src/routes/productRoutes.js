const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getBrands
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const createUploadMiddleware = require('../middleware/uploadMiddleware');
const { validateGetProductsQuery, validateCreateProduct, validateUpdateProduct } = require('../middleware/validationMiddleware');

const uploadProductImages = createUploadMiddleware({
  folder: 'aonelube/products',
  fieldName: 'images',
  multiple: true,
  maxCount: 8
});

router.get('/', validateGetProductsQuery, getProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/:id_or_slug', getProduct);

// Privileged Inventory Modifier Guards (Manager & Admin)
router.post('/', protect, authorize('admin', 'manager'), uploadProductImages, createProduct);
router.put('/:id', protect, authorize('admin', 'manager'), uploadProductImages, updateProduct);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteProduct);

module.exports = router;
