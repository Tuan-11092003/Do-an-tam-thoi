const FlashSale = require('../models/flashSale.model');
const { BadRequestError } = require('../core/error.response');
const modelPreviewProduct = require('../models/previewProduct.model');
const modelPayment = require('../models/payment.model');

class FlashSaleService {
    async createFlashSale(data) {
        // Kiểm tra trùng sản phẩm (đã có flash sale đang chạy hoặc sắp diễn ra)
        const now = new Date();
        const productIds = data.map(item => item.productId?.toString() || item.productId);
        
        // Tìm flash sale đang hoạt động hoặc sắp diễn ra cho các sản phẩm này
        const existingFlashSales = await FlashSale.find({
            productId: { $in: productIds },
            $or: [
                // Đang chạy: startDate <= now <= endDate
                {
                    startDate: { $lte: now },
                    endDate: { $gte: now }
                },
                // Sắp diễn ra: startDate > now
                {
                    startDate: { $gt: now }
                }
            ]
        });
        
        if (existingFlashSales.length > 0) {
            const duplicateProductIds = existingFlashSales.map(fs => 
                fs.productId?.toString() || fs.productId
            );
            const duplicates = productIds.filter(id => 
                duplicateProductIds.includes(id?.toString() || id)
            );
            throw new BadRequestError(
                `Sản phẩm đã có flash sale đang hoạt động hoặc sắp diễn ra. Vui lòng xóa flash sale cũ trước khi tạo mới.`
            );
        }
        
        await Promise.all(
            data.map(async (item) => {
                await FlashSale.create(item);
            }),
        );
        return data;
    }

    async getAllFlashSale() {
        const flashSales = await FlashSale.find().populate('productId');
        
        // Tính trạng thái từng flash sale (đang chạy, sắp diễn ra, hết hạn)
        const now = new Date();
        const flashSalesWithStatus = flashSales.map((sale) => {
            const saleObj = sale.toObject ? sale.toObject() : sale;
            const startDate = new Date(saleObj.startDate);
            const endDate = new Date(saleObj.endDate);
            
            if (now < startDate) {
                saleObj.status = 'scheduled';
            } else if (now > endDate) {
                saleObj.status = 'expired';
            } else {
                saleObj.status = 'active';
            }
            
            return saleObj;
        });
        
        return flashSalesWithStatus;
    }

    async getFlashSaleByDate() {
        const today = new Date();
        const flashSales = await FlashSale.find({
            startDate: { $lte: today },
            endDate: { $gte: today },
        }).populate('productId');
        
        // Lấy tất cả ID sản phẩm
        const productIds = flashSales
            .map(sale => sale.productId?._id || sale.productId)
            .filter(id => id);
        
        // Chuyển sang chuỗi để khớp previewProduct (productId trong model PreviewProduct là String)
        const productIdStrings = productIds.map(id => id.toString ? id.toString() : String(id));

        // Tính tổng đã bán cho tất cả sản phẩm theo lô bằng aggregation
        const soldResults = await modelPayment.aggregate([
            {
                $match: {
                    status: { $in: ['confirmed', 'shipped', 'delivered'] }
                }
            },
            {
                $unwind: '$products'
            },
            {
                $match: {
                    'products.productId': { $in: productIds }
                }
            },
            {
                $group: {
                    _id: '$products.productId',
                    totalSold: { $sum: '$products.quantity' }
                }
            }
        ]);

        // Tạo map productId -> totalSold
        const totalSoldMap = new Map();
        soldResults.forEach((result) => {
            const productIdKey = result._id ? result._id.toString() : String(result._id);
            totalSoldMap.set(productIdKey, result.totalSold);
        });

        // Tính đánh giá cho tất cả sản phẩm theo lô
        const ratingResults = await modelPreviewProduct.aggregate([
            {
                $match: {
                    productId: { $in: productIdStrings }
                }
            },
            {
                $group: {
                    _id: '$productId',
                    averageRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 }
                }
            }
        ]);

        // Tạo map productId -> dữ liệu đánh giá
        const ratingMap = new Map();
        ratingResults.forEach((result) => {
            const productIdKey = result._id ? result._id.toString() : String(result._id);
            ratingMap.set(productIdKey, {
                averageRating: result.averageRating || 0,
                reviewCount: result.reviewCount || 0
            });
        });
        
        // Tính priceAfterDiscount, totalStock, averageRating, totalSold cho từng sản phẩm flash sale
        const flashSalesWithPrice = flashSales.map((sale) => {
            const saleObj = sale.toObject ? sale.toObject() : sale;
            if (saleObj.productId && saleObj.productId.price) {
                const productIdKey = saleObj.productId._id 
                    ? (saleObj.productId._id.toString ? saleObj.productId._id.toString() : String(saleObj.productId._id))
                    : null;
                
                // Dùng phần trăm giảm của flash sale, không dùng discount sản phẩm
                const discount = saleObj.discount || 0;
                saleObj.productId.priceAfterDiscount = saleObj.productId.price * (1 - discount / 100);
                // Cập nhật discount trùng với flash sale
                saleObj.productId.discount = discount;
                
                // Tính tổng tồn kho trên server (tổng stock các biến thể)
                if (saleObj.productId.variants && Array.isArray(saleObj.productId.variants)) {
                    saleObj.productId.totalStock = saleObj.productId.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
                } else {
                    saleObj.productId.totalStock = 0;
                }
                
                // Thêm tổng đã bán
                saleObj.productId.totalSold = totalSoldMap.get(productIdKey) || 0;

                // Thêm dữ liệu đánh giá
                const ratingData = ratingMap.get(productIdKey);
                saleObj.productId.averageRating = ratingData ? ratingData.averageRating : 0;
                saleObj.productId.reviewCount = ratingData ? ratingData.reviewCount : 0;
            }
            return saleObj;
        });
        
        return flashSalesWithPrice;
    }

    async deleteFlashSale(id) {
        const flashSale = await FlashSale.findByIdAndDelete(id);
        return flashSale;
    }

    async updateFlashSale(id, data) {
        const flashSale = await FlashSale.findByIdAndUpdate(
            id,
            {
                productId: data.productId,
                discount: data.discount,
                startDate: data.startDate,
                endDate: data.endDate,
            },
            { new: true },
        ).populate('productId');
        return flashSale;
    }
}

module.exports = new FlashSaleService();
