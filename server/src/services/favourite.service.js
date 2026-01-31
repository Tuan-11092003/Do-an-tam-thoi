const { BadRequestError } = require('../core/error.response');
const Favourite = require('../models/favourite.model');
const Product = require('../models/product.model');
const modelFlashSale = require('../models/flashSale.model');
const modelPreviewProduct = require('../models/previewProduct.model');
const modelPayment = require('../models/payment.model');

class FavouriteService {
    async createFavourite(userId, productId) {
        const findFavourite = await Favourite.findOne({ userId, productId });
        if (findFavourite) {
            await Favourite.findByIdAndDelete(findFavourite._id);
            await Product.findByIdAndUpdate(productId, { $pull: { favourite: userId } });

            throw new BadRequestError('Đã xóa sản phẩm khỏi yêu thích');
        } else {
            const favourite = await Favourite.create({ userId, productId });
            await Product.findByIdAndUpdate(productId, { $push: { favourite: userId } });
            return favourite;
        }
    }

    async getFavouriteByUserId(userId) {
        const favourites = await Favourite.find({ userId }).populate('productId').lean();
        
        // Lấy Flash Sale đang hoạt động và áp dụng giảm giá cho sản phẩm
        const now = new Date();
        const activeFlashSales = await modelFlashSale.find({
            startDate: { $lte: now },
            endDate: { $gte: now },
        }).lean();

        // Create a map of productId -> flashSale discount
        const flashSaleMap = new Map();
        activeFlashSales.forEach((flashSale) => {
            if (flashSale.productId) {
                const productIdKey = flashSale.productId.toString 
                    ? flashSale.productId.toString() 
                    : String(flashSale.productId);
                flashSaleMap.set(productIdKey, flashSale.discount);
            }
        });

        // Thu thập ID sản phẩm để tính tổng đã bán và đánh giá
        const productIds = favourites
            .map((f) => f.productId?._id)
            .filter(Boolean);
        const productIdStrings = productIds.map((id) => (id.toString ? id.toString() : String(id)));

        // Tính tổng đã bán cho sản phẩm yêu thích (đơn confirmed, shipped, delivered)
        const soldResults = await modelPayment.aggregate([
            {
                $match: {
                    status: { $in: ['confirmed', 'shipped', 'delivered'] },
                },
            },
            { $unwind: '$products' },
            {
                $match: {
                    'products.productId': { $in: productIds },
                },
            },
            {
                $group: {
                    _id: '$products.productId',
                    totalSold: { $sum: '$products.quantity' },
                },
            },
        ]);
        const totalSoldMap = new Map();
        soldResults.forEach((result) => {
            const productIdKey = result._id ? result._id.toString() : String(result._id);
            totalSoldMap.set(productIdKey, result.totalSold);
        });

        // Tính điểm đánh giá trung bình từ PreviewProduct
        const ratingResults = await modelPreviewProduct.aggregate([
            {
                $match: {
                    productId: { $in: productIdStrings },
                },
            },
            {
                $group: {
                    _id: '$productId',
                    averageRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 },
                },
            },
        ]);
        const ratingMap = new Map();
        ratingResults.forEach((result) => {
            const productIdKey = result._id ? result._id.toString() : String(result._id);
            ratingMap.set(productIdKey, {
                averageRating: result.averageRating || 0,
                reviewCount: result.reviewCount || 0,
            });
        });

        // Tính priceAfterDiscount, totalStock, totalSold, averageRating cho từng sản phẩm
        const favouritesWithCalculatedPrices = favourites.map((favourite) => {
            const product = favourite.productId;
            if (!product) return favourite;

            const productObj = product.toObject ? product.toObject() : product;
            const productIdKey = productObj._id ? productObj._id.toString() : null;
            
            // Kiểm tra giảm giá flash sale
            if (productIdKey && flashSaleMap.has(productIdKey)) {
                productObj.discount = flashSaleMap.get(productIdKey);
            }
            
            // Tính giá sau giảm trên server
            const discount = productObj.discount || 0;
            productObj.priceAfterDiscount = productObj.price * (1 - discount / 100);
            
            // Tính tổng tồn kho trên server (tổng stock các biến thể)
            if (productObj.variants && Array.isArray(productObj.variants)) {
                productObj.totalStock = productObj.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
            } else {
                productObj.totalStock = 0;
            }

            // Thêm totalSold và dữ liệu đánh giá (giống danh sách/chi tiết sản phẩm)
            productObj.totalSold = productIdKey ? totalSoldMap.get(productIdKey) || 0 : 0;
            const ratingData = productIdKey ? ratingMap.get(productIdKey) : null;
            productObj.averageRating = ratingData ? ratingData.averageRating : 0;
            productObj.reviewCount = ratingData ? ratingData.reviewCount : 0;
            
            return {
                ...favourite,
                productId: productObj,
            };
        });

        return favouritesWithCalculatedPrices;
    }
}

module.exports = new FavouriteService();
