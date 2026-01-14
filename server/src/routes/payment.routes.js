const express = require('express');
const router = express.Router();

const { asyncHandler, authUser } = require('../auth/checkAuth');

const paymentController = require('../controller/payment.controller');

router.post('/create', authUser, asyncHandler(paymentController.createPayment));
router.get('/detail/:id', authUser, asyncHandler(paymentController.getPaymentById));
router.get('/momo', asyncHandler(paymentController.momoCallback));
router.get('/vnpay', asyncHandler(paymentController.vnpayCallback));
router.get('/zalopay', asyncHandler(paymentController.zalopayCallback)); // User redirect (GET)
router.post('/zalopay', asyncHandler(paymentController.zalopayServerCallback)); // Server-to-server callback (POST) - Optional
router.get('/order-history', authUser, asyncHandler(paymentController.getOrderHistory));
router.put('/cancel-order/:orderId', authUser, asyncHandler(paymentController.cancelOrder));

module.exports = router;
