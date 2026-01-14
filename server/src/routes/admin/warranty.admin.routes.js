const express = require('express');
const router = express.Router();

const { asyncHandler, authAdmin } = require('../../auth/checkAuth');
const adminWarrantyController = require('../../controller/admin/warranty.admin.controller');

router.get('/', authAdmin, asyncHandler(adminWarrantyController.getWarrantyByAdmin));
router.put('/:warrantyId', authAdmin, asyncHandler(adminWarrantyController.updateWarrantyStatus));

module.exports = router;

