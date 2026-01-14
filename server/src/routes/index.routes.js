const userRoutes = require('./users.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const couponRoutes = require('./counpon.routes');
const paymentRoutes = require('./payment.routes');
const warrantyRoutes = require('./warranty.routes');
const messageRoutes = require('./message.routes');
const conversationRoutes = require('./conversation.routes');
const flashSaleRoutes = require('./flashSale.routes');
const previewProductRoutes = require('./previewProduct.routes');
const favouriteRoutes = require('./favourite.routes');
const newsRoutes = require('./news.routes');

// Admin routes
const adminDashboardRoutes = require('./admin/dashboard.admin.routes');
const adminUsersRoutes = require('./admin/users.admin.routes');
const adminProductsRoutes = require('./admin/products.admin.routes');
const adminCategoriesRoutes = require('./admin/categories.admin.routes');
const adminCouponsRoutes = require('./admin/coupons.admin.routes');
const adminOrdersRoutes = require('./admin/orders.admin.routes');
const adminWarrantyRoutes = require('./admin/warranty.admin.routes');
const adminFlashSaleRoutes = require('./admin/flashSale.admin.routes');
const adminNewsRoutes = require('./admin/news.admin.routes');
const adminConversationsRoutes = require('./admin/conversations.admin.routes');

function routes(app) {
    // Client routes
    app.use('/api/users', userRoutes);
    app.use('/api/category', categoryRoutes);
    app.use('/api/product', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/coupon', couponRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/warranty', warrantyRoutes);
    app.use('/api/message', messageRoutes);
    app.use('/api/conversation', conversationRoutes);
    app.use('/api/flashSale', flashSaleRoutes);
    app.use('/api/previewProduct', previewProductRoutes);
    app.use('/api/favourite', favouriteRoutes);
    app.use('/api/news', newsRoutes);

    // Admin routes
    app.use('/api/admin/dashboard', adminDashboardRoutes);
    app.use('/api/admin/users', adminUsersRoutes);
    app.use('/api/admin/products', adminProductsRoutes);
    app.use('/api/admin/categories', adminCategoriesRoutes);
    app.use('/api/admin/coupons', adminCouponsRoutes);
    app.use('/api/admin/orders', adminOrdersRoutes);
    app.use('/api/admin/warranty', adminWarrantyRoutes);
    app.use('/api/admin/flashSale', adminFlashSaleRoutes);
    app.use('/api/admin/news', adminNewsRoutes);
    app.use('/api/admin/conversations', adminConversationsRoutes);
}

module.exports = routes;
