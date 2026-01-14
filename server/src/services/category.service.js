const Category = require('../models/category.model');

class CategoryService {
    async createCategory(categoryName) {
        const category = await Category.create({ categoryName });
        return category;
    }

    async getAllCategory(search = '') {
        let query = {};
        
        // Nếu có search query, tìm kiếm theo categoryName
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive
            query.categoryName = searchRegex;
        }
        
        // Sắp xếp: danh mục cũ nhất bên trái, mới nhất bên phải
        const category = await Category.find(query).sort({ createdAt: 1 });
        return category;
    }

    async updateCategory(id, categoryName) {
        const category = await Category.findByIdAndUpdate(id, { categoryName });
        return category;
    }

    async deleteCategory(id) {
        const category = await Category.findByIdAndDelete(id);
        return category;
    }
}

module.exports = new CategoryService();
