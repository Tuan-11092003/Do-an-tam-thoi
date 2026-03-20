const modelUser = require('../models/users.model');
const modelApiKey = require('../models/apiKey.model');
const modelOtp = require('../models/otp.model');
const modelMessageChatbot = require('../models/messageChatbot.model');
const { askShoeAssistant } = require('../utils/chatbot');

const { createToken, createRefreshToken, createApiKey, verifyToken } = require('../utils/jwt');
const { jwtDecode } = require('jwt-decode');
const jwt = require('jsonwebtoken');

const { ConflictRequestError, BadRequestError } = require('../core/error.response');

const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const SendMailForgotPassword = require('../utils/sendMailForgotPassword');

class UserService {
    async createUser(data) {
        const { fullName, email, password, phone } = data;
        // Kiểm tra email đã tồn tại
        const findUser = await modelUser.findOne({ email, typeLogin: 'email' });
        if (findUser) {
            throw new ConflictRequestError('Email đã tồn tại');
        }

        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(password, salt);

        // Tạo user mới
        const newUser = await modelUser.create({
            fullName,
            email,
            phone,
            password: passwordHash,
            typeLogin: 'email',
        });

        // Tạo API key và token
        await createApiKey(newUser._id);
        const token = await createToken({ id: newUser._id });
        const refreshToken = await createRefreshToken({ id: newUser._id });

        return { token, refreshToken };
    }

    async authUser(id) {
        const findUser = await modelUser.findById(id);
        if (!findUser) {
            throw new BadRequestError('User không tồn tại');
        }
        const userString = JSON.stringify(findUser);
        const auth = CryptoJS.AES.encrypt(userString, process.env.SECRET_CRYPTO).toString();
        return auth;
    }

    async login(data) {
        const { email, password } = data;
        // Chỉ tìm user có typeLogin = 'email'
        const user = await modelUser.findOne({ email, typeLogin: 'email' });
        if (!user) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }

        const checkPassword = bcrypt.compareSync(password, user.password);
        if (!checkPassword) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        await createApiKey(user._id);
        const token = await createToken({ id: user._id });
        const refreshToken = await createRefreshToken({ id: user._id });
        return { token, refreshToken, isAdmin: user.isAdmin === true };
    }

    async logout(id) {
        // Cập nhật isOnline = false khi user đăng xuất
        await modelUser.findByIdAndUpdate(id, { isOnline: false });
        await modelApiKey.deleteMany({ userId: id });
        return { status: 200 };
    }

    async refreshToken(refreshToken) {
        const decoded = await verifyToken(refreshToken);

        const user = await modelUser.findOne({ _id: decoded.id });

        const token = await createToken({ id: user._id });
        const newRefreshToken = await createRefreshToken({ id: user._id });
        return { token, refreshToken: newRefreshToken };
    }

    async getAllUser(search = '') {
        let query = {};
        
        // Nếu có search query, tìm kiếm theo fullName, email, phone
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i'); // Không phân biệt hoa thường
            query = {
                $or: [
                    { fullName: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex },
                ],
            };
        }
        
        const data = await modelUser.find(query).sort({ createdAt: -1 });
        return data;
    }

    async updateUserAdmin(id, data) {
        const { fullName, email, phone, address, isAdmin, typeLogin } = data;
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        user.fullName = fullName;
        user.email = email;
        user.phone = phone;
        user.address = address;
        user.isAdmin = isAdmin;
        user.typeLogin = typeLogin;
        await user.save();
        return user;
    }

    async deleteUser(id) {
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        await user.deleteOne();
        return user;
    }

    async changePassword(id, data) {
        const { currentPassword, newPassword } = data;
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }
        const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestError('Mật khẩu hiện tại không chính xác');
        }
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(newPassword, salt);
        user.password = passwordHash;
        await user.save();
        return user;
    }

    async updateUser(id, data) {
        const { fullName, address, phone, birthDay, email } = data;
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }
        user.fullName = fullName;
        user.address = address;
        user.phone = phone;
        user.birthDay = birthDay;
        user.email = email;
        await user.save();
        return user;
    }

    async uploadAvatar(id, filename) {
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }
        user.avatar = filename;
        await user.save();
        return user;
    }

    async loginGoogle(credential) {
        const dataToken = jwtDecode(credential);
        // Chỉ tìm user có typeLogin = 'google' (tách riêng với email/password login)
        const user = await modelUser.findOne({ email: dataToken.email, typeLogin: 'google' });

        if (user) {
            await createApiKey(user._id);
            const token = await createToken({ id: user._id });
            const refreshToken = await createRefreshToken({ id: user._id });
            return { token, refreshToken, isAdmin: user.isAdmin === true };
        } else {
            // Tạo tài khoản Google mới (có thể cùng email với tài khoản email/password)
            const newUser = await modelUser.create({
                email: dataToken.email,
                typeLogin: 'google',
                fullName: dataToken.name,
                password: '', // Đăng nhập Google không cần mật khẩu
            });
            await createApiKey(newUser._id);
            const token = await createToken({ id: newUser._id });
            const refreshToken = await createRefreshToken({ id: newUser._id });
            return { token, refreshToken, isAdmin: newUser.isAdmin === true };
        }
    }

    async forgotPassword(email) {
        // Chỉ cho phép reset password cho tài khoản email/password
        const user = await modelUser.findOne({ email, typeLogin: 'email' });
        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại hoặc đăng nhập bằng Google');
        }

        const token = jwt.sign({ id: user._id }, process.env.SECRET_CRYPTO, { expiresIn: '5m' });

        const otp = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        const saltRounds = 10;

        const otpHash = bcrypt.hashSync(otp, saltRounds);

        await modelOtp.create({ email: user.email, otp: otpHash });

        await SendMailForgotPassword(user.email, otp);

        return { token, otp };
    }

    async resetPassword(token, otpUser, newPassword) {
        const decoded = jwt.verify(token, process.env.SECRET_CRYPTO);
        const user = await modelUser.findOne({ _id: decoded.id });

        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        const findOtp = await modelOtp.findOne({ email: user.email }).sort({ createdAt: -1 });

        if (!findOtp) {
            throw new BadRequestError('Mã OTP không hợp lệ hoặc đã hết hạn');
        }

        // Kiểm tra thời gian hết hạn (5 phút)
        const now = new Date();
        const otpCreatedAt = new Date(findOtp.createdAt);
        const OTP_EXPIRY_TIME = 5 * 60 * 1000; // 5 phút
        const timeDifference = now.getTime() - otpCreatedAt.getTime();

        if (timeDifference > OTP_EXPIRY_TIME) {
            // Xóa OTP hết hạn
            await modelOtp.findByIdAndDelete(findOtp._id);
            throw new BadRequestError('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới');
        }

        const checkOtp = bcrypt.compareSync(otpUser, findOtp.otp);
        if (!checkOtp) {
            throw new BadRequestError('Mã OTP không hợp lệ');
        }

        // OTP hợp lệ, đổi mật khẩu
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(newPassword, salt);
        user.password = passwordHash;
        await user.save();

        // Xóa OTP sau khi sử dụng thành công
        await modelOtp.findByIdAndDelete(findOtp._id);

        return user;
    }

    async chatbot(question, userId) {
        const response = await askShoeAssistant(question, userId);

        await modelMessageChatbot.create({
            userId: userId,
            sender: 'user',
            content: question,
        });

        await modelMessageChatbot.create({
            userId: userId,
            sender: 'bot',
            content: response,
        });

        return response;
    }

    async getMessageChatbot(userId) {
        const messageChatbot = await modelMessageChatbot.find({ userId });
        return messageChatbot;
    }

    async getDashboardAdmin() {
        try {
            const Product = require('../models/product.model');
            const Payment = require('../models/payment.model');
            const User = require('../models/users.model');
            const PreviewProduct = require('../models/previewProduct.model');
            const Category = require('../models/category.model');

            // 1. Tổng quan cơ bản
            const totalProducts = await Product.countDocuments({ status: 'active' });
            const totalUsers = await User.countDocuments({ isAdmin: false });
            const totalCategories = await Category.countDocuments();
            const totalOrders = await Payment.countDocuments();

            // 2. Doanh thu
            const revenueResult = await Payment.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum: {
                                $cond: {
                                    if: { $and: [{ $ne: ['$finalPrice', null] }, { $gt: ['$finalPrice', 0] }] },
                                    then: '$finalPrice',
                                    else: '$totalPrice',
                                },
                            },
                        },
                    },
                },
            ]);
            const totalRevenue = revenueResult[0]?.totalRevenue || 0;
            // console.log('Total revenue calculation:', { totalRevenue, revenueResult });

            // 3. Doanh thu theo 7 ngày gần đây
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const revenueByDay = await Payment.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo },
                        status: { $ne: 'cancelled' },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' },
                        },
                        revenue: {
                            $sum: {
                                $cond: {
                                    if: { $and: [{ $ne: ['$finalPrice', null] }, { $gt: ['$finalPrice', 0] }] },
                                    then: '$finalPrice',
                                    else: '$totalPrice',
                                },
                            },
                        },
                        orders: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            ]);

            // console.log('Revenue by day query result:', revenueByDay);

            // Generate full 7 days with zero revenue if no data
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);

                const existingDay = revenueByDay.find(
                    (day) =>
                        day._id.year === date.getFullYear() &&
                        day._id.month === date.getMonth() + 1 &&
                        day._id.day === date.getDate(),
                );

                last7Days.push({
                    date: date.toISOString().split('T')[0], // YYYY-MM-DD format
                    dayName: date.toLocaleDateString('vi-VN', { weekday: 'short' }), // Mon, Tue, etc
                    dayMonth: `${date.getDate()}/${date.getMonth() + 1}`, // 14/10
                    revenue: existingDay ? existingDay.revenue : 0,
                    orders: existingDay ? existingDay.orders : 0,
                });
            }


            // 4. Trạng thái đơn hàng
            const orderStatus = await Payment.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]);

            // 5. Top 10 sản phẩm bán chạy
            const topProducts = await Payment.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $unwind: '$products' },
                {
                    $group: {
                        _id: '$products.productId',
                        totalSold: { $sum: '$products.quantity' },
                        revenue: {
                            $sum: {
                                $multiply: [
                                    '$products.quantity',
                                    {
                                        $cond: {
                                            if: { $and: [{ $ne: ['$finalPrice', null] }, { $gt: ['$finalPrice', 0] }] },
                                            then: '$finalPrice',
                                            else: '$totalPrice',
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                { $sort: { totalSold: -1 } },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product',
                    },
                },
                { $match: { 'product.0': { $exists: true } } }, // Chỉ lấy sản phẩm tồn tại
                { $unwind: '$product' },
                { $limit: 10 },
            ]);

            // 6. Đánh giá gần đây
            const recentReviews = await PreviewProduct.find()
                .populate('userId', 'fullName avatar')
                .populate('productId', 'name')
                .sort({ createdAt: -1 })
                .limit(5);

            // 7. Đơn hàng mới nhất
            const recentOrders = await Payment.find()
                .populate('userId', 'fullName email avatar')
                .sort({ createdAt: -1 })
                .limit(10);

            // 8. Thống kê theo phương thức thanh toán
            const paymentMethods = await Payment.aggregate([
                { $match: { status: { $ne: 'cancelled' }, paymentMethod: { $ne: 'vnpay' } } },
                {
                    $group: {
                        _id: '$paymentMethod',
                        count: { $sum: 1 },
                        revenue: {
                            $sum: {
                                $cond: {
                                    if: { $and: [{ $ne: ['$finalPrice', null] }, { $gt: ['$finalPrice', 0] }] },
                                    then: '$finalPrice',
                                    else: '$totalPrice',
                                },
                            },
                        },
                    },
                },
            ]);

            // 9. Doanh thu theo tháng (12 tháng gần nhất)
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 12);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);

            const revenueByMonth = await Payment.aggregate([
                {
                    $match: {
                        status: { $ne: 'cancelled' },
                        createdAt: { $gte: startDate },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        revenue: {
                            $sum: {
                                $cond: {
                                    if: { $and: [{ $ne: ['$finalPrice', null] }, { $gt: ['$finalPrice', 0] }] },
                                    then: '$finalPrice',
                                    else: '$totalPrice',
                                },
                            },
                        },
                        orderCount: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]);

            const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
            const revenueMap = new Map();
            revenueByMonth.forEach((item) => {
                const key = `${item._id.year}-${item._id.month}`;
                revenueMap.set(key, {
                    month: item._id.month,
                    year: item._id.year,
                    monthLabel: `${monthNames[item._id.month - 1]}/${item._id.year}`,
                    revenue: item.revenue,
                    orderCount: item.orderCount,
                });
            });
            // Điền đủ 12 tháng (tháng không có đơn = doanh thu 0)
            const revenueByMonthFormatted = [];
            const now = new Date();
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const year = d.getFullYear();
                const month = d.getMonth() + 1;
                const key = `${year}-${month}`;
                if (revenueMap.has(key)) {
                    revenueByMonthFormatted.push(revenueMap.get(key));
                } else {
                    revenueByMonthFormatted.push({
                        month,
                        year,
                        monthLabel: `${monthNames[month - 1]}/${year}`,
                        revenue: 0,
                        orderCount: 0,
                    });
                }
            }

            // 9. Tăng trưởng so với tháng trước
            const currentMonth = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);

            const currentMonthRevenue = await Payment.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
                            $lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
                        },
                        status: { $ne: 'cancelled' },
                    },
                },
                {
                    $group: {
                        _id: null,
                        revenue: {
                            $sum: {
                                $cond: {
                                    if: { $and: [{ $ne: ['$finalPrice', null] }, { $gt: ['$finalPrice', 0] }] },
                                    then: '$finalPrice',
                                    else: '$totalPrice',
                                },
                            },
                        },
                    },
                },
            ]);

            const lastMonthRevenue = await Payment.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
                            $lt: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1),
                        },
                        status: { $ne: 'cancelled' },
                    },
                },
                {
                    $group: {
                        _id: null,
                        revenue: {
                            $sum: {
                                $cond: {
                                    if: { $and: [{ $ne: ['$finalPrice', null] }, { $gt: ['$finalPrice', 0] }] },
                                    then: '$finalPrice',
                                    else: '$totalPrice',
                                },
                            },
                        },
                    },
                },
            ]);

            const currentRevenue = currentMonthRevenue[0]?.revenue || 0;
            const lastRevenue = lastMonthRevenue[0]?.revenue || 0;
            const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

            return {
                overview: {
                    totalProducts,
                    totalUsers,
                    totalCategories,
                    totalOrders,
                    totalRevenue,
                    revenueGrowth: Math.round(revenueGrowth * 100) / 100,
                },
                revenueByDay: last7Days.map((item) => ({
                    day: item.dayMonth,
                    dayName: item.dayName,
                    date: item.date,
                    revenue: item.revenue,
                    orders: item.orders,
                })),
                orderStatus: orderStatus.map((item) => ({
                    status: item._id,
                    count: item.count,
                })),
                topProducts: topProducts.map((item) => ({
                    id: item._id,
                    name: item.product.name,
                    totalSold: item.totalSold,
                    revenue: item.revenue,
                    image: item.product.colors?.[0]?.images?.[0] || null,
                })),
                recentReviews: recentReviews.map((review) => ({
                    id: review._id,
                    user: review.userId?.fullName || 'Ẩn danh',
                    userAvatar: review.userId?.avatar,
                    product: review.productId?.name || 'Sản phẩm đã xóa',
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt,
                })),
                recentOrders: recentOrders.map((order) => ({
                    id: order._id,
                    user: order.fullName,
                    userEmail: order.userId?.email,
                    userAvatar: order.userId?.avatar,
                    totalPrice: order.finalPrice || order.totalPrice,
                    status: order.status,
                    paymentMethod: order.paymentMethod,
                    createdAt: order.createdAt,
                    itemsCount: order.products.length,
                })),
                paymentMethods: paymentMethods.map((method) => ({
                    method: method._id,
                    count: method.count,
                    revenue: method.revenue,
                })),
                revenueByMonth: revenueByMonthFormatted,
            };
            return result;
        } catch (error) {
            throw new Error(`Error getting dashboard data: ${error.message}`);
        }
    }
}

module.exports = new UserService();
