const express = require('express');
const router = express.Router();

const { asyncHandler, authAdmin } = require('../../auth/checkAuth');
const adminCategoriesController = require('../../controller/admin/categories.admin.controller');

router.post('/create', authAdmin, asyncHandler(adminCategoriesController.createCategory));
router.post('/update', authAdmin, asyncHandler(adminCategoriesController.updateCategory));
router.delete('/delete/:id', authAdmin, asyncHandler(adminCategoriesController.deleteCategory));

module.exports = router;

