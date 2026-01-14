const { BadRequestError } = require('../core/error.response');
const Favourite = require('../models/favourite.model');
const Product = require('../models/product.model');
const modelFlashSale = require('../models/flashSale.model');

class FavouriteService {
    async createFavourite(userId, productId) {
        const findFavourite = await Favourite.findOne({ userId, productId });
        if (findFavourite) {
            await Favourite.findByIdAndDelete(findFavourite._id);
            await Product.findByIdAndUpdate(productId, { $pull: { favourite: userId } });

            throw new BadRequestError('Đã sản phẩm khỏi yêu thích');
        } else {
            const favourite = await Favourite.create({ userId, productId });
            await Product.findByIdAndUpdate(productId, { $push: { favourite: userId } });
            return favourite;
        }
    }

    async getFavouriteByUserId(userId) {
        const favourites = await Favourite.find({ userId }).populate('productId').lean();
        
        // Get active Flash Sales and apply discount to products
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

        // Calculate priceAfterDiscount and totalStock for each product
        const favouritesWithCalculatedPrices = favourites.map((favourite) => {
            const product = favourite.productId;
            if (!product) return favourite;

            const productObj = product.toObject ? product.toObject() : product;
            const productIdKey = productObj._id ? productObj._id.toString() : null;
            
            // Check for flash sale discount
            if (productIdKey && flashSaleMap.has(productIdKey)) {
                productObj.discount = flashSaleMap.get(productIdKey);
            }
            
            // Calculate priceAfterDiscount on server
            const discount = productObj.discount || 0;
            productObj.priceAfterDiscount = productObj.price * (1 - discount / 100);
            
            // Calculate totalStock on server (sum of all variant stocks)
            if (productObj.variants && Array.isArray(productObj.variants)) {
                productObj.totalStock = productObj.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
            } else {
                productObj.totalStock = 0;
            }
            
            return {
                ...favourite,
                productId: productObj,
            };
        });

        return favouritesWithCalculatedPrices;
    }
}

module.exports = new FavouriteService();
