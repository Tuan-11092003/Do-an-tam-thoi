const express = require('express');
const router = express.Router();

const { asyncHandler, authAdmin } = require('../../auth/checkAuth');
const adminOrdersController = require('../../controller/admin/orders.admin.controller');

router.get('/all', authAdmin, asyncHandler(adminOrdersController.getAllOrder));
router.put('/update-status/:id', authAdmin, asyncHandler(adminOrdersController.updateOrderStatus));

module.exports = router;

