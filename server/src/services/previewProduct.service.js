const modelPreviewProduct = require('../models/previewProduct.model');

class PreviewProductService {
    async create({ userId, productId, orderId, images, rating, comment }) {
        const previewProduct = await modelPreviewProduct.create({ userId, productId, orderId, images, rating, comment });
        return previewProduct;
    }

    async getAllPreviewProduct() {
        const previewProduct = await modelPreviewProduct.find().populate('userId').populate('productId');
        return previewProduct;
    }
}

module.exports = new PreviewProductService();
