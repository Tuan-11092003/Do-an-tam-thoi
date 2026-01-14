const PaymentService = require('../services/payment.service');
const CryptoJS = require('crypto-js');

const { OK } = require('../core/success.response');

// Helper function: Tìm payment ZaloPay (không cần this, nên là function độc lập)
async function findZaloPayPayment(app_trans_id, description) {
    let payment = null;
    
    // Ưu tiên tìm payment bằng app_trans_id (orderId)
    if (app_trans_id) {
        payment = await PaymentService.findPaymentByOrderId(app_trans_id);
        if (!payment) {
            payment = await PaymentService.findRecentZaloPayPayment(app_trans_id);
        }
    }
    
    // Nếu không tìm thấy bằng app_trans_id, thử parse từ description
    if (!payment && description) {
        const descriptionParts = description.split(' ');
        if (descriptionParts.length >= 5) {
            const parsedOrderId = descriptionParts[4];
            payment = await PaymentService.findPaymentByOrderId(parsedOrderId);
        }
    }
    
    // Nếu vẫn không tìm thấy, thử tìm payment pending gần đây nhất
    if (!payment) {
        payment = await PaymentService.findMostRecentPendingZaloPayPayment();
    }
    
    // Fallback: tạo payment mới từ userId trong description
    if (!payment && description) {
        const descriptionParts = description.split(' ');
        if (descriptionParts.length >= 6) {
            const id = descriptionParts[5];
            if (id && id !== 'undefined') {
                payment = await PaymentService.zalopayCallback(id);
            }
        }
    }
    
    return payment;
}

class PaymentController {
    async createPayment(req, res, next) {
        try {
            const { id } = req.user;
            const { paymentMethod, fullName, phone, address, useCoupon } = req.body;
            
            const payment = await PaymentService.createPayment({
                paymentMethod,
                userId: id,
                fullName,
                phone,
                address,
                useCoupon: useCoupon === true, // Chỉ áp dụng coupon nếu frontend gửi useCoupon: true
            });
            
            // Nếu là ZaloPay, lưu app_trans_id (orderId) vào cookie để callback có thể tìm payment
            if (paymentMethod === 'zalopay' && payment && payment.orderId) {
                // Lưu cookie với thời gian sống 15 phút
                res.cookie('zalopay_app_trans_id', payment.orderId, {
                    maxAge: 15 * 60 * 1000, // 15 phút
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production', // Chỉ dùng HTTPS trong production
                    sameSite: 'lax'
                });
            }
            
            new OK({ message: 'success', metadata: payment }).send(res);
        } catch (error) {
            console.error('Create payment error:', error.message);
            next(error);
        }
    }

    async getPaymentById(req, res) {
        const { id } = req.params;
        const payment = await PaymentService.getPaymentById(id);
        new OK({ message: 'success', metadata: payment }).send(res);
    }

    async momoCallback(req, res) {
        try {
            const { orderInfo, resultCode, orderId } = req.query;
            // resultCode = 0 nghĩa là thanh toán thành công
            if (resultCode && resultCode !== '0') {
                // Thanh toán thất bại, redirect về trang lỗi hoặc trang chủ
                return res.redirect(`${process.env.URL_CLIENT}/?payment=failed`);
            }
            
            // Ưu tiên tìm payment bằng orderId từ query (MoMo trả về)
            let payment = null;
            if (orderId) {
                payment = await PaymentService.findPaymentByOrderId(orderId);
            }
            
            // Nếu không tìm thấy bằng orderId, thử parse từ orderInfo
            if (!payment && orderInfo) {
                const orderInfoParts = orderInfo.split(' ');
                // Format mới: "Thanh toan don hang {orderId} {userId}"
                if (orderInfoParts.length >= 5) {
                    const parsedOrderId = orderInfoParts[4]; // orderId ở vị trí thứ 5
                    payment = await PaymentService.findPaymentByOrderId(parsedOrderId);
                }
            }
            
            // Nếu vẫn không tìm thấy, fallback về cách cũ (backward compatibility)
            if (!payment && orderInfo) {
                const orderInfoParts = orderInfo.split(' ');
                if (orderInfoParts.length >= 5) {
                    const id = orderInfoParts[4];
                    if (id && id !== 'undefined') {
                        payment = await PaymentService.momoCallback(id);
                    }
                }
            }
            
            // Kiểm tra payment và payment._id có tồn tại không
            if (!payment || !payment._id) {
                console.error('MoMo callback: Payment not found or payment._id is missing');
                return res.redirect(`${process.env.URL_CLIENT}/?payment=error`);
            }
            
            res.redirect(`${process.env.URL_CLIENT}/payment/success/${payment._id}`);
        } catch (error) {
            console.error('MoMo callback error:', error);
            res.redirect(`${process.env.URL_CLIENT}/?payment=error`);
        }
    }

    async vnpayCallback(req, res, next) {
        try {
            const { vnp_ResponseCode, vnp_OrderInfo, vnp_TxnRef } = req.query;
            
            // vnp_ResponseCode = '00' nghĩa là thanh toán thành công
            if (vnp_ResponseCode && vnp_ResponseCode !== '00') {
                // Thanh toán thất bại, redirect về trang lỗi hoặc trang chủ
                return res.redirect(`${process.env.URL_CLIENT}/?payment=failed`);
            }
            
            // Ưu tiên tìm payment bằng vnp_TxnRef (orderId)
            let payment = null;
            if (vnp_TxnRef) {
                payment = await PaymentService.findPaymentByOrderId(vnp_TxnRef);
            }
            
            // Nếu không tìm thấy bằng vnp_TxnRef, thử parse từ vnp_OrderInfo
            if (!payment && vnp_OrderInfo) {
                const orderInfoParts = vnp_OrderInfo.split(' ');
                // Format mới: "Thanh toan don hang {orderId} {userId}"
                if (orderInfoParts.length >= 5) {
                    const parsedOrderId = orderInfoParts[4]; // orderId ở vị trí thứ 5
                    payment = await PaymentService.findPaymentByOrderId(parsedOrderId);
                }
            }
            
            // Nếu vẫn không tìm thấy, fallback về cách cũ (backward compatibility)
            if (!payment && vnp_OrderInfo) {
                const orderInfoParts = vnp_OrderInfo.split(' ');
                if (orderInfoParts.length >= 6) {
                    const id = orderInfoParts[5]; // userId ở vị trí thứ 6
                    if (id && id !== 'undefined') {
                        payment = await PaymentService.vnpayCallback(id);
                    }
                }
            }
            
            // Kiểm tra payment và payment._id có tồn tại không
            if (!payment || !payment._id) {
                console.error('VNPay callback: Payment not found or payment._id is missing', {
                    vnp_TxnRef,
                    vnp_OrderInfo
                });
                return res.redirect(`${process.env.URL_CLIENT}/?payment=error`);
            }
            
            res.redirect(`${process.env.URL_CLIENT}/payment/success/${payment._id}`);
        } catch (error) {
            console.error('VNPay callback error:', error);
            res.redirect(`${process.env.URL_CLIENT}/?payment=error`);
        }
    }

    // User redirect callback (GET) - Sau khi thanh toán, user được redirect về đây
    async zalopayCallback(req, res, next) {
        try {
            // ZaloPay trả về apptransid (lowercase) và status trong redirect URL
            const { apptransid, app_trans_id, status } = req.query;
            
            // Log để debug
            console.log('ZaloPay callback - Query params:', {
                apptransid,
                app_trans_id,
                status,
                all_query: req.query
            });
            
            // Kiểm tra status từ ZaloPay - status âm nghĩa là hủy/thất bại
            // status dương hoặc không có status = thành công
            // Theo logs: status = '-49' khi hủy, status dương khi thành công
            if (status !== undefined && status !== null && status !== '') {
                const statusNum = Number(status);
                if (statusNum < 0) {
                    console.log('ZaloPay callback: Payment cancelled or failed, status:', status);
                    res.clearCookie('zalopay_app_trans_id');
                    return res.redirect(`${process.env.URL_CLIENT}/?payment=failed`);
                }
            }
            
            // Ưu tiên lấy apptransid (lowercase) từ query, sau đó app_trans_id, cuối cùng là cookie
            let orderId = apptransid || app_trans_id || req.cookies?.zalopay_app_trans_id;
            
            if (!orderId) {
                console.error('ZaloPay callback: No orderId found in query or cookie');
                res.clearCookie('zalopay_app_trans_id');
                return res.redirect(`${process.env.URL_CLIENT}/?payment=error`);
            }
            
            console.log('ZaloPay callback: Searching for payment with orderId:', orderId);
            
            // Tìm payment (không cần description vì ZaloPay không trả về trong redirect URL)
            let payment = await findZaloPayPayment(orderId, null);
            
            // Kiểm tra payment và payment._id có tồn tại không
            if (!payment || !payment._id) {
                console.error('ZaloPay callback: Payment not found or payment._id is missing', {
                    orderId,
                    description
                });
                res.clearCookie('zalopay_app_trans_id');
                return res.redirect(`${process.env.URL_CLIENT}/?payment=error`);
            }
            
            // Kiểm tra status của payment - chỉ redirect success nếu payment đã được confirmed
            // Nếu payment vẫn pending, có thể là user đã hủy hoặc chưa thanh toán thành công
            if (payment.status !== 'confirmed') {
                console.log('ZaloPay callback: Payment found but status is not confirmed:', payment.status);
                res.clearCookie('zalopay_app_trans_id');
                return res.redirect(`${process.env.URL_CLIENT}/?payment=failed`);
            }
            
            console.log('ZaloPay callback: Payment found and confirmed, redirecting to success:', payment._id);
            
            // Xóa cookie sau khi tìm thấy payment
            res.clearCookie('zalopay_app_trans_id');
            
            res.redirect(`${process.env.URL_CLIENT}/payment/success/${payment._id}`);
        } catch (error) {
            console.error('ZaloPay callback error:', error);
            res.clearCookie('zalopay_app_trans_id');
            res.redirect(`${process.env.URL_CLIENT}/?payment=error`);
        }
    }

    // Server-to-server callback (POST) - ZaloPay server gọi để thông báo kết quả (IPN)
    // Format theo tài liệu: { data: "JSON string", mac: "HMAC signature", type: 1 }
    async zalopayServerCallback(req, res, next) {
        try {
            const { data, mac, type } = req.body;
            
            // Kiểm tra data và mac có tồn tại không
            if (!data || !mac) {
                console.error('ZaloPay server callback: Missing data or mac');
                return res.json({ return_code: -1, return_message: 'Missing data or mac' });
            }
            
            // Parse data (là JSON string)
            let callbackData;
            try {
                callbackData = JSON.parse(data);
            } catch (parseError) {
                console.error('ZaloPay server callback: Invalid data format', parseError);
                return res.json({ return_code: -1, return_message: 'Invalid data format' });
            }
            
            // Verify MAC signature
            const key2 = process.env.ZALOPAY_KEY2 || 'Iyz2habzyr7AG8SgvoBCbKwKi3UzlLi3';
            const expectedMac = CryptoJS.HmacSHA256(data, key2).toString();
            
            if (mac !== expectedMac) {
                console.error('ZaloPay server callback: MAC verification failed');
                return res.json({ return_code: -1, return_message: 'MAC verification failed' });
            }
            
            // Lấy thông tin từ callback data
            const { app_trans_id, amount, zp_trans_id } = callbackData;
            
            console.log('ZaloPay server callback: Received IPN', {
                app_trans_id,
                amount,
                zp_trans_id,
                type
            });
            
            // Tìm payment bằng app_trans_id
            let payment = await PaymentService.findPaymentByOrderId(app_trans_id);
            
            if (!payment) {
                console.error('ZaloPay server callback: Payment not found', { app_trans_id });
                return res.json({ return_code: -1, return_message: 'Payment not found' });
            }
            
            // Kiểm tra amount có khớp không (bảo mật)
            if (payment.finalPrice !== amount) {
                console.error('ZaloPay server callback: Amount mismatch', {
                    expected: payment.finalPrice,
                    received: amount
                });
                return res.json({ return_code: -1, return_message: 'Amount mismatch' });
            }
            
            // Cập nhật payment status thành confirmed (nếu chưa)
            if (payment.status === 'pending') {
                payment.status = 'confirmed';
                await payment.save();
                
                // Xóa sản phẩm đã chọn khỏi giỏ hàng
                const Cart = require('../models/cart.model');
                const cart = await Cart.findOne({ userId: payment.userId });
                if (cart && cart.products && cart.products.length > 0) {
                    const paymentItemsMap = new Map();
                    payment.products.forEach(p => {
                        const key = `${p.productId.toString()}_${p.colorId.toString()}_${p.sizeId.toString()}`;
                        paymentItemsMap.set(key, p.quantity);
                    });
                    
                    cart.products = cart.products.filter(item => {
                        const key = `${item.productId.toString()}_${item.colorId.toString()}_${item.sizeId.toString()}`;
                        return !paymentItemsMap.has(key);
                    });
                    await cart.save();
                }
            }
            
            // Trả về response cho ZaloPay server (theo format ZaloPay yêu cầu)
            res.json({ return_code: 1, return_message: 'Success' });
        } catch (error) {
            console.error('ZaloPay server callback error:', error);
            res.json({ return_code: -1, return_message: 'Server error' });
        }
    }


    async getOrderHistory(req, res) {
        const { id } = req.user;
        const orders = await PaymentService.getOrderHistory(id);
        new OK({ message: 'success', metadata: orders }).send(res);
    }

    async cancelOrder(req, res) {
        const { id } = req.user;
        const { orderId } = req.params;
        const order = await PaymentService.cancelOrder(orderId, id);
        new OK({ message: 'Hủy đơn hàng thành công', metadata: order }).send(res);
    }
}

module.exports = new PaymentController();
