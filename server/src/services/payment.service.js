const Cart = require('../models/cart.model');
const Payment = require('../models/payment.model');
const Warranty = require('../models/warranty.model');
const PreviewProduct = require('../models/previewProduct.model');
const Product = require('../models/product.model');
const Coupon = require('../models/counpon.model');
const { BadRequestError } = require('../core/error.response');
const CartService = require('./cart.service');

const crypto = require('crypto');
const https = require('https');
const axios = require('axios');
const CryptoJS = require('crypto-js');

const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

const dayjs = require('dayjs');

function generateWarrantyProduct(products, userId, orderId) {
    const date = new Date();
    const warrantyProduct = products.map((product) => {
        return Warranty.create({
            orderId,
            userId,
            productId: product.productId,
            reason: null,
            status: 'available', // Trạng thái ban đầu: chưa có yêu cầu đổi trả
            receivedDate: date,
            returnDate: dayjs(date).add(7, 'day').toDate(),
        });
    });
    return warrantyProduct;
}

function generatePayID() {
    // Tạo ID thanh toán bao gồm cả giây để tránh trùng lặp
    const now = new Date();
    const timestamp = now.getTime();
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    return `PAY${timestamp}${seconds}${milliseconds}`;
}

function createZaloPayMac(appId, appTransId, appUser, amount, appTime, embedData, item, key) {
    // Format MAC theo ZaloPay: app_id + | + app_trans_id + | + app_user + | + amount + | + app_time + | + embed_data + | + item
    const hmacInput = `${appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${item}`;
    
    // Tạo MAC bằng HMAC SHA256
    const mac = CryptoJS.HmacSHA256(hmacInput, key).toString();
    
    return mac;
}

function formatZaloPayDate() {
    // Tạo yymmdd theo timezone Vietnam (GMT+7)
    const now = new Date();
    // Convert sang Vietnam timezone (GMT+7)
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const year = vietnamTime.getUTCFullYear().toString().slice(-2); // 2 số cuối của năm
    const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// Helper function: Đánh dấu coupon đã được user sử dụng khi thanh toán thành công
async function markCouponAsUsed(couponCode, userId) {
    if (!couponCode || !userId) return;
    
    try {
        const coupon = await Coupon.findOne({ nameCoupon: couponCode });
        if (coupon) {
            // Chỉ thêm userId nếu chưa có trong mảng usedBy
            if (!coupon.usedBy || !coupon.usedBy.includes(userId)) {
                coupon.usedBy = coupon.usedBy || [];
                coupon.usedBy.push(userId);
                await coupon.save();
            }
        }
    } catch (error) {
        console.error('Error marking coupon as used:', error);
        // Không throw error để không ảnh hưởng đến flow thanh toán
    }
}

class PaymentService {
    async createPayment({ paymentMethod, userId, fullName, phone, address, useCoupon }) {
        // 💳 Thanh toán sử dụng giỏ hàng trong DB
        const findCart = await Cart.findOne({ userId: userId });
        if (!findCart) {
            throw new BadRequestError('Giỏ hàng không tồn tại');
        }

        // Cập nhật thông tin giao hàng vào cart nếu có (ưu tiên thông tin từ request)
        if (fullName || phone || address) {
            if (fullName) findCart.fullName = fullName;
            if (phone) findCart.phone = phone;
            if (address) findCart.address = address;
            await findCart.save();
        }

        // Sử dụng thông tin từ request hoặc từ cart (fallback)
        const finalFullName = fullName || findCart.fullName;
        const finalPhone = phone || findCart.phone;
        const finalAddress = address || findCart.address;

        // Validate thông tin bắt buộc
        if (!finalFullName || !finalPhone || !finalAddress) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin giao hàng (Họ tên, Số điện thoại, Địa chỉ)');
        }

        // Chỉ lấy những sản phẩm được chọn để thanh toán
        const selectedItems = (findCart.products || []).filter((item) => item.isSelected === true);
        if (!selectedItems.length) {
            throw new BadRequestError('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
        }

        // Tính lại totalPrice và finalPrice chỉ dựa trên selectedItems
        let selectedTotalPrice = 0;
        let selectedFinalPrice = 0;
        let couponToApply = null;
        let itemsWithDiscount = selectedItems; // Khởi tạo mặc định để tránh lỗi "is not defined"
        
        try {
            const Product = require('../models/product.model');
            const modelFlashSale = require('../models/flashSale.model');
            const selectedProductIds = selectedItems.map((item) => item.productId);
            const productsData = await Product.find({ _id: { $in: selectedProductIds } });
            
            // Tối ưu: Query tất cả flash sales một lần thay vì query từng cái một trong vòng lặp
            const now = new Date();
            let activeFlashSales = [];
            try {
                activeFlashSales = await modelFlashSale.find({
                    productId: { $in: selectedProductIds },
                    startDate: { $lte: now },
                    endDate: { $gte: now },
                }).lean();
            } catch (flashSaleQueryError) {
                console.error('Error querying flash sales:', flashSaleQueryError);
                // Nếu có lỗi khi query flash sale, tiếp tục với empty array
                activeFlashSales = [];
            }
            
            // Tạo map để lookup nhanh: productId -> discount
            const flashSaleMap = new Map();
            activeFlashSales.forEach((flashSale) => {
                if (flashSale && flashSale.productId) {
                    flashSaleMap.set(flashSale.productId.toString(), flashSale.discount);
                }
            });
            
            // Lưu discount và priceAfterDiscount vào từng item để có thể hiển thị lại sau
            itemsWithDiscount = selectedItems.map((item) => {
                let discount = 0;
                const product = productsData.find((p) => p._id.toString() === item.productId.toString());
                
                // Kiểm tra flash sale từ map (đã query trước đó)
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
            // CHỈ áp dụng coupon nếu frontend gửi useCoupon: true (người dùng đã chọn coupon trong checkout)
            selectedFinalPrice = selectedTotalPrice;
            
            if (useCoupon === true && findCart.coupon && findCart.coupon.code) {
                selectedFinalPrice = selectedTotalPrice - (selectedTotalPrice * findCart.coupon.discount) / 100;
                couponToApply = findCart.coupon;
            }
            
            // Lưu thông tin useCoupon vào cart để callback có thể sử dụng
            // Nếu useCoupon = false, xóa coupon khỏi cart để callback không áp dụng
            if (useCoupon === false) {
                findCart.coupon = null;
                await findCart.save();
            } else if (useCoupon === true && findCart.coupon) {
                // Đảm bảo coupon được lưu trong cart để callback sử dụng
                await findCart.save();
            }
        } catch (calculationError) {
            console.error('Error calculating prices:', calculationError);
            throw new BadRequestError('Lỗi tính toán giá sản phẩm: ' + (calculationError.message || 'Unknown error'));
        }

        if (paymentMethod === 'momo') {
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
        } else if (paymentMethod === 'vnpay') {
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
        } else if (paymentMethod === 'zalopay') {
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
                    const Product = require('../models/product.model');
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
        } else if (paymentMethod === 'cod') {
            // COD: Tạo payment với status = 'confirmed' ngay lập tức
            const payment = await Payment.create({
                products: itemsWithDiscount,
                totalPrice: selectedTotalPrice,
                fullName: finalFullName,
                phone: finalPhone,
                address: finalAddress,
                finalPrice: selectedFinalPrice,
                coupon: couponToApply,
                userId,
                paymentMethod: 'cod',
                status: 'confirmed',
            });
            
            // Đánh dấu coupon đã được user sử dụng (nếu có)
            if (payment.coupon && payment.coupon.code) {
                await markCouponAsUsed(payment.coupon.code, userId);
            }
            
            // Xóa sản phẩm đã chọn khỏi giỏ hàng
            await this.removeSelectedItemsFromCart(findCart._id, selectedItems);
            
            return payment;
        }
    }

    // Helper function: Xóa các sản phẩm đã chọn khỏi giỏ hàng
    async removeSelectedItemsFromCart(cartId, selectedItems) {
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

        // Cập nhật lại totalPrice dựa trên các sản phẩm còn lại (tính cho tất cả, không chỉ selected)
        const allProductIds = cart.products.map((p) => p.productId);
        const productsData = await Product.find({ _id: { $in: allProductIds } });
        cart.totalPrice = await this.calculateTotalForAllItems(cart, productsData);

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

    // Helper function: Tính tổng cho TẤT CẢ sản phẩm trong giỏ hàng (không chỉ selected)
    async calculateTotalForAllItems(cart, productsData) {
        const modelFlashSale = require('../models/flashSale.model');
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

        return total;
    }

    // Tìm payment bằng orderId và cập nhật status thành confirmed
    async findPaymentByOrderId(orderId) {
        const Payment = require('../models/payment.model');
        const payment = await Payment.findOne({ orderId });
        
        if (payment && payment.status === 'pending') {
            // Cập nhật status thành confirmed
            payment.status = 'confirmed';
            await payment.save();
            
            // Xóa sản phẩm đã chọn khỏi giỏ hàng
            const Cart = require('../models/cart.model');
            const cart = await Cart.findOne({ userId: payment.userId });
            if (cart && cart.products && cart.products.length > 0) {
                // Tạo map để so sánh: productId + colorId + sizeId
                const paymentItemsMap = new Map();
                payment.products.forEach(p => {
                    const key = `${p.productId.toString()}_${p.colorId.toString()}_${p.sizeId.toString()}`;
                    paymentItemsMap.set(key, p.quantity);
                });
                
                // Xóa các item khớp với payment
                cart.products = cart.products.filter(item => {
                    const key = `${item.productId.toString()}_${item.colorId.toString()}_${item.sizeId.toString()}`;
                    return !paymentItemsMap.has(key);
                });
                await cart.save();
            }
        }
        
        return payment;
    }

    // Tìm payment ZaloPay gần đây (trong vòng 10 phút) để fallback
    async findRecentZaloPayPayment(appTransId) {
        const Payment = require('../models/payment.model');
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
                    return await this.findPaymentByOrderId(payment.orderId);
                }
                // So sánh phần sau dấu gạch dưới (format: yymmdd_OrderID)
                const orderIdParts = payment.orderId.split('_');
                const appTransIdParts = appTransId.split('_');
                if (orderIdParts.length >= 2 && appTransIdParts.length >= 2) {
                    if (orderIdParts[1] === appTransIdParts[1]) {
                        return await this.findPaymentByOrderId(payment.orderId);
                    }
                }
            }
        }
        
        return null;
    }

    // Lấy tất cả payments ZaloPay pending để debug
    async getAllPendingZaloPayPayments() {
        const Payment = require('../models/payment.model');
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

    // Tìm payment ZaloPay pending gần đây nhất (trong 10 phút)
    async findMostRecentPendingZaloPayPayment() {
        const Payment = require('../models/payment.model');
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        // Tìm payment pending gần đây nhất với paymentMethod = 'zalopay'
        const payment = await Payment.findOne({
            paymentMethod: 'zalopay',
            status: 'pending',
            createdAt: { $gte: tenMinutesAgo }
        }).sort({ createdAt: -1 });
        
        if (payment && payment.status === 'pending') {
            // Cập nhật status thành confirmed
            payment.status = 'confirmed';
            await payment.save();
            
            // Xóa sản phẩm đã chọn khỏi giỏ hàng
            const Cart = require('../models/cart.model');
            const cart = await Cart.findOne({ userId: payment.userId });
            if (cart && cart.products && cart.products.length > 0) {
                // Tạo map để so sánh: productId + colorId + sizeId
                const paymentItemsMap = new Map();
                payment.products.forEach(p => {
                    const key = `${p.productId.toString()}_${p.colorId.toString()}_${p.sizeId.toString()}`;
                    paymentItemsMap.set(key, p.quantity);
                });
                
                // Xóa các item khớp với payment
                cart.products = cart.products.filter(item => {
                    const key = `${item.productId.toString()}_${item.colorId.toString()}_${item.sizeId.toString()}`;
                    return !paymentItemsMap.has(key);
                });
                await cart.save();
            }
        }
        
        return payment;
    }

    async getPaymentById(id) {
        const payment = await Payment.findById(id)
            .populate({
                path: 'products.productId',
                select: 'name price discount colors variants',
            })
            .lean();

        const items = payment.products.map((item) => {
            const product = item.productId;
            
            // Tìm color - với fallback nếu không tìm thấy
            let color = null;
            if (product.colors && Array.isArray(product.colors)) {
                color = product.colors.find((c) => c._id.toString() === item.colorId.toString());
                // Nếu không tìm thấy color theo colorId, lấy color đầu tiên làm fallback
                if (!color && product.colors.length > 0) {
                    color = product.colors[0];
                }
            }
            
            const variant = product.variants?.find((v) => v._id.toString() === item.sizeId.toString());

            // Sử dụng discount và priceAfterDiscount đã lưu khi tạo payment (có thể là flash sale)
            // Nếu không có, fallback về product.discount (backward compatibility)
            const appliedDiscount = item.discount !== undefined ? item.discount : (product.discount || 0);
            const appliedPriceAfterDiscount = item.priceAfterDiscount !== undefined 
                ? item.priceAfterDiscount 
                : (product.price * (1 - appliedDiscount / 100));

            // Helper function to get first image from color (supports both array and string for backward compatibility)
            const getFirstImage = (color) => {
                if (!color?.images) return null;
                if (Array.isArray(color.images)) {
                    return color.images[0] || null;
                }
                return color.images;
            };

            return {
                _id: item._id,
                name: product.name,
                price: product.price, // giá gốc
                discount: appliedDiscount, // % giảm đã áp dụng (có thể là flash sale)
                priceAfterDiscount: appliedPriceAfterDiscount, // giá sau giảm đã áp dụng
                color: color ? color.name : null,
                image: color ? getFirstImage(color) : null,
                size: variant ? variant.size : null,
                quantity: item.quantity,
                subtotal: appliedPriceAfterDiscount * item.quantity,
                coupon: payment.coupon,
                paymentMethod: payment.paymentMethod,
                idProduct: product._id,
            };
        });
        return { 
            items, 
            totalPrice: payment.totalPrice, 
            finalPrice: payment.finalPrice || payment.totalPrice, // Trả về finalPrice từ server
            coupon: payment.coupon, 
            paymentMethod: payment.paymentMethod 
        };
    }

    // Fallback: Tạo payment mới nếu không tìm thấy bằng orderId (backward compatibility)
    async momoCallback(id) {
        const findCart = await Cart.findOne({ userId: id });
        if (!findCart) {
            throw new BadRequestError('Cart not found');
        }

        const selectedItems = (findCart.products || []).filter((item) => item.isSelected === true);
        if (!selectedItems.length) {
            throw new BadRequestError('No selected items in cart');
        }

        // Tính lại totalPrice và finalPrice chỉ dựa trên selectedItems
        const Product = require('../models/product.model');
        const modelFlashSale = require('../models/flashSale.model');
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
        if (findCart.coupon && findCart.coupon.code) {
            selectedFinalPrice = selectedTotalPrice - (selectedTotalPrice * findCart.coupon.discount) / 100;
        }

        const payment = await Payment.create({
            products: itemsWithDiscount,
            totalPrice: selectedTotalPrice,
            fullName: findCart.fullName,
            phone: findCart.phone,
            address: findCart.address,
            finalPrice: selectedFinalPrice,
            coupon: findCart.coupon && findCart.coupon.code ? findCart.coupon : null,
            userId: id,
            paymentMethod: 'momo',
            status: 'confirmed', // Tự động xác nhận khi thanh toán qua MoMo thành công
        });
        
        // Đánh dấu coupon đã được user sử dụng (nếu có)
        if (payment.coupon && payment.coupon.code) {
            await markCouponAsUsed(payment.coupon.code, id);
        }
        
        // Chỉ xóa các sản phẩm đã chọn khỏi giỏ hàng, không xóa toàn bộ
        await this.removeSelectedItemsFromCart(findCart._id, selectedItems);
        return payment;
    }

    // Fallback: Tạo payment mới nếu không tìm thấy bằng orderId (backward compatibility)
    async zalopayCallback(id) {
        const findCart = await Cart.findOne({ userId: id });
        if (!findCart) {
            throw new BadRequestError('Cart not found');
        }

        const selectedItems = (findCart.products || []).filter((item) => item.isSelected === true);
        if (!selectedItems.length) {
            throw new BadRequestError('No selected items in cart');
        }

        // Tính lại totalPrice và finalPrice chỉ dựa trên selectedItems
        const Product = require('../models/product.model');
        const modelFlashSale = require('../models/flashSale.model');
        const selectedProductIds = selectedItems.map((item) => item.productId);
        const productsData = await Product.find({ _id: { $in: selectedProductIds } });
        
        // Tối ưu: Query tất cả flash sales một lần thay vì query từng cái một trong vòng lặp
        const now = new Date();
        const activeFlashSales = await modelFlashSale.find({
            productId: { $in: selectedProductIds },
            startDate: { $lte: now },
            endDate: { $gte: now },
        }).lean();
        
        // Tạo map để lookup nhanh: productId -> discount
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
            
            // Kiểm tra flash sale từ map (đã query trước đó)
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
        // Trong callback, chỉ áp dụng coupon nếu cart vẫn còn coupon (đã được lưu từ createPayment)
        let selectedFinalPrice = selectedTotalPrice;
        let couponToApply = null;
        
        if (findCart.coupon && findCart.coupon.code) {
            selectedFinalPrice = selectedTotalPrice - (selectedTotalPrice * findCart.coupon.discount) / 100;
            couponToApply = findCart.coupon;
        }

        const payment = await Payment.create({
            products: itemsWithDiscount,
            totalPrice: selectedTotalPrice,
            fullName: findCart.fullName,
            phone: findCart.phone,
            address: findCart.address,
            finalPrice: selectedFinalPrice,
            coupon: couponToApply, // Sử dụng couponToApply
            userId: id,
            paymentMethod: 'zalopay',
            status: 'confirmed', // Tự động xác nhận khi thanh toán qua ZaloPay thành công
        });
        
        // Đánh dấu coupon đã được user sử dụng (nếu có)
        if (payment.coupon && payment.coupon.code) {
            await markCouponAsUsed(payment.coupon.code, id);
        }
        
        // Chỉ xóa các sản phẩm đã chọn khỏi giỏ hàng, không xóa toàn bộ
        await this.removeSelectedItemsFromCart(findCart._id, selectedItems);
        return payment;
    }

    // Fallback: Tạo payment mới nếu không tìm thấy bằng orderId (backward compatibility)
    async vnpayCallback(id) {
        const findCart = await Cart.findOne({ userId: id });
        if (!findCart) {
            throw new BadRequestError('Cart not found');
        }

        const selectedItems = (findCart.products || []).filter((item) => item.isSelected === true);
        if (!selectedItems.length) {
            throw new BadRequestError('No selected items in cart');
        }

        // Tính lại totalPrice và finalPrice chỉ dựa trên selectedItems
        const Product = require('../models/product.model');
        const modelFlashSale = require('../models/flashSale.model');
        const selectedProductIds = selectedItems.map((item) => item.productId);
        const productsData = await Product.find({ _id: { $in: selectedProductIds } });
        
        // Tối ưu: Query tất cả flash sales một lần thay vì query từng cái một trong vòng lặp
        const now = new Date();
        const activeFlashSales = await modelFlashSale.find({
            productId: { $in: selectedProductIds },
            startDate: { $lte: now },
            endDate: { $gte: now },
        }).lean();
        
        // Tạo map để lookup nhanh: productId -> discount
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
            
            // Kiểm tra flash sale từ map (đã query trước đó)
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
        // Trong callback, chỉ áp dụng coupon nếu cart vẫn còn coupon (đã được lưu từ createPayment)
        let selectedFinalPrice = selectedTotalPrice;
        let couponToApply = null;
        
        if (findCart.coupon && findCart.coupon.code) {
            selectedFinalPrice = selectedTotalPrice - (selectedTotalPrice * findCart.coupon.discount) / 100;
            couponToApply = findCart.coupon;
        }

        const payment = await Payment.create({
            products: itemsWithDiscount,
            totalPrice: selectedTotalPrice,
            fullName: findCart.fullName,
            phone: findCart.phone,
            address: findCart.address,
            finalPrice: selectedFinalPrice,
            coupon: couponToApply, // Sử dụng couponToApply
            userId: id,
            paymentMethod: 'vnpay',
            status: 'confirmed', // Tự động xác nhận khi thanh toán qua VNPay thành công
        });
        
        // Đánh dấu coupon đã được user sử dụng (nếu có)
        if (payment.coupon && payment.coupon.code) {
            await markCouponAsUsed(payment.coupon.code, id);
        }
        
        // Chỉ xóa các sản phẩm đã chọn khỏi giỏ hàng, không xóa toàn bộ
        await this.removeSelectedItemsFromCart(findCart._id, selectedItems);
        return payment;
    }

    async getAllOrder(search = '', status = '') {
        // Build query với search và status filter
        let query = {};
        
        // Filter theo status nếu có
        if (status && status !== 'all') {
            query.status = status;
        }
        
        // Lấy toàn bộ đơn hàng + populate sản phẩm
        let payments = await Payment.find(query)
            .populate({
                path: 'products.productId',
                select: 'name price discount colors variants',
            })
            .populate('userId', 'fullName email phone') // thông tin người dùng
            .lean()
            .sort({ createdAt: -1 });
        
        // Filter theo search nếu có (search theo _id, fullName, email)
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive
            payments = payments.filter((payment) => {
                const paymentId = payment._id.toString().toLowerCase();
                const fullName = payment.userId?.fullName?.toLowerCase() || '';
                const email = payment.userId?.email?.toLowerCase() || '';
                const searchLower = search.trim().toLowerCase();
                
                return paymentId.includes(searchLower) || 
                       fullName.includes(searchLower) || 
                       email.includes(searchLower);
            });
        }

        // Duyệt từng đơn hàng
        const orders = payments.map((payment) => {
            // Duyệt từng sản phẩm trong đơn hàng
            const items = payment.products
                .map((item) => {
                    const product = item.productId;
                    if (!product) return null;

                    // Tìm color - với fallback nếu không tìm thấy
                    let color = null;
                    if (product.colors && Array.isArray(product.colors)) {
                        color = product.colors.find((c) => c._id.toString() === item.colorId.toString());
                        // Nếu không tìm thấy color theo colorId, lấy color đầu tiên làm fallback
                        if (!color && product.colors.length > 0) {
                            color = product.colors[0];
                        }
                    }
                    
                    const variant = product.variants?.find((v) => v._id.toString() === item.sizeId.toString());

                    const priceAfterDiscount = product.price * (1 - (product.discount || 0) / 100);

                    // Helper function to get first image from color
                    const getFirstImage = (color) => {
                        if (!color?.images) return null;
                        if (Array.isArray(color.images)) {
                            return color.images[0] || null;
                        }
                        return color.images;
                    };

                    return {
                        _id: item._id,
                        name: product.name,
                        price: product.price,
                        discount: product.discount || 0,
                        priceAfterDiscount,
                        color: color ? color.name : null,
                        image: color ? getFirstImage(color) : null,
                        size: variant ? variant.size : null,
                        quantity: item.quantity,
                        subtotal: priceAfterDiscount * item.quantity,
                        idProduct: product._id,
                    };
                })
                .filter(Boolean);

            return {
                _id: payment._id,
                user: payment.userId || null,
                items,
                totalPrice: payment.totalPrice,
                finalPrice: payment.finalPrice,
                coupon: payment.coupon,
                paymentMethod: payment.paymentMethod,
                status: payment.status,
                createdAt: payment.createdAt,
                phone: payment.phone,
                address: payment.address,
                fullName: payment.fullName,
            };
        });

        return orders;
    }

    async updateOrderStatus(orderId, status) {
        const order = await Payment.findByIdAndUpdate(orderId, { status }, { new: true });
        if (status === 'delivered') {
            await generateWarrantyProduct(order.products, order.userId, order._id);
        }
        return order;
    }

    async cancelOrder(orderId, userId) {
        const order = await Payment.findOne({ _id: orderId, userId });
        if (!order) {
            throw new BadRequestError('Đơn hàng không tồn tại hoặc không thuộc về bạn');
        }

        // Chỉ cho phép hủy đơn khi ở trạng thái pending hoặc confirmed (chưa shipping)
        if (order.status === 'shipping' || order.status === 'delivered') {
            throw new BadRequestError('Không thể hủy đơn hàng đang được giao hoặc đã giao');
        }

        if (order.status === 'cancelled') {
            throw new BadRequestError('Đơn hàng đã được hủy trước đó');
        }

        order.status = 'cancelled';
        await order.save();
        return order;
    }

    async getOrderHistory(userId) {
        const payments = await Payment.find({ userId })
            .populate({
                path: 'products.productId',
                select: 'name price discount colors variants',
            })
            .populate('userId', 'fullName email phone') // thông tin người dùng
            .lean()
            .sort({ createdAt: -1 });

        const previewProducts = await PreviewProduct.find({ userId });

        // Duyệt từng đơn hàng
        const orders = payments.map((payment) => {
            // Duyệt từng sản phẩm trong đơn hàng
            const items = payment.products
                .map((item) => {
                    const product = item.productId;
                    if (!product) return null;

                    // Tìm color - với fallback nếu không tìm thấy
                    let color = null;
                    if (product.colors && Array.isArray(product.colors)) {
                        color = product.colors.find((c) => c._id.toString() === item.colorId.toString());
                        // Nếu không tìm thấy color theo colorId, lấy color đầu tiên làm fallback
                        if (!color && product.colors.length > 0) {
                            color = product.colors[0];
                        }
                    }
                    
                    const variant = product.variants?.find((v) => v._id.toString() === item.sizeId.toString());
                    // Tìm previewProduct theo cả productId và orderId để mỗi đơn hàng có thể đánh giá riêng
                    const previewProduct = previewProducts.find(
                        (p) => p.productId.toString() === product._id.toString() && 
                               p.orderId && p.orderId.toString() === payment._id.toString(),
                    );

                    // Sử dụng discount và priceAfterDiscount đã lưu khi tạo payment (có thể là flash sale)
                    // Nếu không có, fallback về product.discount (backward compatibility)
                    const appliedDiscount = item.discount !== undefined ? item.discount : (product.discount || 0);
                    const appliedPriceAfterDiscount = item.priceAfterDiscount !== undefined 
                        ? item.priceAfterDiscount 
                        : (product.price * (1 - appliedDiscount / 100));

                    // Helper function to get first image from color
                    const getFirstImage = (color) => {
                        if (!color?.images) return null;
                        if (Array.isArray(color.images)) {
                            return color.images[0] || null;
                        }
                        return color.images;
                    };

                    return {
                        _id: item._id,
                        name: product.name,
                        price: product.price,
                        discount: appliedDiscount, // % giảm đã áp dụng (có thể là flash sale)
                        priceAfterDiscount: appliedPriceAfterDiscount,
                        color: color ? color.name : null,
                        image: color ? getFirstImage(color) : null,
                        size: variant ? variant.size : null,
                        quantity: item.quantity,
                        subtotal: appliedPriceAfterDiscount * item.quantity,
                        idProduct: product._id,
                        previewProduct: previewProduct,
                    };
                })
                .filter(Boolean);

            return {
                _id: payment._id,
                user: payment.userId || null,
                items,
                totalPrice: payment.totalPrice,
                finalPrice: payment.finalPrice,
                coupon: payment.coupon,
                paymentMethod: payment.paymentMethod,
                status: payment.status,
                createdAt: payment.createdAt,
                phone: payment.phone,
                address: payment.address,
                fullName: payment.fullName,
            };
        });

        return orders;
    }
}

module.exports = new PaymentService();
