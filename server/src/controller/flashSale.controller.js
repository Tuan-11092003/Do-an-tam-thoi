const FlashSaleService = require('../services/flashSale.service');
const { OK } = require('../core/success.response');

class FlashSaleController {
    async getFlashSaleByDate(req, res) {
        const flashSales = await FlashSaleService.getFlashSaleByDate();
        new OK({
            message: 'Lấy danh sách flash sale thành công',
            metadata: flashSales,
        }).send(res);
    }
}

module.exports = new FlashSaleController();
