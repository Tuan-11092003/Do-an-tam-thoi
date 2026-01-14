const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelOtp = new Schema(
    {
        email: { type: String, required: true },
        otp: { type: String, required: true },
    },
    {
        timestamps: true,
    },
);

// TTL Index: Tự động xóa OTP sau 5 phút
modelOtp.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

module.exports = mongoose.model('otp', modelOtp);
