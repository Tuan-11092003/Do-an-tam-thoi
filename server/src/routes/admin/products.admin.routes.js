const express = require('express');
const router = express.Router();

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const { asyncHandler, authAdmin } = require('../../auth/checkAuth');
const adminProductsController = require('../../controller/admin/products.admin.controller');

router.post('/create', authAdmin, asyncHandler(adminProductsController.createProduct));
router.put('/update/:id', authAdmin, asyncHandler(adminProductsController.updateProduct));
router.delete('/delete/:id', authAdmin, asyncHandler(adminProductsController.deleteProduct));
router.post('/upload-image', authAdmin, upload.single('image'), asyncHandler(adminProductsController.uploadImage));

module.exports = router;

