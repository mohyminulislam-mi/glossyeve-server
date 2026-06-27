const express = require('express');
const router = express.Router();
const { getStats, getCharts, getUsers, getUserDetail, updateUserRole } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // All admin routes require a verified JWT cookie

// Manager and Admin dashboard channels
router.get('/stats', authorize('admin', 'manager'), getStats);
router.get('/charts', authorize('admin', 'manager'), getCharts);

// Exclusive Admin-only security edits
router.get('/users', authorize('admin'), getUsers);
router.get('/users/:id', authorize('admin'), getUserDetail);
router.put('/users/:id/role', authorize('admin'), updateUserRole);

module.exports = router;
