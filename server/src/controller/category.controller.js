const CategoryService = require('../services/category.service');
const { OK } = require('../core/success.response');

class CategoryController {
    async getAllCategory(req, res) {
        const { search } = req.query; // Lấy search từ query params
        const category = await CategoryService.getAllCategory(search);
        new OK({ message: 'success', metadata: category }).send(res);
    }
}

module.exports = new CategoryController();
