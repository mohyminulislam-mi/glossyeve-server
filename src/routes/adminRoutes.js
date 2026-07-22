const express = require('express');
const router = express.Router();
const { getStats, getCharts, getUsers, getUserDetail, updateUserRole, approveManager, unapproveManager } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // All admin routes require a verified JWT cookie

// Manager and Admin dashboard channels
router.get('/stats', authorize('admin', 'manager'), getStats);
router.get('/charts', authorize('admin', 'manager'), getCharts);

// User and Customer management (Admin & Manager)
router.get('/users', authorize('admin', 'manager'), getUsers);
router.get('/users/:id', authorize('admin', 'manager'), getUserDetail);

// Exclusive Admin-only security edits
router.put('/users/:id/role', authorize('admin'), updateUserRole);
router.put('/users/:id/approve', authorize('admin'), approveManager);
router.put('/users/:id/unapprove', authorize('admin'), unapproveManager);

module.exports = router;
