const { AuthFailureError, BadRequestError } = require('../core/error.response');
const { verifyToken } = require('../utils/jwt');
const modelUser = require('../models/users.model');

const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

const authUser = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) throw new AuthFailureError('Vui lòng đăng nhập');
        const decoded = await verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        // Chỉ log lỗi auth trong môi trường development để giảm noise trong production
        // Lỗi này đã được xử lý ở client (axiosClient.jsx) nên không cần log mỗi lần
        if (process.env.NODE_ENV === 'development') {
            console.log('Auth error:', error.message);
        }
        next(error);
    }
};

const authAdmin = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) throw new AuthFailureError('Bạn không có quyền truy cập');
        const decoded = await verifyToken(token);
        const { id } = decoded;
        const findUser = await modelUser.findOne({ _id: id });
        if (!findUser || findUser.isAdmin === false) {
            throw new AuthFailureError('Bạn không có quyền truy cập');
        }
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    asyncHandler,
    authUser,
    authAdmin,
};
