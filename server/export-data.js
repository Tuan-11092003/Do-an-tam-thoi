const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Category = require('./src/models/category.model');
const Product = require('./src/models/product.model');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.CONNECT_DB);
        console.log('✓ MongoDB connected');
    } catch (error) {
        console.error('✗ Failed to connect to MongoDB', error);
        process.exit(1);
    }
};

// Convert Mongoose ObjectId to MongoDB export format
const convertToMongoExportFormat = (obj) => {
    if (obj instanceof mongoose.Types.ObjectId) {
        return { $oid: obj.toString() };
    }
    if (obj instanceof Date) {
        return { $date: obj.toISOString() };
    }
    if (Array.isArray(obj)) {
        return obj.map(convertToMongoExportFormat);
    }
    if (obj && typeof obj === 'object' && obj.constructor === Object) {
        const converted = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                converted[key] = convertToMongoExportFormat(obj[key]);
            }
        }
        return converted;
    }
    return obj;
};

// Export categories
const exportCategories = async () => {
    try {
        console.log('Exporting categories...');
        const categories = await Category.find({}).lean();
        
        const converted = categories.map(cat => {
            const convertedCat = {
                _id: { $oid: cat._id.toString() },
                categoryName: cat.categoryName,
                createdAt: { $date: cat.createdAt.toISOString() },
                updatedAt: { $date: cat.updatedAt.toISOString() },
                __v: cat.__v || 0
            };
            return convertedCat;
        });
        
        const filePath = path.join(__dirname, '../database/shoe.categories.json');
        fs.writeFileSync(filePath, JSON.stringify(converted, null, 2), 'utf8');
        console.log(`✓ Exported ${converted.length} categories to ${filePath}`);
    } catch (error) {
        console.error('✗ Error exporting categories:', error);
    }
};

// Export products
const exportProducts = async () => {
    try {
        console.log('Exporting products...');
        const products = await Product.find({}).populate('category', 'categoryName').lean();
        
        const converted = products.map(product => {
            const convertedProduct = {
                _id: { $oid: product._id.toString() },
                name: product.name,
                category: { $oid: product.category._id.toString() },
                price: product.price,
                discount: product.discount || 0,
                description: product.description || '',
                colors: product.colors || [],
                variants: product.variants || [],
                isFeatured: product.isFeatured || false,
                status: product.status || 'active',
                createdAt: { $date: product.createdAt.toISOString() },
                updatedAt: { $date: product.updatedAt.toISOString() },
                __v: product.__v || 0
            };
            
            // Convert colors array if needed
            if (convertedProduct.colors && Array.isArray(convertedProduct.colors)) {
                convertedProduct.colors = convertedProduct.colors.map(color => {
                    if (color._id) {
                        return {
                            ...color,
                            _id: { $oid: color._id.toString() }
                        };
                    }
                    return color;
                });
            }
            
            return convertedProduct;
        });
        
        const filePath = path.join(__dirname, '../database/shoe.products.json');
        fs.writeFileSync(filePath, JSON.stringify(converted, null, 2), 'utf8');
        console.log(`✓ Exported ${converted.length} products to ${filePath}`);
    } catch (error) {
        console.error('✗ Error exporting products:', error);
    }
};

// Main function
const main = async () => {
    await connectDB();
    
    console.log('\n=== Starting data export ===\n');
    
    await exportCategories();
    await exportProducts();
    
    console.log('\n=== Data export completed ===\n');
    
    mongoose.connection.close();
    process.exit(0);
};

main().catch(error => {
    console.error('✗ Fatal error:', error);
    process.exit(1);
});

