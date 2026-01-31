const express = require('express');
const router = express.Router();


const { asyncHandler } = require('../auth/checkAuth');

const categoryController = require('../controller/category.controller');

router.get('/all', asyncHandler(categoryController.getAllCategory));

module.exports = router;
