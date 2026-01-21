const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        nameCoupon: {
            type: String,
            required: true,
        },
        discount: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        minPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        productUsed: {
            type: [String],
            default: ['all'],
        },
        usedBy: {
            type: [String], // Array of userIds đã sử dụng coupon này
            default: [],
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Coupon', couponSchema);
