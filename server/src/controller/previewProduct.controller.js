const { OK } = require('../core/success.response');
const PreviewProductService = require('../services/previewProduct.service');
const { uploadMultipleToCloudinary } = require('../utils/uploadCloudinary');

class PreviewProductController {
    async createPreviewProduct(req, res) {
        const { id } = req.user;
        let images = [];
        if (req.files && req.files.length > 0) {
            images = await uploadMultipleToCloudinary(
                req.files.map((f) => ({ buffer: f.buffer, mimetype: f.mimetype })),
                'previewProducts'
            );
        }
        const { productId, orderId, rating, comment } = req.body;
        // Comment không bắt buộc, mặc định là chuỗi rỗng nếu không có
        const commentText = comment && comment.trim() ? comment.trim() : '';
        const previewProduct = await PreviewProductService.create({ userId: id, productId, orderId, images, rating, comment: commentText });
        new OK({ message: 'success', metadata: previewProduct }).send(res);
    }

    async getAllPreviewProduct(req, res) {
        const previewProduct = await PreviewProductService.getAllPreviewProduct();
        new OK({ message: 'success', metadata: previewProduct }).send(res);
    }
}

module.exports = new PreviewProductController();
