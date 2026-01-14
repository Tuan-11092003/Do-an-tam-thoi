const Payment = require('../../models/payment.model');
const Cart = require('../../models/cart.model');
const { BadRequestError } = require('../../core/error.response');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const { createZaloPayMac, formatZaloPayDate } = require('./payment.utils');
const { calculatePriceForSelectedItems, removeSelectedItemsFromCart } = require('./payment.helpers');

class ZalopayPaymentService {
    /**
     * Tạo payment ZaloPay
     * @param {Object} params - Thông tin payment
     * @param {Array} params.itemsWithDiscount - Danh sách sản phẩm đã tính discount
     * @param {Number} params.selectedTotalPrice - Tổng giá trước coupon
     * @param {Number} params.selectedFinalPrice - Tổng giá sau coupon
     * @param {String} params.finalFullName - Họ tên
     * @param {String} params.finalPhone - Số điện thoại
     * @param {String} params.finalAddress - Địa chỉ
     * @param {Object} params.couponToApply - Coupon áp dụng
     * @param {String} params.userId - User ID
     * @returns {Promise} Promise với order_url, orderId, paymentId hoặc error
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
        return new Promise(async (resolve, reject) => {
            // Kiểm tra amount hợp lệ
            if (!selectedFinalPrice || selectedFinalPrice <= 0) {
                reject(new BadRequestError('Số tiền thanh toán không hợp lệ'));
                return;
            }

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
                paymentMethod: 'zalopay',
                status: 'pending',
            });

            // Lấy thông tin từ environment variables
            const appId = process.env.ZALOPAY_APP_ID || '553';
            const key1 = process.env.ZALOPAY_KEY1 || '9phuAOYhan4urywHTh0ndEXiV3pKHr5Q';
            const key2 = process.env.ZALOPAY_KEY2 || 'Iyz2habzyr7AG8SgvoBCbKwKi3UzlLi3';
            const sandboxUrl = process.env.ZALOPAY_SANDBOX_URL || 'https://sb-openapi.zalopay.vn/v2/create';
            const callbackUrl = process.env.ZALOPAY_CALLBACK_URL || 'http://localhost:3000/api/payment/zalopay';

            // ZaloPay yêu cầu amount là số nguyên (VND)
            const amount = Math.round(selectedFinalPrice);
            
            // Tạo timestamp (milliseconds)
            const timestamp = Date.now();
            
            // Tạo app_trans_id theo format: yymmdd_OrderID
            const datePrefix = formatZaloPayDate(); // Format: yymmdd (Vietnam timezone)
            const uniqueId = `ZLP${timestamp}`;
            const appTransId = `${datePrefix}_${uniqueId}`;
            
            // Tạo orderId để lưu vào database (dùng app_trans_id)
            const orderId = appTransId;
            
            // Lưu orderId vào payment
            payment.orderId = orderId;
            await payment.save();

            // item: JSON Array String, dùng "[]" nếu rỗng
            // Format: [{"name": "Product 1", "quantity": 1, "price": 100000}, ...]
            // Query lại productsData vì nó nằm trong scope khác
            let itemData = [];
            try {
                const Product = require('../../models/product.model');
                const selectedProductIds = itemsWithDiscount.map(i => i.productId);
                const products = await Product.find({ _id: { $in: selectedProductIds } }).lean();
                
                itemData = itemsWithDiscount.map(cartItem => {
                    const product = products.find(p => p._id.toString() === cartItem.productId.toString());
                    return {
                        name: product?.name || 'Sản phẩm',
                        quantity: cartItem.quantity || 1,
                        price: cartItem.priceAfterDiscount || product?.price || 0
                    };
                });
            } catch (error) {
                itemData = [];
            }
            const item = itemData.length > 0 ? JSON.stringify(itemData) : '[]'; // JSON Array String

            // embed_data: JSON String với redirecturl
            // Redirect về callback endpoint để xử lý cả thành công và hủy (giống VNPay/MoMo)
            const embedDataObj = {
                redirecturl: callbackUrl, // Redirect về callback endpoint để xử lý
                // Có thể thêm preferred_payment_method nếu muốn
                // preferred_payment_method: ["zalopay_wallet", "vietqr"]
            };
            const embedData = JSON.stringify(embedDataObj); // JSON String

            // app_user: thông tin user (string, max 50 chars)
            const appUser = userId.toString().substring(0, 50);

            // Tạo dữ liệu request theo format ZaloPay API (chưa có mac)
            const requestData = {
                app_id: parseInt(appId), // int32 required
                app_user: appUser, // string(50) required
                app_trans_id: appTransId, // string(40) required - format: yymmdd_OrderID
                app_time: timestamp, // int64 required - unix timestamp in milliseconds
                amount: amount, // int64 required - VND
                description: `Thanh toan don hang ${orderId} ${userId}`, // string(256) required - Chứa cả orderId và userId
                item: item, // string(2048) required - JSON Array String
                embed_data: embedData, // string required - JSON String
                callback_url: callbackUrl, // string optional
                bank_code: '', // string optional - để rỗng để hiển thị tất cả phương thức
            };

            // Tạo MAC (Message Authentication Code) theo format ZaloPay
            // hmac_input = app_id + | + app_trans_id + | + app_user + | + amount + | + app_time + | + embed_data + | + item
            const mac = createZaloPayMac(
                parseInt(appId),
                appTransId,
                appUser,
                amount,
                timestamp,
                embedData,
                item,
                key1
            );
            requestData.mac = mac;

            // Gọi ZaloPay API bằng axios
            
            try {
                const response = await axios({
                    method: 'post',
                    url: sandboxUrl,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    data: requestData,
                    timeout: 10000, // 10 giây timeout
                });

                // Kiểm tra response
                // ZaloPay trả về return_code: 1 là thành công (theo thực tế từ API)
                const returnCode = response.data.return_code;
                const returnMessage = response.data.return_message || '';
                const subReturnCode = response.data.sub_return_code;
                const subReturnMessage = response.data.sub_return_message || '';
                const orderUrl = response.data.order_url;
                
                // Kiểm tra return_code: 1 là thành công (theo thực tế từ ZaloPay API)
                if (returnCode !== undefined && returnCode !== 1) {
                    // return_code khác 1 → có lỗi
                    // Hiển thị thông báo lỗi chi tiết hơn nếu có
                    const detailedError = subReturnMessage 
                        ? `${returnMessage} (Chi tiết: ${subReturnMessage})`
                        : returnMessage || `Lỗi từ ZaloPay API (code: ${returnCode})`;
                    reject(new BadRequestError(detailedError));
                } else if (!orderUrl) {
                    // return_code = 1 nhưng không có order_url → lỗi
                    const errorMsg = returnMessage || 'ZaloPay API không trả về link thanh toán. Vui lòng thử lại.';
                    reject(new BadRequestError(errorMsg));
                } else {
                    // return_code = 1 và có order_url → thành công
                    // Trả về cả order_url và orderId để controller có thể lưu vào cookie
                    resolve({ 
                        order_url: orderUrl,
                        orderId: orderId,
                        paymentId: payment._id
                    });
                }
            } catch (error) {
                // Xử lý lỗi từ axios
                if (error.response) {
                    // Server trả về response với status code ngoài 2xx
                    let errorMessage = 'ZaloPay API hiện không khả dụng. Vui lòng thử lại sau.';
                    if (error.response.status === 503) {
                        errorMessage = 'ZaloPay API đang bảo trì. Vui lòng thử lại sau.';
                    } else if (error.response.status === 504) {
                        errorMessage = 'ZaloPay API không phản hồi. Vui lòng thử lại sau.';
                    } else if (error.response.data && error.response.data.return_message) {
                        errorMessage = error.response.data.return_message;
                    }
                    
                    reject(new BadRequestError(errorMessage));
                } else if (error.request) {
                    // Request đã được gửi nhưng không nhận được response
                    reject(new BadRequestError('Không thể kết nối đến ZaloPay API. Vui lòng thử lại sau.'));
                } else {
                    // Lỗi khi setup request
                    reject(new BadRequestError('Lỗi khi tạo request đến ZaloPay API: ' + error.message));
                }
            }
        });
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
            paymentMethod: 'zalopay',
            status: 'confirmed', // Tự động xác nhận khi thanh toán qua ZaloPay thành công
        });
        
        // Chỉ xóa các sản phẩm đã chọn khỏi giỏ hàng, không xóa toàn bộ
        await removeSelectedItemsFromCart(findCart._id, selectedItems);
        return payment;
    }

    /**
     * Tìm payment ZaloPay gần đây (trong vòng 10 phút) để fallback
     * @param {String} appTransId - App Transaction ID
     * @param {Function} findPaymentByOrderId - Function để tìm payment bằng orderId
     * @returns {Promise} Payment object hoặc null
     */
    async findRecentPayment(appTransId, findPaymentByOrderId) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        // Tìm payment pending gần đây với paymentMethod = 'zalopay'
        const payments = await Payment.find({
            paymentMethod: 'zalopay',
            status: 'pending',
            createdAt: { $gte: tenMinutesAgo }
        }).sort({ createdAt: -1 }).limit(5);
        
        // Thử match với appTransId (có thể format khác một chút)
        for (const payment of payments) {
            if (payment.orderId) {
                // So sánh exact match
                if (payment.orderId === appTransId) {
                    return await findPaymentByOrderId(payment.orderId);
                }
                // So sánh phần sau dấu gạch dưới (format: yymmdd_OrderID)
                const orderIdParts = payment.orderId.split('_');
                const appTransIdParts = appTransId.split('_');
                if (orderIdParts.length >= 2 && appTransIdParts.length >= 2) {
                    if (orderIdParts[1] === appTransIdParts[1]) {
                        return await findPaymentByOrderId(payment.orderId);
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Lấy tất cả payments ZaloPay pending để debug
     * @returns {Promise} Array of payment objects
     */
    async getAllPendingPayments() {
        const payments = await Payment.find({
            paymentMethod: 'zalopay',
            status: 'pending'
        }).sort({ createdAt: -1 }).limit(10).lean();
        
        return payments.map(p => ({
            _id: p._id,
            orderId: p.orderId,
            createdAt: p.createdAt,
            finalPrice: p.finalPrice
        }));
    }

    /**
     * Tìm payment ZaloPay pending gần đây nhất (trong 10 phút)
     * @param {Function} confirmPayment - Function để confirm payment
     * @returns {Promise} Payment object hoặc null
     */
    async findMostRecentPendingPayment(confirmPayment) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        // Tìm payment pending gần đây nhất với paymentMethod = 'zalopay'
        const payment = await Payment.findOne({
            paymentMethod: 'zalopay',
            status: 'pending',
            createdAt: { $gte: tenMinutesAgo }
        }).sort({ createdAt: -1 });
        
        if (payment && payment.status === 'pending') {
            return await confirmPayment(payment._id);
        }
        
        return payment;
    }
}

module.exports = new ZalopayPaymentService();

