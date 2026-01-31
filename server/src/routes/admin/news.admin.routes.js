const express = require('express');
const router = express.Router();

const { asyncHandler, authAdmin } = require('../../auth/checkAuth');
const adminNewsController = require('../../controller/admin/news.admin.controller');

router.post('/create', authAdmin, asyncHandler(adminNewsController.createNews));
router.put('/update', authAdmin, asyncHandler(adminNewsController.updateNews));
router.delete('/delete', authAdmin, asyncHandler(adminNewsController.deleteNews));

module.exports = router;

