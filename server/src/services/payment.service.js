const Cart = require('../models/cart.model');
const Payment = require('../models/payment.model');
const Warranty = require('../models/warranty.model');
const PreviewProduct = require('../models/previewProduct.model');
const Product = require('../models/product.model');
const { BadRequestError } = require('../core/error.response');
const CartService = require('./cart.service');
const momoPaymentService = require('./payment/momoPayment.service');
const zalopayPaymentService = require('./payment/zalopayPayment.service');
const { markCouponAsUsed } = require('./payment/payment.helpers');

const crypto = require('crypto');
const https = require('https');

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
                console.error('Lỗi truy vấn flash sale:', flashSaleQueryError);
                // Nếu lỗi khi truy vấn flash sale thì tiếp tục với mảng rỗng
                activeFlashSales = [];
            }
            
            // Tạo map để tra cứu nhanh: productId -> discount
            const flashSaleMap = new Map();
            activeFlashSales.forEach((flashSale) => {
                if (flashSale && flashSale.productId) {
                    flashSaleMap.set(flashSale.productId.toString(), flashSale.discount);
                }
            });
            
            // Lưu discount và priceAfterDiscount vào từng item để hiển thị lại sau
            itemsWithDiscount = selectedItems.map((item) => {
                let discount = 0;
                const product = productsData.find((p) => p._id.toString() === item.productId.toString());
                
                // Kiểm tra flash sale từ map (đã truy vấn trước đó)
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
            
            // Tính finalPrice theo coupon nếu có
            // CHỈ áp dụng coupon khi frontend gửi useCoupon: true (người dùng đã chọn coupon ở trang thanh toán)
            selectedFinalPrice = selectedTotalPrice;
            
            if (useCoupon === true && findCart.coupon && findCart.coupon.code) {
                selectedFinalPrice = selectedTotalPrice - (selectedTotalPrice * findCart.coupon.discount) / 100;
                couponToApply = findCart.coupon;
            }
            
            // Lưu thông tin useCoupon vào cart để callback dùng
            // Nếu useCoupon = false thì xóa coupon khỏi cart để callback không áp dụng
            if (useCoupon === false) {
                findCart.coupon = null;
                await findCart.save();
            } else if (useCoupon === true && findCart.coupon) {
                // Đảm bảo coupon được lưu trong cart để callback dùng
                await findCart.save();
            }
        } catch (calculationError) {
            console.error('Error calculating prices:', calculationError);
            throw new BadRequestError('Lỗi tính toán giá sản phẩm: ' + (calculationError.message || 'Unknown error'));
        }

        if (paymentMethod === 'momo') {
            return momoPaymentService.createPayment({
                itemsWithDiscount,
                selectedTotalPrice,
                selectedFinalPrice,
                finalFullName,
                finalPhone,
                finalAddress,
                couponToApply,
                userId,
            });
        }
        if (paymentMethod === 'zalopay') {
            return zalopayPaymentService.createPayment({
                itemsWithDiscount,
                selectedTotalPrice,
                selectedFinalPrice,
                finalFullName,
                finalPhone,
                finalAddress,
                couponToApply,
                userId,
            });
        }
        if (paymentMethod === 'cod') {
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
                status: 'pending',
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

    // Hàm trợ giúp: Xóa các sản phẩm đã chọn khỏi giỏ hàng
    async removeSelectedItemsFromCart(cartId, selectedItems) {
        const cart = await Cart.findById(cartId);
        if (!cart) return;

        // Lấy danh sách ID sản phẩm đã chọn
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
        return zalopayPaymentService.findRecentPayment(appTransId, this.findPaymentByOrderId.bind(this));
    }

    // Lấy tất cả payments ZaloPay pending để debug
    async getAllPendingZaloPayPayments() {
        return zalopayPaymentService.getAllPendingPayments();
    }

    // Tìm payment ZaloPay pending gần đây nhất (trong 10 phút)
    async findMostRecentPendingZaloPayPayment() {
        return zalopayPaymentService.findMostRecentPendingPayment(async (paymentId) => {
            const payment = await Payment.findById(paymentId);
            return payment ? await this.findPaymentByOrderId(payment.orderId) : null;
        });
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
        return momoPaymentService.callback(id);
    }

    // Fallback: Tạo payment mới nếu không tìm thấy bằng orderId (backward compatibility)
    async zalopayCallback(id) {
        return zalopayPaymentService.callback(id);
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
