const express = require('express');
const router = express.Router();

const { asyncHandler, authAdmin } = require('../../auth/checkAuth');
const adminFlashSaleController = require('../../controller/admin/flashSale.admin.controller');

router.post('/create', authAdmin, asyncHandler(adminFlashSaleController.createFlashSale));
router.get('/all', authAdmin, asyncHandler(adminFlashSaleController.getAllFlashSale));
router.put('/update/:id', authAdmin, asyncHandler(adminFlashSaleController.updateFlashSale));
router.delete('/delete/:id', authAdmin, asyncHandler(adminFlashSaleController.deleteFlashSale));

module.exports = router;

