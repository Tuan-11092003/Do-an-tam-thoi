const modelCounpon = require('../models/counpon.model');
const modelCart = require('../models/cart.model');

class CouponService {
    async create({ nameCoupon, discount, quantity, startDate, endDate, minPrice, productUsed = ['all'] }) {
        // Kiểm tra trùng tên
        const existingCoupon = await modelCounpon.findOne({ nameCoupon: nameCoupon.toUpperCase() });
        if (existingCoupon) {
            throw new Error('Mã giảm giá đã tồn tại!');
        }
        const coupon = await modelCounpon.create({
            nameCoupon: nameCoupon.toUpperCase(),
            discount,
            quantity,
            startDate,
            endDate,
            minPrice,
            productUsed,
        });
        return coupon;
    }

    async findAll() {
        const coupons = await modelCounpon.find();
        return coupons;
    }

    async findActive(userId = null) {
        const today = new Date();
        const query = {
            startDate: { $lte: today },
            endDate: { $gte: today },
            quantity: { $gt: 0 },
        };
        
        // Không lọc coupon đã dùng, nhưng sẽ đánh dấu trong response
        const coupons = await modelCounpon.find(query).lean();
        
        // Nếu có userId, thêm trường isUsed để frontend biết coupon nào user đã dùng
        if (userId) {
            const userIdStr = String(userId); // Convert sang string để so sánh
            return coupons.map(coupon => ({
                ...coupon,
                isUsed: coupon.usedBy && Array.isArray(coupon.usedBy) && coupon.usedBy.some(usedId => String(usedId) === userIdStr)
            }));
        }
        
        // Nếu không có userId, gán isUsed = false cho tất cả
        return coupons.map(coupon => ({
            ...coupon,
            isUsed: false
        }));
    }

    async update({ id, nameCoupon, discount, quantity, startDate, endDate, minPrice, productUsed }) {
        // Kiểm tra trùng tên (loại trừ chính nó)
        const existingCoupon = await modelCounpon.findOne({
            nameCoupon: nameCoupon.toUpperCase(),
            _id: { $ne: id },
        });
        if (existingCoupon) {
            throw new Error('Mã giảm giá đã tồn tại!');
        }
        const coupon = await modelCounpon.findByIdAndUpdate(id, {
            nameCoupon: nameCoupon.toUpperCase(),
            discount,
            quantity,
            startDate,
            endDate,
            minPrice,
            productUsed,
        });
        return coupon;
    }

    async delete(id) {
        const coupon = await modelCounpon.findByIdAndDelete(id);
        return coupon;
    }

    async findById(id) {
        const coupon = await modelCounpon.findOne({ nameCoupon: id });
        return coupon;
    }
}

module.exports = new CouponService();
