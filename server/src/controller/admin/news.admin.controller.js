const NewsService = require('../../services/news.service');
const { BadRequestError } = require('../../core/error.response');
const { OK, Created } = require('../../core/success.response');

class AdminNewsController {
    async createNews(req, res) {
        const { title, content, type } = req.body;
        if (!title || !content) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }
        const news = await NewsService.createNews({
            title,
            content,
            type: type || 'other',
        });
        new Created({
            message: 'Tạo tin tức thành công',
            metadata: news,
        }).send(res);
    }

    async updateNews(req, res) {
        const { title, content, type, id } = req.body;
        if (!title || !content || !id) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }
        const news = await NewsService.updateNews({
            id,
            title,
            content,
            type,
        });
        new OK({
            message: 'Cập nhật tin tức thành công',
            metadata: news,
        }).send(res);
    }

    async deleteNews(req, res) {
        const { id } = req.body;
        if (!id) {
            throw new BadRequestError('Vui lòng nhập id');
        }
        const news = await NewsService.deleteNews(id);
        new OK({
            message: 'Xóa tin tức thành công',
            metadata: news,
        }).send(res);
    }
}

module.exports = new AdminNewsController();

