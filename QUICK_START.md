# ⚡ Quick Start Guide - Bắt Đầu Nhanh

## 🎯 Bắt Đầu Từ Đâu? (5 phút)

### Bước 1: Đọc File Này Trước
- ✅ File này (`QUICK_START.md`) - Tóm tắt nhanh
- ✅ `HUONG_DAN_TONG_QUAN.md` - Tổng quan dự án
- ✅ `HUONG_DAN_CHI_TIET_A_Z.md` - Hướng dẫn chi tiết từ A-Z

### Bước 2: Đọc 5 Files Quan Trọng Nhất (30 phút)

**Theo thứ tự:**

1. **`server/src/server.js`** (15 phút)
   - Entry point backend
   - Hiểu cách server khởi động

2. **`server/src/routes/index.routes.js`** (5 phút)
   - Tất cả API endpoints
   - Hiểu cấu trúc routes

3. **`client/src/main.jsx`** (5 phút)
   - Entry point frontend
   - Hiểu cách React app khởi động

4. **`client/src/routes/index.jsx`** (5 phút)
   - Tất cả routes frontend
   - Hiểu navigation

5. **`SCHEMA_REVIEW.md`** (tùy chọn)
   - Đánh giá database schema
   - Có thể có vấn đề cần sửa

---

## 📋 Checklist Nhanh

### ✅ Hiểu Tổng Quan (1 giờ)
- [ ] Đã đọc 5 files trên
- [ ] Hiểu dự án là gì
- [ ] Hiểu cấu trúc thư mục

### ✅ Hiểu Backend (2-3 giờ)
- [ ] Đã đọc `server/src/server.js`
- [ ] Đã đọc `server/src/routes/index.routes.js`
- [ ] Đã đọc models: User, Product, Cart, Payment
- [ ] Đã trace 1 flow: Login hoặc Add to Cart

### ✅ Hiểu Frontend (2-3 giờ)
- [ ] Đã đọc `client/src/main.jsx`
- [ ] Đã đọc `client/src/routes/index.jsx`
- [ ] Đã xem `App.jsx` (Homepage)
- [ ] Đã xem 1-2 pages: Login, DetailProduct, Cart

### ✅ Setup & Test (1 giờ)
- [ ] Đã setup môi trường
- [ ] Đã chạy được project
- [ ] Đã test các tính năng cơ bản

---

## 🚀 Lệnh Chạy Project

```bash
# Từ thư mục root (my-app)
npm start

# Hoặc chạy riêng:
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev
```

**URLs:**
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

---

## 📚 Files Quan Trọng Theo Chủ Đề

### Authentication
- `server/src/auth/checkAuth.js`
- `server/src/controller/user.controller.js`
- `server/src/utils/jwt.js`
- `client/src/pages/LoginUser.jsx`

### Products
- `server/src/models/product.model.js`
- `server/src/controller/product.controller.js`
- `client/src/pages/DetailProduct.jsx`
- `client/src/config/ProductRequest.jsx`

### Cart & Checkout
- `server/src/models/cart.model.js`
- `server/src/controller/cart.controller.js`
- `client/src/pages/Cart.jsx`
- `client/src/pages/Checkout.jsx`

### Payment
- `server/src/models/payment.model.js`
- `server/src/controller/payment.controller.js`
- `client/src/pages/PaymentSucces.jsx`

### Admin
- `server/src/routes/admin/*`
- `server/src/controller/admin/*`
- `client/src/pages/admin/*`

### Real-time (Socket.io)
- `server/src/socket.js`
- `client/src/components/ChatBot.jsx`

---

## 🎯 Trace Flow - Ví Dụ

### Flow: "Thêm sản phẩm vào giỏ hàng"

1. **Frontend:** `client/src/pages/DetailProduct.jsx`
   - User click "Thêm vào giỏ"
   - Gọi function `addToCart()`

2. **API Call:** `client/src/config/CartRequest.jsx`
   - Function `addToCart(productId, colorId, sizeId, quantity)`
   - POST `/api/cart/add`

3. **Backend Route:** `server/src/routes/cart.routes.js`
   - Route: `POST /add`
   - Controller: `cartController.addToCart`

4. **Controller:** `server/src/controller/cart.controller.js`
   - Function `addToCart()`
   - Validate data
   - Gọi service

5. **Service:** `server/src/services/cart.service.js`
   - Logic xử lý
   - Tìm hoặc tạo cart
   - Thêm product vào cart

6. **Database:** `server/src/models/cart.model.js`
   - Save to MongoDB

7. **Response:** Trả về cart updated
   - Frontend update UI

**Làm tương tự cho các flows khác!**

---

## 💡 Tips

1. **Đọc code từ trên xuống dưới**
2. **Trace một flow cụ thể** để hiểu rõ
3. **Sử dụng IDE features:**
   - Go to Definition (F12)
   - Find Usages (Shift+F12)
4. **Test trong app** để hiểu flow thực tế
5. **Đọc comments** trong code

---

## 📞 Khi Gặp Vấn Đề

1. Check console errors
2. Check network tab (API calls)
3. Check database connection
4. Check environment variables (.env)
5. Review server logs

---

**Xem chi tiết tại:** `HUONG_DAN_CHI_TIET_A_Z.md`

