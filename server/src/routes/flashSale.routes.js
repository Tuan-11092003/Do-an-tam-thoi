const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');

const flashSaleController = require('../controller/flashSale.controller');

router.get('/date', asyncHandler(flashSaleController.getFlashSaleByDate));

module.exports = router;
