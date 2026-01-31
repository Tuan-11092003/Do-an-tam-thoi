const Product = require('../models/product.model');
const Cart = require('../models/cart.model');
const Coupon = require('../models/counpon.model');
const modelFlashSale = require('../models/flashSale.model');
const { BadRequestError } = require('../core/error.response');

class CartService {
    async calculateTotal(cart, productsData) {
        let total = 0;

        for (const item of cart.products) {
            // Bỏ qua sản phẩm không được chọn
            if (item.isSelected === false) continue;

            let discount = 0;
            const product = productsData.find((p) => p._id.toString() === item.productId.toString());

            // Kiểm tra flash sale còn hiệu lực không (startDate <= hiện tại <= endDate)
            const now = new Date();
            const findFlashSale = await modelFlashSale.findOne({
                productId: item.productId,
                startDate: { $lte: now },
                endDate: { $gte: now },
            });
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

    // ✅ TỐI ƯU: Bỏ tham số buyNow, luôn thêm sản phẩm mới vào đầu giỏ hàng
    async addToCart(userId, productId, quantity, sizeId, colorId) {
        if (!userId || !productId || !colorId || !sizeId) {
            throw new Error('Thiếu dữ liệu cần thiết');
        }

        const product = await Product.findById(productId);
        if (!product) throw new Error('Không tìm thấy sản phẩm');

        const variant = product.variants.id(sizeId);
        if (!variant) throw new Error('Không tìm thấy size sản phẩm');

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Kiểm tra stock cho trường hợp giỏ hàng mới
            if (variant.stock < quantity) throw new Error('Số lượng trong kho không đủ');
            cart = new Cart({
                userId,
                products: [{ productId, colorId, sizeId, quantity, isSelected: false }],
                totalPrice: 0,
            });
        } else {
            const existingItem = cart.products.find(
                (item) =>
                    item.productId.toString() === productId &&
                    item.colorId.toString() === colorId.toString() &&
                    item.sizeId.toString() === sizeId.toString(),
            );

            if (existingItem) {
                // ✅ SẢN PHẨM ĐÃ CÓ → Tăng quantity VÀ đưa lên đầu giỏ hàng
                const totalQuantity = existingItem.quantity + quantity;
                if (variant.stock < totalQuantity) throw new Error('Số lượng trong kho không đủ để thêm');
                
                // Lưu trạng thái isSelected trước khi xóa
                const wasSelected = existingItem.isSelected;
                
                // Xóa item cũ khỏi giỏ hàng
                cart.products.pull(existingItem._id);
                
                // Thêm lại vào đầu với quantity mới
                cart.products.unshift({ 
                    productId, 
                    colorId, 
                    sizeId, 
                    quantity: totalQuantity, 
                    isSelected: wasSelected  // Giữ nguyên trạng thái chọn
                });
            } else {
                // ✅ SẢN PHẨM MỚI → Luôn thêm vào đầu giỏ hàng
                if (variant.stock < quantity) throw new Error('Số lượng trong kho không đủ');
                cart.products.unshift({ productId, colorId, sizeId, quantity, isSelected: false });
            }
        }

        variant.stock -= quantity;

        // 🧮 Tính tổng trước khi lưu
        const allProductIds = cart.products.map((p) => p.productId);
        const productsData = await Product.find({ _id: { $in: allProductIds } });
        cart.totalPrice = await this.calculateTotal(cart, productsData);

        await Promise.all([product.save(), cart.save()]);

        // Reload cart để đảm bảo có _id mới nhất
        const updatedCart = await Cart.findById(cart._id);

        // Tìm item vừa thêm (hoặc đã tồn tại) để trả về itemId
        const addedItem = updatedCart.products.find(
            (item) =>
                item.productId.toString() === productId &&
                item.colorId.toString() === colorId.toString() &&
                item.sizeId.toString() === sizeId.toString(),
        );

        return {
            cart: updatedCart,
            addedItemId: addedItem && addedItem._id ? addedItem._id.toString() : null,
        };
    }

    // 📦 Lấy giỏ hàng
    async getCart(userId) {
        const cart = await Cart.findOne({ userId })
            .populate({
                path: 'products.productId',
                select: 'name price discount colors variants',
            })
            .lean();

        if (!cart) return { items: [], coupon: [] };

        const today = new Date();

        const coupon = await Coupon.find({
            startDate: { $lte: today },
            endDate: { $gte: today },
            minPrice: { $lte: cart.totalPrice },
            quantity: { $gt: 0 },
        }).lean();

        // 🔁 Xử lý từng sản phẩm trong giỏ hàng
        const items = await Promise.all(
            cart.products.map(async (item) => {
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

                // 🔍 Kiểm tra flash sale còn hiệu lực không (startDate <= hiện tại <= endDate)
                let discount = 0;
                const now = new Date();
                const findFlashSale = await modelFlashSale.findOne({
                    productId: item.productId,
                    startDate: { $lte: now },
                    endDate: { $gte: now },
                });
                if (findFlashSale) {
                    discount = findFlashSale.discount;
                } else {
                    discount = product?.discount || 0;
                }

                const priceAfterDiscount = product.price * (1 - discount / 100);

                // Hàm lấy ảnh đầu tiên từ color (hỗ trợ cả mảng và chuỗi để tương thích ngược)
                const getFirstImage = (color) => {
                    if (!color?.images) return null;
                    if (Array.isArray(color.images)) {
                        return color.images[0] || null;
                    }
                    return color.images;
                };

                // Đảm bảo productId luôn là string hợp lệ
                let productIdString;
                if (product && product._id) {
                    productIdString = product._id.toString();
                } else if (typeof item.productId === 'object' && item.productId._id) {
                    productIdString = item.productId._id.toString();
                } else {
                    productIdString = String(item.productId);
                }
                
                return {
                    _id: item._id,
                    productId: productIdString,
                    colorId: item.colorId.toString(),
                    sizeId: item.sizeId.toString(),
                    name: product.name,
                    price: product.price, // giá gốc
                    discount, // % giảm
                    priceAfterDiscount, // giá sau giảm
                    color: color ? color.name : null,
                    image: color ? getFirstImage(color) : null,
                    size: variant ? variant.size : null,
                    quantity: item.quantity,
                    subtotal: priceAfterDiscount * item.quantity,
                    coupon: cart.coupon,
                    isSelected: item.isSelected === true,
                };
            }),
        );

        // Tính summary cho các sản phẩm đã chọn (isSelected: true)
        const selectedItems = items.filter(item => item.isSelected === true);
        const subtotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);

        // Tính coupon discount nếu có coupon
        let couponDiscount = 0;
        let finalTotal = subtotal;
        if (cart.coupon && cart.coupon.code) {
            couponDiscount = (subtotal * cart.coupon.discount) / 100;
            finalTotal = Math.max(subtotal - couponDiscount, 0);
        }

        return { 
            items, 
            totalPrice: cart.totalPrice, 
            coupon,
            summary: {
                subtotal,
                couponDiscount,
                finalTotal
            }
        };
    }

    // ✏️ Cập nhật số lượng
    async updateCartQuantity(userId, itemId, newQuantity) {
        // ✅ Validate: Số lượng phải >= 1
        if (!newQuantity || newQuantity < 1) {
            throw new Error('Số lượng phải lớn hơn hoặc bằng 1');
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) throw new Error('Không tìm thấy giỏ hàng');

        const cartItem = cart.products.id(itemId);
        if (!cartItem) throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');

        const product = await Product.findById(cartItem.productId);
        if (!product) throw new Error('Không tìm thấy sản phẩm trong kho');

        const variant = product.variants.id(cartItem.sizeId);
        if (!variant) throw new Error('Không tìm thấy size trong sản phẩm');

        const diff = newQuantity - cartItem.quantity;

        if (diff > 0) {
            if (variant.stock < diff) throw new Error('Số lượng trong kho không đủ');
            variant.stock -= diff;
        } else if (diff < 0) {
            variant.stock += Math.abs(diff);
        }

        cartItem.quantity = newQuantity;
        await Promise.all([cart.save(), product.save()]);

        // 🧮 Cập nhật tổng tiền
        const allProductIds = cart.products.map((p) => p.productId);
        const productsData = await Product.find({ _id: { $in: allProductIds } });
        cart.totalPrice = await this.calculateTotal(cart, productsData);
        await cart.save();

        return cart;
    }

    // ❌ Xóa sản phẩm
    async removeItemFromCart(userId, itemId) {
        const cart = await Cart.findOne({ userId });
        if (!cart) throw new Error('Không tìm thấy giỏ hàng');

        const cartItem = cart.products.id(itemId);
        if (!cartItem) throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');

        const product = await Product.findById(cartItem.productId);
        if (!product) throw new Error('Không tìm thấy sản phẩm trong kho');

        const variant = product.variants.id(cartItem.sizeId);
        if (!variant) throw new Error('Không tìm thấy size sản phẩm');

        variant.stock += cartItem.quantity;
        cart.products.pull(itemId);

        await Promise.all([cart.save(), product.save()]);

        // 🧮 Cập nhật tổng tiền sau khi xóa
        const allProductIds = cart.products.map((p) => p.productId);
        const productsData = await Product.find({ _id: { $in: allProductIds } });
        cart.totalPrice = await this.calculateTotal(cart, productsData);
        await cart.save();

        return cart;
    }

    async applyCoupon(userId, nameCoupon) {
        const cart = await Cart.findOne({ userId });
        if (!cart) throw new BadRequestError('Giỏ hàng không tồn tại');

        const newCoupon = await Coupon.findOne({ nameCoupon });
        if (!newCoupon) throw new BadRequestError('Mã giảm giá không tồn tại');

        // ✅ THÊM: Kiểm tra user đã sử dụng coupon này chưa
        if (newCoupon.usedBy && newCoupon.usedBy.includes(userId.toString())) {
            throw new BadRequestError('Bạn đã sử dụng mã giảm giá này rồi');
        }

        const now = new Date();
        if (now < newCoupon.startDate || now > newCoupon.endDate) {
            throw new BadRequestError('Mã giảm giá đã hết hạn hoặc chưa được kích hoạt');
        }

        if (newCoupon.quantity <= 0) {
            throw new BadRequestError('Mã giảm giá đã hết lượt sử dụng');
        }

        if (cart.totalPrice < newCoupon.minPrice) {
            throw new BadRequestError(
                `Đơn hàng phải tối thiểu ${newCoupon.minPrice.toLocaleString()} VND để dùng mã này`,
            );
        }

        // 🧾 Nếu giỏ hàng đã có mã trước đó → hoàn lại lượt
        if (cart.coupon && cart.coupon.code) {
            const oldCoupon = await Coupon.findOne({ nameCoupon: cart.coupon.code });
            if (oldCoupon) {
                oldCoupon.quantity += 1; // hoàn lại lượt
                await oldCoupon.save();
            }
        }

        // ✅ Tính giảm mới
        const discountAmount = (cart.totalPrice * newCoupon.discount) / 100;
        const finalPrice = Math.max(cart.totalPrice - discountAmount, 0);

        // ✅ Cập nhật lại thông tin mã mới
        cart.coupon = {
            code: newCoupon.nameCoupon,
            discount: newCoupon.discount,
            discountAmount,
        };
        cart.finalPrice = finalPrice;

        // ✅ Giảm lượt của mã mới
        newCoupon.quantity -= 1;

        await Promise.all([cart.save(), newCoupon.save()]);

        return {
            message: `Áp dụng mã ${newCoupon.nameCoupon} thành công!`,
            totalPrice: cart.totalPrice,
            discount: newCoupon.discount,
            discountAmount,
            finalPrice,
        };
    }

    async updateInfoCart(userId, fullName, phone, address) {
        const cart = await Cart.findOne({ userId });
        if (!cart) throw new BadRequestError('Giỏ hàng không tồn tại');
        cart.fullName = fullName;
        cart.phone = phone;
        cart.address = address;
        await cart.save();
        return cart;
    }

    // ✅ Cập nhật danh sách sản phẩm được chọn để thanh toán
    async updateSelection(userId, selectedItemIds = []) {
        const cart = await Cart.findOne({ userId });
        if (!cart) throw new BadRequestError('Giỏ hàng không tồn tại');

        const idSet = new Set(selectedItemIds.map((id) => id.toString()));

        cart.products.forEach((item) => {
            // Nếu không gửi gì lên, mặc định không chọn sản phẩm nào
            if (idSet.size === 0) {
                item.isSelected = false;
            } else {
                item.isSelected = idSet.has(item._id.toString());
            }
        });

        // 🧮 Cập nhật lại totalPrice dựa trên các sản phẩm ĐÃ CHỌN (isSelected: true)
        const allProductIds = cart.products.map((p) => p.productId);
        const productsData = await Product.find({ _id: { $in: allProductIds } });
        cart.totalPrice = await this.calculateTotal(cart, productsData);

        await cart.save();
        return cart;
    }
}

module.exports = new CartService();
