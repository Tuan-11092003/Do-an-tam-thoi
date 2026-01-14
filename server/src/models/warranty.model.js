const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'payment', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    reason: { type: String }, // mô tả lỗi, vấn đề
    description: { type: String }, // mô tả chi tiết
    status: {
        type: String,
        enum: ['available', 'pending', 'approved', 'completed', 'rejected'],
        default: 'available', // Trạng thái ban đầu khi warranty được tạo (chưa có yêu cầu đổi trả)
    },
    receivedDate: { type: Date, default: Date.now }, // ngày nhận bảo hành
    returnDate: { type: Date }, // ngày trả lại sản phẩm
    images: { type: [String] },
    emailSent: { type: Boolean, default: false }, // Đánh dấu email đã gửi thành công
});

module.exports = mongoose.model('Warranty', warrantySchema);
