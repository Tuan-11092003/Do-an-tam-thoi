const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'src/uploads/products';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

var upload = multer({ storage: storage });

const { asyncHandler, authAdmin } = require('../../auth/checkAuth');
const adminProductsController = require('../../controller/admin/products.admin.controller');

router.post('/create', authAdmin, asyncHandler(adminProductsController.createProduct));
router.put('/update/:id', authAdmin, asyncHandler(adminProductsController.updateProduct));
router.delete('/delete/:id', authAdmin, asyncHandler(adminProductsController.deleteProduct));
router.post('/upload-image', authAdmin, upload.single('image'), asyncHandler(adminProductsController.uploadImage));

module.exports = router;

