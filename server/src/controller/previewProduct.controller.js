const { OK } = require('../core/success.response');
const PreviewProductService = require('../services/previewProduct.service');

class PreviewProductController {
    async createPreviewProduct(req, res) {
        const { id } = req.user;
        // Images không bắt buộc, chỉ lấy nếu có
        const images = req.files && req.files.length > 0 ? req.files.map((file) => file.filename) : [];
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
