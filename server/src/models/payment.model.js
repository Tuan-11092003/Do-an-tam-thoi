const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelPayment = new Schema(
    {
        userId: { type: String, required: true, ref: 'user' },
        products: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                colorId: { type: Schema.Types.ObjectId, required: true },
                sizeId: { type: Schema.Types.ObjectId, required: true },
                quantity: { type: Number, required: true, default: 1 },
                discount: { type: Number, default: 0 }, // Discount đã áp dụng khi thanh toán (có thể là flash sale)
                priceAfterDiscount: { type: Number }, // Giá sau discount đã áp dụng
            },
        ],
        totalPrice: { type: Number, required: true },
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        finalPrice: { type: Number, default: 0 }, // ✅ giá sau giảm
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
        paymentMethod: { type: String, enum: ['momo', 'vnpay', 'cod', 'zalopay'], required: true },
        orderId: { type: String }, // Lưu orderId từ MoMo/VNPay để tìm payment trong callback
        coupon: {
            code: String,
            discount: Number,
            discountAmount: Number,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('payment', modelPayment);
