const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/category');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

var upload = multer({ storage: storage });

const { asyncHandler } = require('../auth/checkAuth');

const categoryController = require('../controller/category.controller');

router.get('/all', asyncHandler(categoryController.getAllCategory));

module.exports = router;
