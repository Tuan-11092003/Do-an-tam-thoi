const mongoose = require('mongoose');
const modelProduct = require('../models/product.model');
const modelCategory = require('../models/category.model');
const modelFlashSale = require('../models/flashSale.model');
const modelPreviewProduct = require('../models/previewProduct.model');
const modelPayment = require('../models/payment.model');

class ProductService {
    async uploadImage(image) {
        return image.filename;
    }

    async createProduct(
        name,
        category,
        price,
        discount,
        description,
        sizes,
        colors,
        images,
        stock,
        isFeatured,
        status,
        variants,
    ) {
        const product = await modelProduct.create({
            name,
            category,
            price,
            discount,
            description,
            sizes,
            colors,
            images,
            stock,
            isFeatured,
            status,
            variants,
        });
        return product;
    }

    async getAllProduct() {
        const products = await modelProduct.find().populate('category', 'categoryName').lean();
        
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

        // Get all product IDs for batch calculation
        const productIds = products.map(p => p._id);
        // Convert to strings for previewProduct matching (productId is String in previewProduct model)
        const productIdStrings = productIds.map(id => id.toString ? id.toString() : String(id));

        // Calculate totalSold for all products in batch using aggregation
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

        // Create a map of productId -> totalSold
        const totalSoldMap = new Map();
        soldResults.forEach((result) => {
            const productIdKey = result._id ? result._id.toString() : String(result._id);
            totalSoldMap.set(productIdKey, result.totalSold);
        });

        // Calculate ratings for all products in batch
        // Note: productId in previewProduct is String, so we need to match with strings
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

        // Create a map of productId -> rating data
        const ratingMap = new Map();
        ratingResults.forEach((result) => {
            const productIdKey = result._id ? result._id.toString() : String(result._id);
            ratingMap.set(productIdKey, {
                averageRating: result.averageRating || 0,
                reviewCount: result.reviewCount || 0
            });
        });

        // Apply Flash Sale discount to each product in search results and calculate priceAfterDiscount
        const productsWithFlashSale = products.map((product) => {
            const productObj = product.toObject ? product.toObject() : product;
            const productIdKey = productObj._id ? productObj._id.toString() : null;
            
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

            // Add totalSold
            productObj.totalSold = totalSoldMap.get(productIdKey) || 0;

            // Add rating data
            const ratingData = ratingMap.get(productIdKey);
            productObj.averageRating = ratingData ? ratingData.averageRating : 0;
            productObj.reviewCount = ratingData ? ratingData.reviewCount : 0;
            
            return productObj;
        });
        
        return productsWithFlashSale;
    }

    async updateProduct(
        id,
        name,
        category,
        price,
        discount,
        description,
        sizes,
        colors,
        images,
        stock,
        isFeatured,
        status,
        variants,
    ) {
        const product = await modelProduct
            .findByIdAndUpdate(
                id,
                {
                    name,
                    category,
                    price,
                    discount,
                    description,
                    sizes,
                    colors,
                    images,
                    stock,
                    isFeatured,
                    status,
                    variants,
                },
                { new: true },
            )
            .populate('category');
        return product;
    }

    async deleteProduct(id) {
        const product = await modelProduct.findByIdAndDelete(id);
        return product;
    }

    async getProductByCategory(category) {
        const products = await modelProduct.find({ category }).lean();
        
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

        // Get all product IDs for batch calculation
        const productIds = products.map(p => p._id);
        // Convert to strings for previewProduct matching (productId is String in previewProduct model)
        const productIdStrings = productIds.map(id => id.toString ? id.toString() : String(id));

        // Calculate totalSold for all products in batch using aggregation
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

        // Create a map of productId -> totalSold
        const totalSoldMap = new Map();
        soldResults.forEach((result) => {
            const productIdKey = result._id ? result._id.toString() : String(result._id);
            totalSoldMap.set(productIdKey, result.totalSold);
        });

        // Calculate ratings for all products in batch
        // Note: productId in previewProduct is String, so we need to match with strings
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

        // Create a map of productId -> rating data
        const ratingMap = new Map();
        ratingResults.forEach((result) => {
            const productIdKey = result._id ? result._id.toString() : String(result._id);
            ratingMap.set(productIdKey, {
                averageRating: result.averageRating || 0,
                reviewCount: result.reviewCount || 0
            });
        });

        // Apply Flash Sale discount to products and calculate priceAfterDiscount
        const productsWithFlashSale = products.map((product) => {
            const productIdKey = product._id 
                ? (product._id.toString ? product._id.toString() : String(product._id))
                : null;
            
            if (productIdKey && flashSaleMap.has(productIdKey)) {
                product.discount = flashSaleMap.get(productIdKey);
            }
            
            // Calculate priceAfterDiscount on server
            const discount = product.discount || 0;
            product.priceAfterDiscount = product.price * (1 - discount / 100);
            
            // Calculate totalStock on server (sum of all variant stocks)
            if (product.variants && Array.isArray(product.variants)) {
                product.totalStock = product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
            } else {
                product.totalStock = 0;
            }

            // Add totalSold
            product.totalSold = totalSoldMap.get(productIdKey) || 0;

            // Add rating data
            const ratingData = ratingMap.get(productIdKey);
            product.averageRating = ratingData ? ratingData.averageRating : 0;
            product.reviewCount = ratingData ? ratingData.reviewCount : 0;
            
            return product;
        });

        return productsWithFlashSale;
    }

    async getProductById(id) {
        const product = await modelProduct.findById(id).populate('category', 'categoryName');
        if (!product) return null;
        
        // Check for active Flash Sale (only apply if within date range)
        const now = new Date();
        const findFlashSale = await modelFlashSale.findOne({
            productId: id,
            startDate: { $lte: now },
            endDate: { $gte: now },
        });
        
        // Convert to plain object to ensure priceAfterDiscount is serialized correctly
        const productObj = product.toObject ? product.toObject() : product;
        
        // Only override discount if Flash Sale is active
        // Otherwise, keep the original product discount
        if (findFlashSale) {
            productObj.discount = findFlashSale.discount;
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

        const findProductRelated = (await modelProduct.find({ category: product.category })).filter(
            (item) => item._id.toString() !== id.toString(),
        );

        if (findProductRelated && findProductRelated.length > 0) {
            // Get IDs of related products for batch queries
            const relatedProductIds = findProductRelated.map((p) => p._id.toString());
            const relatedProductObjectIds = findProductRelated.map((p) => p._id);

            // Calculate totalSold for all related products in batch
            const relatedSoldResults = await modelPayment.aggregate([
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
                        'products.productId': { $in: relatedProductObjectIds }
                    }
                },
                {
                    $group: {
                        _id: '$products.productId',
                        totalSold: { $sum: '$products.quantity' }
                    }
                }
            ]);

            // Create a map of productId -> totalSold
            const relatedTotalSoldMap = new Map();
            relatedSoldResults.forEach((result) => {
                const productIdKey = result._id ? result._id.toString() : String(result._id);
                relatedTotalSoldMap.set(productIdKey, result.totalSold);
            });

            // Calculate ratings for all related products in batch
            const relatedRatingResults = await modelPreviewProduct.aggregate([
                {
                    $match: {
                        productId: { $in: relatedProductIds }
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

            // Create a map of productId -> rating data
            const relatedRatingMap = new Map();
            relatedRatingResults.forEach((result) => {
                const productIdKey = result._id ? result._id.toString() : String(result._id);
                relatedRatingMap.set(productIdKey, {
                    averageRating: result.averageRating || 0,
                    reviewCount: result.reviewCount || 0
                });
            });

            // Convert related products to plain objects and calculate priceAfterDiscount, totalStock, averageRating, totalSold
            productObj.productRelated = findProductRelated.map((relatedProduct) => {
                const relatedObj = relatedProduct.toObject ? relatedProduct.toObject() : relatedProduct;
                const relatedDiscount = relatedObj.discount || 0;
                relatedObj.priceAfterDiscount = relatedObj.price * (1 - relatedDiscount / 100);
                
                // Calculate totalStock for related products
                if (relatedObj.variants && Array.isArray(relatedObj.variants)) {
                    relatedObj.totalStock = relatedObj.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
                } else {
                    relatedObj.totalStock = 0;
                }

                // Add totalSold
                const productIdKey = relatedObj._id ? relatedObj._id.toString() : String(relatedObj._id);
                relatedObj.totalSold = relatedTotalSoldMap.get(productIdKey) || 0;

                // Add rating data
                const ratingData = relatedRatingMap.get(productIdKey);
                relatedObj.averageRating = ratingData ? ratingData.averageRating : 0;
                relatedObj.reviewCount = ratingData ? ratingData.reviewCount : 0;

                return relatedObj;
            });
        }
        
        const findPreviewProduct = await modelPreviewProduct.find({ productId: id }).populate('userId');

        if (findPreviewProduct && findPreviewProduct.length > 0) {
            productObj.previewProduct = findPreviewProduct;
        }

        // Calculate totalSold from payments (only confirmed, shipped, or delivered orders)
        const productObjectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
        
        const soldResult = await modelPayment.aggregate([
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
                    'products.productId': productObjectId
                }
            },
            {
                $group: {
                    _id: null,
                    totalSold: { $sum: '$products.quantity' }
                }
            }
        ]);

        productObj.totalSold = soldResult.length > 0 ? soldResult[0].totalSold : 0;
        
        return productObj;
    }
    async searchProduct(query) {
        // Decode query từ URL và escape các ký tự đặc biệt trong regex
        const decodedQuery = decodeURIComponent(query);
        // Escape các ký tự đặc biệt trong regex để tránh lỗi
        const escapedQuery = decodedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const products = await modelProduct.find({ name: { $regex: escapedQuery, $options: 'i' } });
        // Apply Flash Sale discount to search results
        const now = new Date();
        const activeFlashSales = await modelFlashSale.find({
            startDate: { $lte: now },
            endDate: { $gte: now },
        });
        
        const flashSaleMap = new Map();
        activeFlashSales.forEach((flashSale) => {
            if (flashSale.productId) {
                flashSaleMap.set(flashSale.productId.toString(), flashSale.discount);
            }
        });
        
        // Apply Flash Sale discount to each product in search results and calculate priceAfterDiscount
        const productsWithFlashSale = products.map((product) => {
            const productObj = product.toObject ? product.toObject() : product;
            const productIdKey = productObj._id ? productObj._id.toString() : null;
            
            if (productIdKey && flashSaleMap.has(productIdKey)) {
                productObj.discount = flashSaleMap.get(productIdKey);
            }
            
            // Calculate priceAfterDiscount on server
            const discount = productObj.discount || 0;
            productObj.priceAfterDiscount = productObj.price * (1 - discount / 100);
            
            return productObj;
        });
        
        return productsWithFlashSale;
        const findProductRelated = (await modelProduct.find({ category: product.category })).filter(
            (item) => item._id.toString() !== product._id.toString(),
        );
        if (findProductRelated) {
            product.productRelated = findProductRelated;
        }
        return product;
    }

    async filterProduct(
        category,
        priceMin,
        priceMax,
        size,
        color,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 12,
    ) {
        try {
            // Build filter query
            let filterQuery = { status: 'active' };

            // Category filter
            if (category && category !== 'all') {
                filterQuery.category = category;
            }

            // Price filter
            if (priceMin || priceMax) {
                filterQuery.price = {};
                if (priceMin) filterQuery.price.$gte = Number(priceMin);
                if (priceMax) filterQuery.price.$lte = Number(priceMax);
            }

            // Size filter
            if (size && size !== 'all') {
                filterQuery['variants.size'] = size;
            }

            // Color filter
            if (color && color !== 'all') {
                filterQuery['colors.name'] = { $regex: color, $options: 'i' };
            }

            // Build sort query
            let sortQuery = {};
            switch (sortBy) {
                case 'price_asc':
                    sortQuery.price = 1;
                    break;
                case 'price_desc':
                    sortQuery.price = -1;
                    break;
                case 'name':
                    sortQuery.name = 1;
                    break;
                case 'newest':
                    sortQuery.createdAt = -1;
                    break;
                case 'oldest':
                    sortQuery.createdAt = 1;
                    break;
                default:
                    sortQuery.createdAt = -1;
            }

            // Calculate pagination
            const skip = (page - 1) * limit;

            // Execute query with pagination
            const products = await modelProduct
                .find(filterQuery)
                .populate('category', 'categoryName')
                .sort(sortQuery)
                .skip(skip)
                .limit(limit);

            // Get active Flash Sales and apply discount to products
            // Flash Sale discount will override product's original discount
            const now = new Date();
            const activeFlashSales = await modelFlashSale.find({
                startDate: { $lte: now },
                endDate: { $gte: now },
            });

            // Create a map of productId -> flashSale discount for quick lookup
            const flashSaleMap = new Map();
            activeFlashSales.forEach((flashSale) => {
                if (flashSale.productId) {
                    const productIdKey = flashSale.productId.toString();
                    flashSaleMap.set(productIdKey, flashSale.discount);
                }
            });

            // Get all product IDs for batch calculation
            const productIds = products.map(p => p._id);
            // Convert to strings for previewProduct matching (productId is String in previewProduct model)
            const productIdStrings = productIds.map(id => id.toString ? id.toString() : String(id));

            // Calculate totalSold for all products in batch using aggregation
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

            // Create a map of productId -> totalSold
            const totalSoldMap = new Map();
            soldResults.forEach((result) => {
                const productIdKey = result._id ? result._id.toString() : String(result._id);
                totalSoldMap.set(productIdKey, result.totalSold);
            });

            // Calculate ratings for all products in batch
            // Note: productId in previewProduct is String, so we need to match with strings
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

            // Create a map of productId -> rating data
            const ratingMap = new Map();
            ratingResults.forEach((result) => {
                const productIdKey = result._id ? result._id.toString() : String(result._id);
                ratingMap.set(productIdKey, {
                    averageRating: result.averageRating || 0,
                    reviewCount: result.reviewCount || 0
                });
            });

            // Apply Flash Sale discount to products (override original discount if Flash Sale exists)
            const productsWithFlashSale = products.map((product) => {
                const productObj = product.toObject ? product.toObject() : product;
                const productIdKey = productObj._id ? productObj._id.toString() : null;
                
                // If product has active Flash Sale, override discount
                // Otherwise, keep the original product discount
                if (productIdKey && flashSaleMap.has(productIdKey)) {
                    productObj.discount = flashSaleMap.get(productIdKey);
                }
                // If no Flash Sale, productObj.discount remains as original from database
                
                // Calculate priceAfterDiscount on server
                const discount = productObj.discount || 0;
                productObj.priceAfterDiscount = productObj.price * (1 - discount / 100);
                
                // Calculate totalStock on server (sum of all variant stocks)
                if (productObj.variants && Array.isArray(productObj.variants)) {
                    productObj.totalStock = productObj.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
                } else {
                    productObj.totalStock = 0;
                }

                // Add totalSold
                productObj.totalSold = totalSoldMap.get(productIdKey) || 0;

                // Add rating data
                const ratingData = ratingMap.get(productIdKey);
                productObj.averageRating = ratingData ? ratingData.averageRating : 0;
                productObj.reviewCount = ratingData ? ratingData.reviewCount : 0;
                
                return productObj;
            });

            // Get total count for pagination
            const totalProducts = await modelProduct.countDocuments(filterQuery);
            const totalPages = Math.ceil(totalProducts / limit);

            // Get filter options for UI
            const categories = await modelCategory.find();

            // Get unique sizes and colors for filters
            const allProducts = await modelProduct.find({ status: 'active' });
            const uniqueSizes = [...new Set(allProducts.flatMap((p) => p.variants?.map((v) => v.size) || []))].sort();

            // Get unique colors and normalize them (group similar names)
            const allColors = allProducts.flatMap((p) => p.colors?.map((c) => c.name) || []);
            const colorMap = new Map();
            const colorCountMap = new Map();

            // Group colors by normalized name (lowercase, trimmed)
            allColors.forEach((color) => {
                if (!color) return;
                const normalized = color.toLowerCase().trim();

                if (!colorMap.has(normalized)) {
                    // Store the first occurrence (original case) as the display name
                    colorMap.set(normalized, color);
                    colorCountMap.set(normalized, 0);
                }
                colorCountMap.set(normalized, colorCountMap.get(normalized) + 1);
            });

            // Get unique colors with counts, sorted alphabetically
            const uniqueColors = Array.from(colorMap.entries())
                .map(([normalized, displayName]) => ({
                    name: displayName,
                    normalized: normalized,
                    count: colorCountMap.get(normalized),
                }))
                .sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));

            const result = {
                products: productsWithFlashSale,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalProducts,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    limit,
                },
                filters: {
                    categories,
                    sizes: uniqueSizes,
                    colors: uniqueColors,
                    priceRanges: [
                        { label: 'Dưới 500K', min: 0, max: 500000 },
                        { label: '500K - 1M', min: 500000, max: 1000000 },
                        { label: '1M - 2M', min: 1000000, max: 2000000 },
                        { label: '2M - 5M', min: 2000000, max: 5000000 },
                        { label: 'Trên 5M', min: 5000000, max: null },
                    ],
                },
                appliedFilters: {
                    category,
                    priceMin,
                    priceMax,
                    size,
                    color,
                    sortBy,
                    sortOrder,
                },
            };

            return result;
        } catch (error) {
            throw new Error(`Error filtering products: ${error.message}`);
        }
    }
}

module.exports = new ProductService();
