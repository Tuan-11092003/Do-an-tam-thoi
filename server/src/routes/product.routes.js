const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');

const productController = require('../controller/product.controller');
router.get('/all', asyncHandler(productController.getAllProduct));
router.get('/filter', asyncHandler(productController.filterProduct));
router.get('/category/:category', asyncHandler(productController.getProductByCategory));
router.get('/product/:id', asyncHandler(productController.getProductById));
router.get('/search/:query', asyncHandler(productController.searchProduct));

module.exports = router;
