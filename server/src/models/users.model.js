const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelUser = new Schema(
    {
        fullName: { type: String, require: true },
        email: { type: String, require: true }, // Bỏ unique: true để cho phép cùng email với typeLogin khác
        password: { type: String, require: true },
        isAdmin: { type: Boolean, default: false },
        address: { type: String, require: false, default: '' },
        phone: { type: String, require: false, default: '' },
        birthDay: { type: Date, require: false, default: null },
        typeLogin: { type: String, enum: ['email', 'google'], require: true },
        avatar: { type: String, require: false, default: '' },
        isOnline: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    },
);

// Tạo compound unique index: cùng email + typeLogin chỉ được có 1 user
// Cho phép cùng email nhưng typeLogin khác nhau là 2 tài khoản riêng
modelUser.index({ email: 1, typeLogin: 1 }, { unique: true });

module.exports = mongoose.model('user', modelUser);
