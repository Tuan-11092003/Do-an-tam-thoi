const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');

const couponController = require('../controller/counpon.controller');

router.get('/active', asyncHandler(couponController.findActive));

module.exports = router;
