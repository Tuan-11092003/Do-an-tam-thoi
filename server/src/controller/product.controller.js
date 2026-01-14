const ProductService = require('../services/product.service');
const { OK } = require('../core/success.response');

class ProductController {
    async getAllProduct(req, res) {
        const product = await ProductService.getAllProduct();
        new OK({ message: 'success', metadata: product }).send(res);
    }

    async getProductByCategory(req, res) {
        const { category } = req.params;
        const product = await ProductService.getProductByCategory(category);
        new OK({ message: 'success', metadata: product }).send(res);
    }

    async getProductById(req, res) {
        const { id } = req.params;
        const product = await ProductService.getProductById(id);
        new OK({ message: 'success', metadata: product }).send(res);
    }

    async searchProduct(req, res) {
        const { query } = req.params;
        const product = await ProductService.searchProduct(query);
        new OK({ message: 'success', metadata: product }).send(res);
    }

    async filterProduct(req, res) {
        const { category, priceMin, priceMax, size, color, sortBy, sortOrder, page, limit } = req.query;

        const result = await ProductService.filterProduct(
            category,
            priceMin,
            priceMax,
            size,
            color,
            sortBy,
            sortOrder,
            page,
            limit,
        );

        new OK({ message: 'success', metadata: result }).send(res);
    }
}

module.exports = new ProductController();
