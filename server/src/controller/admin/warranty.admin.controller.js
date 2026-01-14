const WarrantyService = require('../../services/warranty.service');
const { OK } = require('../../core/success.response');

class AdminWarrantyController {
    async getWarrantyByAdmin(req, res) {
        const warranty = await WarrantyService.getWarrantyByAdmin();
        new OK({ message: 'success', metadata: warranty }).send(res);
    }

    async updateWarrantyStatus(req, res) {
        const { warrantyId } = req.params;
        const { status } = req.body;
        const warranty = await WarrantyService.updateWarrantyStatus(warrantyId, status);
        new OK({ message: 'success', metadata: warranty }).send(res);
    }
}

module.exports = new AdminWarrantyController();

