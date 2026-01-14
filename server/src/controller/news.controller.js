const NewsService = require('../services/news.service');
const { BadRequestError } = require('../core/error.response');
const { OK, Created } = require('../core/success.response');

class NewsController {
    async getAllNews(req, res, next) {
        const news = await NewsService.findAll();
        new OK({
            message: 'Lấy tất cả tin tức thành công',
            metadata: news,
        }).send(res);
    }

    async getNewsById(req, res, next) {
        const { id } = req.query;
        const news = await NewsService.getNewsById(id);
        new OK({
            message: 'Lấy tin tức thành công',
            metadata: news,
        }).send(res);
    }
}

module.exports = new NewsController();

