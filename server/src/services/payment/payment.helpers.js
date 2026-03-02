const Cart = require('../../models/cart.model');
const Payment = require('../../models/payment.model');
const Product = require('../../models/product.model');
const Coupon = require('../../models/counpon.model');
const { BadRequestError } = require('../../core/error.response');

/**
 * Đánh dấu coupon đã được user sử dụng khi thanh toán thành công
 * @param {String} couponCode - Mã coupon
 * @param {String} userId - User ID
 */
async function markCouponAsUsed(couponCode, userId) {
    if (!couponCode || !userId) return;
    try {
        const coupon = await Coupon.findOne({ nameCoupon: couponCode });
        if (coupon) {
            if (!coupon.usedBy || !coupon.usedBy.includes(userId)) {
                coupon.usedBy = coupon.usedBy || [];
                coupon.usedBy.push(userId);
                await coupon.save();
            }
        }
    } catch (error) {
        console.error('Lỗi đánh dấu coupon đã dùng:', error);
    }
}

/**
 * Tính toán giá cho selected items từ cart
 * @param {Object} findCart - Cart object
 * @param {Array} selectedItems - Danh sách items đã chọn
 * @returns {Object} { itemsWithDiscount, selectedTotalPrice, selectedFinalPrice, couponToApply }
 */
async function calculatePriceForSelectedItems(findCart, selectedItems) {
    const modelFlashSale = require('../../models/flashSale.model');
    const selectedProductIds = selectedItems.map((item) => item.productId);
    const productsData = await Product.find({ _id: { $in: selectedProductIds } });
    
    // Query active flash sales
    const now = new Date();
    const activeFlashSales = await modelFlashSale.find({
        productId: { $in: selectedProductIds },
        startDate: { $lte: now },
        endDate: { $gte: now },
    }).lean();
    
    const flashSaleMap = new Map();
    activeFlashSales.forEach((flashSale) => {
        if (flashSale.productId) {
            flashSaleMap.set(flashSale.productId.toString(), flashSale.discount);
        }
    });
    
    let selectedTotalPrice = 0;
    const itemsWithDiscount = selectedItems.map((item) => {
        let discount = 0;
        const product = productsData.find((p) => p._id.toString() === item.productId.toString());
        
        // Kiểm tra flash sale từ map
        if (product) {
            const productIdStr = item.productId.toString();
            if (flashSaleMap.has(productIdStr)) {
                discount = flashSaleMap.get(productIdStr);
            } else {
                discount = product?.discount || 0;
            }
            
            const priceAfterDiscount = product.price * (1 - discount / 100);
            selectedTotalPrice += priceAfterDiscount * item.quantity;
            
            // Lưu discount và priceAfterDiscount vào item
            return {
                ...item.toObject ? item.toObject() : item,
                discount,
                priceAfterDiscount,
            };
        }
        return item;
    });
    
    // Tính finalPrice dựa trên coupon nếu có
    let selectedFinalPrice = selectedTotalPrice;
    let couponToApply = null;
    
    if (findCart.coupon && findCart.coupon.code) {
        selectedFinalPrice = selectedTotalPrice - (selectedTotalPrice * findCart.coupon.discount) / 100;
        couponToApply = findCart.coupon;
    }
    
    return {
        itemsWithDiscount,
        selectedTotalPrice,
        selectedFinalPrice,
        couponToApply,
    };
}

/**
 * Xóa các sản phẩm đã chọn khỏi giỏ hàng
 * @param {String} cartId - Cart ID
 * @param {Array} selectedItems - Danh sách items đã chọn
 */
async function removeSelectedItemsFromCart(cartId, selectedItems) {
    const cart = await Cart.findById(cartId);
    if (!cart) return;

    // Lấy danh sách ID của các sản phẩm đã chọn
    const selectedItemIds = selectedItems.map((item) => item._id.toString());

    // Xóa các sản phẩm đã chọn khỏi giỏ hàng
    cart.products = cart.products.filter(
        (item) => !selectedItemIds.includes(item._id.toString())
    );

    // Nếu giỏ hàng trống sau khi xóa, xóa luôn giỏ hàng
    if (cart.products.length === 0) {
        await Cart.findByIdAndDelete(cartId);
        return;
    }

    // Cập nhật lại totalPrice dựa trên các sản phẩm còn lại
    const allProductIds = cart.products.map((p) => p.productId);
    const productsData = await Product.find({ _id: { $in: allProductIds } });
    
    // Tính lại totalPrice
    const modelFlashSale = require('../../models/flashSale.model');
    let total = 0;
    for (const item of cart.products) {
        let discount = 0;
        const product = productsData.find((p) => p._id.toString() === item.productId.toString());

        const findFlashSale = await modelFlashSale.findOne({ productId: item.productId });
        if (findFlashSale) {
            discount = findFlashSale.discount;
        } else {
            discount = product?.discount || 0;
        }

        if (product) {
            const priceAfterDiscount = product.price * (1 - discount / 100);
            total += priceAfterDiscount * item.quantity;
        }
    }
    cart.totalPrice = total;

    // Nếu có coupon, tính lại finalPrice
    if (cart.coupon && cart.coupon.code) {
        cart.finalPrice = cart.totalPrice - (cart.totalPrice * cart.coupon.discount) / 100;
    } else {
        cart.finalPrice = cart.totalPrice;
    }

    // Reset isSelected cho tất cả sản phẩm còn lại
    cart.products.forEach((item) => {
        item.isSelected = false;
    });

    await cart.save();
}

module.exports = {
    calculatePriceForSelectedItems,
    removeSelectedItemsFromCart,
    markCouponAsUsed,
};

