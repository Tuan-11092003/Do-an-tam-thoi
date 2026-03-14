const ProductService = require('../../services/product.service');
const { OK } = require('../../core/success.response');

class AdminProductsController {
    async uploadImage(req, res) {
        try {
            if (!req.file || !req.file.buffer) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const { uploadToCloudinary } = require('../../utils/uploadCloudinary');
            const { secure_url } = await uploadToCloudinary(req.file.buffer, 'products', req.file.mimetype);
            res.json({
                success: true,
                url: secure_url,
                data: {
                    url: secure_url,
                    filename: secure_url,
                },
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Upload failed' });
        }
    }

    async createProduct(req, res) {
        const {
            name,
            category,
            price,
            discount,
            description,
            sizes,
            colors,
            images,
            stock,
            isFeatured,
            status,
            variants,
        } = req.body;
        const product = await ProductService.createProduct(
            name,
            category,
            price,
            discount,
            description,
            sizes,
            colors,
            images,
            stock,
            isFeatured,
            status,
            variants,
        );
        new OK({ message: 'success', metadata: product }).send(res);
    }

    async updateProduct(req, res) {
        const { id } = req.params;
        const {
            name,
            category,
            price,
            discount,
            description,
            sizes,
            colors,
            images,
            stock,
            isFeatured,
            status,
            variants,
        } = req.body;
        const product = await ProductService.updateProduct(
            id,
            name,
            category,
            price,
            discount,
            description,
            sizes,
            colors,
            images,
            stock,
            isFeatured,
            status,
            variants,
        );
        new OK({ message: 'success', metadata: product }).send(res);
    }

    async deleteProduct(req, res) {
        const { id } = req.params;
        const product = await ProductService.deleteProduct(id);
        new OK({ message: 'success', metadata: product }).send(res);
    }
}

module.exports = new AdminProductsController();

