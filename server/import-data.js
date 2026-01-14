const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Category = require('./src/models/category.model');
const Product = require('./src/models/product.model');

// Fix for mongoose ObjectId conversion
mongoose.Types.ObjectId.prototype.valueOf = function() {
    return this.toString();
};

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

// Convert MongoDB export format to regular format
const convertMongoId = (obj) => {
    if (obj && obj.$oid) {
        return new mongoose.Types.ObjectId(obj.$oid);
    }
    if (obj && obj.$date) {
        return new Date(obj.$date);
    }
    return obj;
};

const convertObject = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(convertObject);
    }
    if (obj && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof mongoose.Types.ObjectId)) {
        const converted = {};
        for (const key in obj) {
            if (key === '_id' || key === 'category') {
                converted[key] = convertMongoId(obj[key]);
            } else if (key === 'createdAt' || key === 'updatedAt') {
                converted[key] = convertMongoId(obj[key]);
            } else if (Array.isArray(obj[key])) {
                converted[key] = obj[key].map(item => {
                    if (item && typeof item === 'object' && item._id && item._id.$oid) {
                        return {
                            ...convertObject(item),
                            _id: new mongoose.Types.ObjectId(item._id.$oid)
                        };
                    }
                    return convertObject(item);
                });
            } else {
                converted[key] = convertObject(obj[key]);
            }
        }
        return converted;
    }
    return obj;
};

// Import categories
const importCategories = async () => {
    try {
        const filePath = path.join(__dirname, '../database/shoe.categories.json');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        console.log('Importing categories...');
        for (const category of data) {
            const converted = convertObject(category);
            await Category.findOneAndUpdate(
                { _id: converted._id },
                converted,
                { upsert: true, new: true }
            );
        }
        console.log(`✓ Imported ${data.length} categories`);
    } catch (error) {
        console.error('✗ Error importing categories:', error);
    }
};

// Import products
const importProducts = async () => {
    try {
        const filePath = path.join(__dirname, '../database/shoe.products.json');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        console.log('Importing products...');
        let imported = 0;
        for (const product of data) {
            const converted = convertObject(product);
            await Product.findOneAndUpdate(
                { _id: converted._id },
                converted,
                { upsert: true, new: true }
            );
            imported++;
            if (imported % 10 === 0) {
                console.log(`  Imported ${imported}/${data.length} products...`);
            }
        }
        console.log(`✓ Imported ${imported} products`);
    } catch (error) {
        console.error('✗ Error importing products:', error);
    }
};

// Main function
const main = async () => {
    await connectDB();
    
    console.log('\n=== Starting data import ===\n');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Category.deleteMany({});
    // await Product.deleteMany({});
    
    await importCategories();
    await importProducts();
    
    console.log('\n=== Data import completed ===\n');
    
    mongoose.connection.close();
    process.exit(0);
};

main().catch(error => {
    console.error('✗ Fatal error:', error);
    process.exit(1);
});

