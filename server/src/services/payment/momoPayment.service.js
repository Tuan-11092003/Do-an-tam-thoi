const Payment = require('../../models/payment.model');
const Cart = require('../../models/cart.model');
const { BadRequestError } = require('../../core/error.response');
const crypto = require('crypto');
const https = require('https');
const { calculatePriceForSelectedItems, removeSelectedItemsFromCart } = require('./payment.helpers');

class MomoPaymentService {
    /**
     * Tạo payment MoMo
     * @param {Object} params - Thông tin payment
     * @param {Array} params.itemsWithDiscount - Danh sách sản phẩm đã tính discount
     * @param {Number} params.selectedTotalPrice - Tổng giá trước coupon
     * @param {Number} params.selectedFinalPrice - Tổng giá sau coupon
     * @param {String} params.finalFullName - Họ tên
     * @param {String} params.finalPhone - Số điện thoại
     * @param {String} params.finalAddress - Địa chỉ
     * @param {Object} params.couponToApply - Coupon áp dụng
     * @param {String} params.userId - User ID
     * @returns {Promise} Promise với payUrl hoặc error
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
                paymentMethod: 'momo',
                status: 'pending', // Sẽ được cập nhật thành 'confirmed' khi callback thành công
            });

            // Sử dụng environment variables nếu có, nếu không thì dùng giá trị mặc định (test)
            const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
            const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
            const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
            const orderId = partnerCode + new Date().getTime();
            const requestId = orderId;
            // Lưu orderId vào payment để callback có thể tìm
            payment.orderId = orderId;
            await payment.save();
            
            // orderInfo chứa cả orderId và userId để callback có thể parse
            const orderInfo = `Thanh toan don hang ${orderId} ${userId}`;
            const redirectUrl = 'http://localhost:3000/api/payment/momo';
            const ipnUrl = 'http://localhost:3000/api/payment/momo';
            const requestType = 'payWithMethod';
            // MoMo yêu cầu amount là số nguyên (không có phần thập phân)
            const amount = Math.round(selectedFinalPrice); // Sử dụng giá đã tính lại cho selectedItems và làm tròn
            const extraData = '';

            // Tạo rawSignature theo đúng thứ tự yêu cầu của MoMo
            // Thứ tự: accessKey, amount, extraData, ipnUrl, orderId, orderInfo, partnerCode, redirectUrl, requestId, requestType
            // Lưu ý: Không URL encode trong rawSignature, chỉ dùng giá trị gốc
            const rawSignature =
                'accessKey=' +
                accessKey +
                '&amount=' +
                amount +
                '&extraData=' +
                extraData +
                '&ipnUrl=' +
                ipnUrl +
                '&orderId=' +
                orderId +
                '&orderInfo=' +
                orderInfo +
                '&partnerCode=' +
                partnerCode +
                '&redirectUrl=' +
                redirectUrl +
                '&requestId=' +
                requestId +
                '&requestType=' +
                requestType;

            const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            const requestBody = JSON.stringify({
                partnerCode,
                partnerName: 'Test',
                storeId: 'MomoTestStore',
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                lang: 'vi',
                requestType,
                autoCapture: true,
                extraData,
                signature,
            });

            const options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: '/v2/gateway/api/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody),
                },
                timeout: 10000, // 10 giây timeout
            };

            const req = https.request(options, (momoRes) => {
                let data = '';
                momoRes.on('data', (chunk) => {
                    data += chunk;
                });
                momoRes.on('end', () => {
                    try {
                        // Kiểm tra HTTP status code
                        if (momoRes.statusCode !== 200) {
                            // Xử lý các HTTP status code cụ thể
                            let errorMessage = 'MoMo API hiện không khả dụng. Vui lòng thử lại sau hoặc chọn phương thức thanh toán khác (COD/VNPay).';
                            if (momoRes.statusCode === 503) {
                                errorMessage = 'MoMo API đang bảo trì. Vui lòng thử lại sau hoặc chọn phương thức thanh toán khác (COD/VNPay).';
                            } else if (momoRes.statusCode === 504) {
                                errorMessage = 'MoMo API không phản hồi. Vui lòng thử lại sau hoặc chọn phương thức thanh toán khác (COD/VNPay).';
                            }
                            
                            reject(new BadRequestError(errorMessage));
                            return;
                        }
                        
                        // Kiểm tra xem response có phải là HTML không (thường là trang lỗi khi API không khả dụng)
                        if (data.trim().startsWith('<')) {
                            reject(new BadRequestError('MoMo API hiện không khả dụng. Vui lòng thử lại sau hoặc chọn phương thức thanh toán khác (COD/VNPay).'));
                            return;
                        }
                        
                        const response = JSON.parse(data);
                        
                        // Kiểm tra nếu MoMo API trả về lỗi
                        if (response.resultCode && response.resultCode !== 0) {
                            const errorMessage = response.message || `Lỗi từ MoMo API (code: ${response.resultCode})`;
                            reject(new BadRequestError(errorMessage));
                        } else if (!response.payUrl) {
                            reject(new BadRequestError('MoMo API không trả về link thanh toán. Vui lòng thử lại.'));
                        } else {
                            resolve(response);
                        }
                    } catch (err) {
                        reject(new BadRequestError('Lỗi xử lý phản hồi từ MoMo API: ' + (err.message || 'Unknown error')));
                    }
                });
            });

            req.on('error', (e) => {
                reject(new BadRequestError('Lỗi kết nối đến MoMo API: ' + (e.message || 'Unknown error')));
            });
            
            // Xử lý timeout
            req.on('timeout', () => {
                req.destroy();
                reject(new BadRequestError('MoMo API không phản hồi. Vui lòng thử lại sau.'));
            });
            
            req.setTimeout(3000); // 3 giây timeout
            req.write(requestBody);
            req.end();
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
            paymentMethod: 'momo',
            status: 'confirmed', // Tự động xác nhận khi thanh toán qua MoMo thành công
        });
        
        // Chỉ xóa các sản phẩm đã chọn khỏi giỏ hàng, không xóa toàn bộ
        await removeSelectedItemsFromCart(findCart._id, selectedItems);
        return payment;
    }
}

module.exports = new MomoPaymentService();

