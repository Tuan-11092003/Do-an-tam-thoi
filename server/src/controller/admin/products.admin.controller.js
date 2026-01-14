const ProductService = require('../../services/product.service');
const { OK } = require('../../core/success.response');

class AdminProductsController {
    async uploadImage(req, res) {
        try {
            const image = req.file;
            if (!image) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const filename = await ProductService.uploadImage(image);
            const imageUrl = `${filename}`;

            res.json({
                success: true,
                url: imageUrl,
                data: {
                    url: imageUrl,
                    filename: filename,
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

