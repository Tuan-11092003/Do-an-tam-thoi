const express = require('express');
const router = express.Router();

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const { asyncHandler, authUser } = require('../auth/checkAuth');

const warrantyController = require('../controller/warranty.controller');

router.get('/history', authUser, asyncHandler(warrantyController.getWarrantyByUserId));
router.post('/request', authUser, upload.array('images'), asyncHandler(warrantyController.requestWarranty));

module.exports = router;
