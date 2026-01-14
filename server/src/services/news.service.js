const modelNews = require('../models/news.model');

class NewsService {
    async createNews(data) {
        const news = await modelNews.create(data);
        return news;
    }

    async findAll() {
        const news = await modelNews.find().sort({ createdAt: -1 });
        return news;
    }

    async updateNews(data) {
        const news = await modelNews.findByIdAndUpdate(data.id, data);
        return news;
    }

    async deleteNews(id) {
        const news = await modelNews.findByIdAndDelete(id);
        return news;
    }

    async getNewsById(id) {
        const news = await modelNews.findById(id);
        return news;
    }
}

module.exports = new NewsService();

