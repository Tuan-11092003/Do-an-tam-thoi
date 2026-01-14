const express = require('express');
const router = express.Router();

const { asyncHandler, authAdmin } = require('../../auth/checkAuth');
const adminCouponsController = require('../../controller/admin/coupons.admin.controller');

router.post('/create', authAdmin, asyncHandler(adminCouponsController.create));
router.get('/all', authAdmin, asyncHandler(adminCouponsController.findAll));
router.put('/update', authAdmin, asyncHandler(adminCouponsController.update));
router.delete('/delete', authAdmin, asyncHandler(adminCouponsController.delete));

module.exports = router;

