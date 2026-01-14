const Payment = require('../../models/payment.model');
const Cart = require('../../models/cart.model');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');
const { generatePayID } = require('./payment.utils');
const { calculatePriceForSelectedItems, removeSelectedItemsFromCart } = require('./payment.helpers');
const { BadRequestError } = require('../../core/error.response');

class VnpayPaymentService {
    /**
     * Tạo payment VNPay
     * @param {Object} params - Thông tin payment
     * @param {Array} params.itemsWithDiscount - Danh sách sản phẩm đã tính discount
     * @param {Number} params.selectedTotalPrice - Tổng giá trước coupon
     * @param {Number} params.selectedFinalPrice - Tổng giá sau coupon
     * @param {String} params.finalFullName - Họ tên
     * @param {String} params.finalPhone - Số điện thoại
     * @param {String} params.finalAddress - Địa chỉ
     * @param {Object} params.couponToApply - Coupon áp dụng
     * @param {String} params.userId - User ID
     * @returns {Promise} Promise với payment URL hoặc error
     */
    async createPayment({
        itemsWithDiscount,
        selectedTotalPrice,
        selectedFinalPrice,
        finalFullName,
        finalPhone,
        finalAddress,
        couponToApply,
        userId,
    }) {
        // Tạo payment record trước khi redirect
        const payment = await Payment.create({
            products: itemsWithDiscount,
            totalPrice: selectedTotalPrice,
            fullName: finalFullName,
            phone: finalPhone,
            address: finalAddress,
            finalPrice: selectedFinalPrice,
            coupon: couponToApply,
            userId,
            paymentMethod: 'vnpay',
            status: 'pending', // Sẽ được cập nhật thành 'confirmed' khi callback thành công
        });

        const vnpay = new VNPay({
            tmnCode: 'DH2F13SW',
            secureSecret: '7VJPG70RGPOWFO47VSBT29WPDYND0EJG',
            vnpayHost: 'https://sandbox.vnpayment.vn',
            testMode: true, // tùy chọn
            hashAlgorithm: 'SHA512', // tùy chọn
            loggerFn: ignoreLogger, // tùy chọn
        });
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Tạo orderId (vnp_TxnRef) và lưu vào payment
        const orderId = `${userId}_${generatePayID()}`;
        payment.orderId = orderId;
        await payment.save();
        
        const vnpayResponse = await vnpay.buildPaymentUrl({
            vnp_Amount: selectedFinalPrice, // Sử dụng giá đã tính lại cho selectedItems
            vnp_IpAddr: '127.0.0.1', //
            vnp_TxnRef: orderId, // Sử dụng orderId đã lưu
            vnp_OrderInfo: `Thanh toan don hang ${orderId} ${userId}`, // Chứa cả orderId và userId
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: `http://localhost:3000/api/payment/vnpay`, //
            vnp_Locale: VnpLocale.VN, // 'vn' hoặc 'en'
            vnp_CreateDate: dateFormat(new Date()), // tùy chọn, mặc định là thời gian hiện tại
            vnp_ExpireDate: dateFormat(tomorrow), // tùy chọn
        });

        return vnpayResponse;
    }

    /**
     * Fallback: Tạo payment mới nếu không tìm thấy bằng orderId (backward compatibility)
     * @param {String} userId - User ID
     * @returns {Promise} Payment object
     */
    async callback(userId) {
        const findCart = await Cart.findOne({ userId: userId });
        if (!findCart) {
            throw new BadRequestError('Cart not found');
        }

        const selectedItems = (findCart.products || []).filter((item) => item.isSelected === true);
        if (!selectedItems.length) {
            throw new BadRequestError('No selected items in cart');
        }

        // Tính lại totalPrice và finalPrice chỉ dựa trên selectedItems
        const { itemsWithDiscount, selectedTotalPrice, selectedFinalPrice, couponToApply } = 
            await calculatePriceForSelectedItems(findCart, selectedItems);

        const payment = await Payment.create({
            products: itemsWithDiscount,
            totalPrice: selectedTotalPrice,
            fullName: findCart.fullName,
            phone: findCart.phone,
            address: findCart.address,
            finalPrice: selectedFinalPrice,
            coupon: couponToApply,
            userId: userId,
            paymentMethod: 'vnpay',
            status: 'confirmed', // Tự động xác nhận khi thanh toán qua VNPay thành công
        });
        
        // Chỉ xóa các sản phẩm đã chọn khỏi giỏ hàng, không xóa toàn bộ
        await removeSelectedItemsFromCart(findCart._id, selectedItems);
        return payment;
    }
}

module.exports = new VnpayPaymentService();

