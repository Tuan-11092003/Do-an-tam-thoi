const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelPreviewProduct = new Schema(
    {
        userId: { type: String, require: true, ref: 'user' },
        productId: { type: String, require: true, ref: 'Product' },
        orderId: { type: Schema.Types.ObjectId, ref: 'payment', required: false }, // Thêm orderId để phân biệt theo đơn hàng
        images: { type: [String], default: [] },
        rating: { type: Number, require: true },
        comment: { type: String, default: '' },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('previewProduct', modelPreviewProduct);
