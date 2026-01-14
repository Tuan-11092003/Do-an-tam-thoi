const express = require('express');
const router = express.Router();

const controllerNews = require('../controller/news.controller');

router.get('/get-all', controllerNews.getAllNews);
router.get('/get-by-id', controllerNews.getNewsById);

module.exports = router;

