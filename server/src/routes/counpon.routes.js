const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { verifyToken } = require('../utils/jwt');

const couponController = require('../controller/counpon.controller');

// Middleware optional auth: nếu có token thì set req.user, không có thì tiếp tục
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (token) {
            const decoded = await verifyToken(token);
            req.user = decoded;
        }
    } catch (error) {
        // Ignore auth errors - route này không bắt buộc đăng nhập
    }
    next();
};

// Route public: có thể truy cập không cần đăng nhập
// Nếu đã đăng nhập, sẽ filter coupon đã sử dụng
router.get('/active', optionalAuth, asyncHandler(couponController.findActive));

module.exports = router;
