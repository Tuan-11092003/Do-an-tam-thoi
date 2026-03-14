const WarrantyService = require('../services/warranty.service');
const { uploadMultipleToCloudinary } = require('../utils/uploadCloudinary');
const { OK } = require('../core/success.response');

class WarrantyController {
    async getWarrantyByUserId(req, res, next) {
        const { id } = req.user;
        const warranty = await WarrantyService.getWarrantyByUserId(id);
        new OK({ message: 'success', metadata: warranty }).send(res);
    }

    async requestWarranty(req, res, next) {
        const { reason, warrantyId, status, description } = req.body;
        const files = req.files && req.files.length > 0 ? req.files : [];
        const images = files.length > 0
            ? await uploadMultipleToCloudinary(
                  files.map((f) => ({ buffer: f.buffer, mimetype: f.mimetype })),
                  'warranty'
              )
            : [];
        const warranty = await WarrantyService.createWarranty(reason, warrantyId, images, status, description);
        new OK({ message: 'success', metadata: warranty }).send(res);
    }
}

module.exports = new WarrantyController();
