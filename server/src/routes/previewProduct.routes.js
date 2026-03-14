const express = require('express');
const router = express.Router();

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const { asyncHandler, authUser } = require('../auth/checkAuth');

const previewProductController = require('../controller/previewProduct.controller');

router.post('/create', authUser, upload.array('images'), asyncHandler(previewProductController.createPreviewProduct));
router.get('/getAll', asyncHandler(previewProductController.getAllPreviewProduct));

module.exports = router;
