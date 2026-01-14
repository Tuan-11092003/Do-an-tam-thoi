# Đánh Giá Schema Database - Dự Án Bán Giày

## 📋 Tổng Quan
Dự án sử dụng MongoDB với Mongoose. Dưới đây là các vấn đề cần sửa và đề xuất cải thiện.

---

## 🔴 Vấn Đề Nghiêm Trọng

### 1. **Product Model** (`product.model.js`)
**Vấn đề:**
- ❌ `productRelated` (dòng 45-48): Dùng `Object` nhưng nên là `Array` của `ObjectId`
- ❌ `previewProduct` (dòng 55-58): Dùng `Object` nhưng nên là `Array` của `ObjectId`  
- ❌ `favourite` (dòng 60-63): Dùng `Object` nhưng nên là `Array` của `ObjectId`
- ❌ Thiếu validation: `price` và `discount` nên có `min: 0`
- ❌ Thiếu index cho các trường thường query: `category`, `status`, `isFeatured`

**Sửa:**
```javascript
productRelated: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
}],
previewProduct: [{
    type: Schema.Types.ObjectId,
    ref: 'previewProduct'
}],
// Xóa favourite field (không cần, đã có model riêng)
```

### 2. **Cart Model** (`cart.model.js`)
**Vấn đề:**
- ❌ `userId` (dòng 7): Dùng `String` nhưng nên là `ObjectId` với `ref: 'user'`
- ❌ `colorId` và `sizeId` (dòng 11-12): Dùng `ObjectId` nhưng trong Product model, `colors` và `variants` là nested arrays, không phải documents riêng → **Mâu thuẫn kiến trúc**
- ❌ `fullName`, `phone`, `address` (dòng 19-21): Nên lưu trong User model hoặc Address model riêng, không nên duplicate trong Cart
- ❌ `totalPrice` và `finalPrice`: Nên tính toán động, không nên lưu (dễ bị lệch khi giá thay đổi)

**Sửa:**
```javascript
userId: { 
    type: Schema.Types.ObjectId, 
    required: true, 
    ref: 'user' 
},
products: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    colorName: { type: String, required: true }, // Thay vì colorId
    size: { type: String, required: true }, // Thay vì sizeId
    quantity: { type: Number, required: true, min: 1 },
    isSelected: { type: Boolean, default: false },
}],
// Xóa fullName, phone, address (lấy từ User)
// Xóa totalPrice, finalPrice (tính toán khi cần)
```

### 3. **Payment Model** (`payment.model.js`)
**Vấn đề:**
- ❌ `userId` (dòng 7): Dùng `String` nhưng nên là `ObjectId`
- ❌ `colorId` và `sizeId`: Cùng vấn đề như Cart model
- ❌ Model tên là `payment` nhưng Warranty model reference là `Order` → **Không khớp**
- ❌ Thiếu `trackingNumber` cho đơn hàng đã ship
- ❌ Thiếu `shippingFee` và `notes`

**Sửa:**
```javascript
userId: { 
    type: Schema.Types.ObjectId, 
    required: true, 
    ref: 'user' 
},
products: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    colorName: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    discount: { type: Number, default: 0 },
    priceAfterDiscount: { type: Number, required: true },
}],
trackingNumber: { type: String },
shippingFee: { type: Number, default: 0 },
notes: { type: String },
```

### 4. **Warranty Model** (`warranty.model.js`)
**Vấn đề:**
- ❌ `orderId` reference `Order` nhưng model thực tế là `payment` → **Lỗi reference**
- ❌ Thiếu `timestamps: true`
- ❌ Thiếu validation: `endDate` phải sau `startDate` (nếu có)

**Sửa:**
```javascript
orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'payment', // Sửa từ 'Order'
    required: true 
},
// Thêm timestamps
{ timestamps: true }
```

### 5. **PreviewProduct Model** (`previewProduct.model.js`)
**Vấn đề:**
- ❌ `userId` và `productId` (dòng 7-8): Dùng `String` nhưng nên là `ObjectId`
- ❌ `rating` (dòng 10): Thiếu validation `min: 1, max: 5`
- ❌ Thiếu unique constraint: Một user chỉ nên review 1 lần cho 1 sản phẩm

**Sửa:**
```javascript
userId: { 
    type: Schema.Types.ObjectId, 
    require: true, 
    ref: 'user' 
},
productId: { 
    type: Schema.Types.ObjectId, 
    require: true, 
    ref: 'Product' 
},
rating: { 
    type: Number, 
    require: true,
    min: 1,
    max: 5
},
// Thêm index unique
modelPreviewProduct.index({ userId: 1, productId: 1 }, { unique: true });
```

### 6. **MessageChatbot Model** (`messageChatbot.model.js`)
**Vấn đề:**
- ❌ `userId` reference `User` (dòng 9) nhưng model thực tế là `user` (lowercase) → **Case mismatch**

**Sửa:**
```javascript
userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // Sửa từ 'User'
    required: true,
},
```

### 7. **API Key Model** (`apiKey.model.js`)
**Vấn đề:**
- ❌ `userId` (dòng 7): Dùng `String` nhưng nên là `ObjectId`

**Sửa:**
```javascript
userId: { 
    type: Schema.Types.ObjectId, 
    require: true, 
    ref: 'user' 
},
```

### 8. **OTP Model** (`otp.model.js`)
**Vấn đề:**
- ❌ Thiếu TTL index để tự động xóa OTP cũ (thường sau 5-10 phút)
- ❌ Nên có index trên `email` để query nhanh

**Sửa:**
```javascript
// Thêm sau schema definition
modelOtp.index({ createdAt: 1 }, { expireAfterSeconds: 600 }); // 10 phút
modelOtp.index({ email: 1 });
```

### 9. **Coupon Model** (`counpon.model.js`)
**Vấn đề:**
- ❌ Thiếu field `code` (chỉ có `nameCoupon`)
- ❌ Thiếu validation: `endDate` phải sau `startDate`
- ❌ Thiếu `usedCount` để track số lần đã dùng
- ❌ Nên có unique constraint trên `code`

**Sửa:**
```javascript
code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true, // Mã coupon thường viết hoa
},
usedCount: {
    type: Number,
    default: 0,
},
// Thêm validation
endDate: {
    type: Date,
    required: true,
    validate: {
        validator: function(value) {
            return value > this.startDate;
        },
        message: 'End date must be after start date'
    }
},
```

### 10. **Favourite Model** (`favourite.model.js`)
**Vấn đề:**
- ❌ Thiếu unique constraint: Một user không nên favourite cùng 1 sản phẩm 2 lần

**Sửa:**
```javascript
// Thêm sau schema definition
modelFavourite.index({ userId: 1, productId: 1 }, { unique: true });
```

---

## ⚠️ Vấn Đề Trung Bình

### 11. **User Model** (`users.model.js`)
**Đề xuất cải thiện:**
- ✅ Nên thêm `email` unique constraint
- ✅ Nên thêm validation cho `email` format
- ✅ Nên thêm field `addresses: []` để lưu nhiều địa chỉ
- ✅ Nên thêm `isEmailVerified: Boolean`

### 12. **FlashSale Model** (`flashSale.model.js`)
**Đề xuất cải thiện:**
- ✅ Nên có validation: `endDate > startDate`
- ✅ Nên có index trên `startDate` và `endDate` để query nhanh
- ✅ Nên có field `isActive` để dễ filter

### 13. **Message Model** (`message.model.js`)
**Đề xuất cải thiện:**
- ✅ Nên có index trên `conversation` và `createdAt` để query nhanh
- ✅ Nên có index trên `isRead` để filter tin nhắn chưa đọc

---

## 💡 Đề Xuất Cải Thiện Tổng Thể

### 1. **Tạo Address Model riêng**
```javascript
const addressSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });
```

### 2. **Thêm Indexes cho Performance**
- Product: `category`, `status`, `isFeatured`, `createdAt`
- Payment: `userId`, `status`, `createdAt`
- Cart: `userId`
- Message: `conversation`, `createdAt`, `isRead`

### 3. **Chuẩn hóa Naming Convention**
- Tất cả model names nên lowercase: `user`, `product`, `payment` (đã đúng)
- Tất cả references phải khớp với model names

### 4. **Thêm Validation Middleware**
- Validate `colorName` và `size` có tồn tại trong Product trước khi thêm vào Cart
- Validate stock đủ trước khi checkout

### 5. **Thêm Virtual Fields**
- Product: `finalPrice` (price - discount)
- Payment: `totalItems` (tổng số sản phẩm)

---

## ✅ Những Điểm Tốt

1. ✅ Sử dụng `timestamps: true` ở hầu hết models
2. ✅ Sử dụng `ref` để tạo relationships
3. ✅ Có enum cho các trường có giá trị cố định
4. ✅ Có default values cho các trường optional

---

## 📝 Tóm Tắt Ưu Tiên Sửa

**Ưu tiên cao (ảnh hưởng logic):**
1. Sửa `colorId`/`sizeId` → `colorName`/`size` trong Cart và Payment
2. Sửa `userId` từ String → ObjectId trong Cart, Payment, PreviewProduct, APIKey
3. Sửa reference `Order` → `payment` trong Warranty
4. Sửa reference `User` → `user` trong MessageChatbot
5. Sửa `productRelated`, `previewProduct` từ Object → Array trong Product

**Ưu tiên trung bình (cải thiện):**
6. Thêm unique constraints (Favourite, PreviewProduct)
7. Thêm TTL index cho OTP
8. Thêm validation cho rating, dates
9. Thêm indexes cho performance

**Ưu tiên thấp (tối ưu):**
10. Tách Address model
11. Thêm virtual fields
12. Thêm validation middleware

---

## 🎯 Kết Luận

Schema hiện tại có **nhiều vấn đề nghiêm trọng** về:
- Kiểu dữ liệu không nhất quán (String vs ObjectId)
- Reference không khớp (Order vs payment, User vs user)
- Kiến trúc không hợp lý (colorId/sizeId vs nested arrays)
- Thiếu validation và constraints quan trọng

**Khuyến nghị:** Nên sửa các vấn đề ưu tiên cao trước khi deploy production.


