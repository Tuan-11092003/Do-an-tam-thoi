const PaymentService = require('../../services/payment.service');
const { OK } = require('../../core/success.response');

class AdminOrdersController {
    async getAllOrder(req, res) {
        const { search, status } = req.query;
        const orders = await PaymentService.getAllOrder(search, status);
        new OK({ message: 'success', metadata: orders }).send(res);
    }

    async updateOrderStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const order = await PaymentService.updateOrderStatus(id, status);
        new OK({ message: 'Cập nhật trạng thái thành công', metadata: order }).send(res);
    }
}

module.exports = new AdminOrdersController();

