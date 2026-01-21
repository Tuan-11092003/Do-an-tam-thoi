# 📖 Hướng Dẫn Chi Tiết Từ A-Z - Dự Án Bán Giày

## 🎯 Mục Tiêu
Hướng dẫn này sẽ giúp bạn hiểu **toàn bộ** dự án từ cơ bản đến nâng cao, theo thứ tự logic và dễ hiểu nhất.

---

## 📚 PHẦN 1: CHUẨN BỊ VÀ TỔNG QUAN (Bắt đầu từ đây!)

### BƯỚC 1.1: Hiểu Dự Án Là Gì? (5 phút)

**Dự án này là gì?**
- Hệ thống **E-commerce bán giày** (thương mại điện tử)
- **Full-Stack**: Backend (Node.js) + Frontend (React)
- Có đầy đủ tính năng: đăng nhập, sản phẩm, giỏ hàng, thanh toán, admin, chat, v.v.

**Công nghệ sử dụng:**
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Frontend**: React + Vite + TailwindCSS + Ant Design
- **Real-time**: Socket.io (chat, thông báo)
- **Payment**: VNPay, MoMo, ZaloPay
- **AI**: Groq SDK (Chatbot)

**📝 Hành động:** Đọc file `HUONG_DAN_TONG_QUAN.md` (đã có sẵn) để có cái nhìn tổng quan.

---

### BƯỚC 1.2: Khám Phá Cấu Trúc Thư Mục (10 phút)

**Mở terminal và chạy lệnh:**
```bash
cd my-app
tree /F  # Windows
# hoặc
ls -R   # Linux/Mac
```

**Cấu trúc chính:**
```
my-app/
├── server/              # Backend (Node.js/Express)
│   └── src/
│       ├── server.js            # ⭐ Entry point - ĐỌC ĐẦU TIÊN
│       ├── config/              # Cấu hình (DB, v.v.)
│       │   └── connectDB.js
│       ├── models/              # Database schemas
│       │   ├── users.model.js
│       │   ├── product.model.js
│       │   ├── cart.model.js
│       │   ├── payment.model.js
│       │   ├── category.model.js
│       │   ├── counpon.model.js
│       │   ├── flashSale.model.js
│       │   ├── warranty.model.js
│       │   ├── conversation.model.js
│       │   ├── message.model.js
│       │   ├── messageChatbot.model.js
│       │   ├── news.model.js
│       │   ├── favourite.model.js
│       │   ├── previewProduct.model.js
│       │   ├── otp.model.js
│       │   └── apiKey.model.js
│       ├── routes/              # API routes
│       │   ├── index.routes.js      # Route chính
│       │   ├── users.routes.js
│       │   ├── product.routes.js
│       │   ├── cart.routes.js
│       │   ├── payment.routes.js
│       │   └── admin/               # Admin routes
│       │       ├── dashboard.admin.routes.js
│       │       ├── users.admin.routes.js
│       │       ├── products.admin.routes.js
│       │       └── ... (các routes admin khác)
│       ├── controller/          # Business logic
│       │   ├── user.controller.js
│       │   ├── product.controller.js
│       │   ├── cart.controller.js
│       │   └── admin/               # Admin controllers
│       │       ├── dashboard.admin.controller.js
│       │       └── ... (các controllers admin khác)
│       ├── services/            # Service layer
│       │   ├── users.service.js
│       │   ├── product.service.js
│       │   ├── payment.service.js
│       │   └── payment/             # Payment services
│       │       ├── vnpayPayment.service.js
│       │       ├── momoPayment.service.js
│       │       ├── zalopayPayment.service.js
│       │       └── payment.helpers.js
│       ├── core/                # Error handling & responses
│       │   ├── error.response.js
│       │   ├── success.response.js
│       │   ├── statusCodes.js
│       │   └── reasonPhrases.js
│       ├── auth/                # Authentication
│       │   └── checkAuth.js
│       ├── utils/               # Utilities
│       │   ├── jwt.js
│       │   ├── chatbot.js
│       │   ├── socket.service.js
│       │   ├── sendMailForgotPassword.js
│       │   └── sendMailAcceptExchange.js
│       ├── socket.js            # Socket.io
│       └── uploads/             # File uploads
│           ├── avatars/
│           ├── products/
│           ├── warranty/
│           └── news/
│
├── client/              # Frontend (React)
│   └── src/
│       ├── main.jsx             # ⭐ Entry point - ĐỌC ĐẦU TIÊN
│       ├── App.jsx              # Homepage
│       ├── routes/              # React Router
│       │   └── index.jsx
│       ├── pages/               # Các trang (theo feature)
│       │   ├── auth/                # Authentication
│       │   │   ├── LoginPage.jsx
│       │   │   ├── RegisterPage.jsx
│       │   │   └── ForgotPasswordPage.jsx
│       │   ├── product/             # Sản phẩm
│       │   │   ├── ProductListPage.jsx
│       │   │   └── ProductDetailPage.jsx
│       │   ├── cart/                # Giỏ hàng
│       │   │   ├── CartPage.jsx
│       │   │   └── CheckoutPage.jsx
│       │   ├── payment/             # Thanh toán
│       │   │   └── PaymentSuccessPage.jsx
│       │   ├── InfoUser/            # Thông tin user
│       │   │   ├── index.jsx
│       │   │   └── components/
│       │   │       ├── PersonalInfo.jsx
│       │   │       ├── OrderHistory.jsx
│       │   │       ├── Favourite.jsx
│       │   │       ├── Warranty.jsx
│       │   │       └── UserSidebar.jsx
│       │   ├── news/                # Tin tức
│       │   │   └── DetailNewsPage.jsx
│       │   └── admin/               # Admin panel
│       │       ├── index.jsx
│       │       └── components/
│       │           ├── Dashboard.jsx
│       │           ├── ProductAdmin.jsx
│       │           ├── UserAdmin.jsx
│       │           ├── OrderAdmin.jsx
│       │           ├── CategoryAdmin.jsx
│       │           ├── CouponManager.jsx
│       │           ├── FlashSaleManagement.jsx
│       │           ├── NewsAdmin.jsx
│       │           ├── WarrantyAdmin.jsx
│       │           ├── MessageManager.jsx
│       │           └── SidebarAdmin.jsx
│       ├── components/          # Components tái sử dụng
│       │   ├── layout/              # Layout components
│       │   │   ├── Header.jsx
│       │   │   ├── Footer.jsx
│       │   │   └── ScrollToTop.jsx
│       │   ├── banner/              # Banner
│       │   │   └── Banner.jsx
│       │   ├── product/             # Product components
│       │   │   ├── CardBody.jsx
│       │   │   └── ProductQuickAddModal.jsx
│       │   ├── category/            # Category
│       │   │   └── CategoryList.jsx
│       │   ├── flashsale/           # Flash sale
│       │   │   └── FlashSale.jsx
│       │   ├── coupon/              # Coupon
│       │   │   └── Coupon.jsx
│       │   ├── chat/                # Chat
│       │   │   ├── ChatBot.jsx
│       │   │   └── ModalChat.jsx
│       │   └── news/                # News
│       │       └── NewsHome.jsx
│       ├── services/            # API services
│       │   ├── api/                 # Base API config
│       │   │   ├── axiosClient.js
│       │   │   └── request.js
│       │   ├── user/
│       │   │   └── userService.js
│       │   ├── product/
│       │   │   └── productService.js
│       │   ├── cart/
│       │   │   └── cartService.js
│       │   ├── payment/
│       │   │   └── paymentService.js
│       │   ├── category/
│       │   │   └── categoryService.js
│       │   ├── coupon/
│       │   │   └── couponService.js
│       │   ├── flashSale/
│       │   │   └── flashSaleService.js
│       │   ├── favourite/
│       │   │   └── favouriteService.js
│       │   ├── warranty/
│       │   │   └── warrantyService.js
│       │   ├── news/
│       │   │   └── newsService.js
│       │   ├── message/
│       │   │   └── messageService.js
│       │   └── previewProduct/
│       │       └── previewProductService.js
│       ├── store/               # State management
│       │   ├── Context.jsx
│       │   └── Provider.jsx
│       ├── hooks/               # Custom hooks
│       │   ├── useStore.jsx
│       │   ├── useAdminRoute.js
│       │   └── useDebounce.jsx
│       └── utils/               # Utility functions
│           ├── formatPrice.js
│           ├── formatDate.js
│           └── validation.js
│
└── database/            # Sample data (JSON)
    ├── shoe.categories.json
    └── shoe.products.json
```

**📝 Hành động:** Mở từng thư mục và xem có những file gì. Đừng đọc code, chỉ xem tên file để hiểu cấu trúc.

---

## 📚 PHẦN 2: HIỂU BACKEND - NỀN TẢNG CỦA HỆ THỐNG

### BƯỚC 2.1: Đọc Entry Point - server.js (15 phút) ⭐ QUAN TRỌNG NHẤT

**File:** `server/src/server.js`

**Tại sao đọc đầu tiên?**
- Đây là nơi server được khởi động
- Hiểu cách Express được cấu hình
- Hiểu middleware, CORS, routes được setup như thế nào

**Những gì cần hiểu:**
1. **Express app được tạo như thế nào?**
   - `const express = require('express')` và `const app = express()`

2. **Database connection:**
   - `const connectDB = require('./config/connectDB')`
   - `connectDB()` - Kết nối MongoDB

3. **Middleware:**
   - `express.json()`, `express.urlencoded()`, `cookieParser()`
   - CORS configuration (cho phép frontend gọi API)

4. **Routes:**
   - `routes(app)` - Đăng ký tất cả routes

5. **Socket.io:**
   - Tạo HTTP server từ Express app
   - `initSocket(server)` - Khởi tạo Socket.io

6. **Error handling:**
   - Middleware xử lý lỗi với `core/error.response.js`

7. **Server start:**
   - `startServer(port)` - Khởi động server trên port 3000

**📝 Hành động:** 
- Mở file `server/src/server.js`
- Đọc từng dòng và hiểu từng phần
- Ghi chú lại những gì chưa hiểu để hỏi sau

---

### BƯỚC 2.2: Hiểu Core Module - Error Handling (10 phút)

**Thư mục:** `server/src/core/`

**Tại sao quan trọng?**
- Xử lý lỗi thống nhất trong toàn bộ ứng dụng
- Response format chuẩn

**Các files:**
- `error.response.js` - Các class error (BadRequestError, NotFoundError, v.v.)
- `success.response.js` - Các class success response
- `statusCodes.js` - HTTP status codes
- `reasonPhrases.js` - HTTP reason phrases

**📝 Hành động:** Đọc file `error.response.js` để hiểu cách error được xử lý

---

### BƯỚC 2.3: Hiểu Routes - Cổng Vào Của API (20 phút)

**File:** `server/src/routes/index.routes.js`

**Tại sao đọc tiếp theo?**
- Hiểu tất cả API endpoints có trong hệ thống
- Biết route nào dành cho client, route nào dành cho admin

**Cấu trúc routes:**
```
Client Routes (người dùng thường):
- /api/users          → Quản lý user (đăng nhập, đăng ký, profile)
- /api/category       → Danh mục sản phẩm
- /api/product        → Sản phẩm
- /api/cart           → Giỏ hàng
- /api/coupon         → Mã giảm giá
- /api/payment        → Thanh toán
- /api/warranty       → Bảo hành
- /api/message        → Tin nhắn
- /api/conversation   → Cuộc trò chuyện
- /api/flashSale      → Flash sale
- /api/previewProduct → Preview sản phẩm
- /api/favourite      → Yêu thích
- /api/news           → Tin tức/blog

Admin Routes (quản trị viên) - Thư mục: routes/admin/
- /api/admin/dashboard      → Dashboard admin
- /api/admin/users          → Quản lý users
- /api/admin/products       → Quản lý sản phẩm
- /api/admin/categories     → Quản lý danh mục
- /api/admin/coupons        → Quản lý mã giảm giá
- /api/admin/orders         → Quản lý đơn hàng
- /api/admin/warranty       → Quản lý bảo hành
- /api/admin/flashSale      → Quản lý flash sale
- /api/admin/news           → Quản lý tin tức
- /api/admin/conversations  → Quản lý cuộc trò chuyện
```

**📝 Hành động:**
1. Mở file `server/src/routes/index.routes.js`
2. Xem các routes được import từ đâu
3. Mở một vài file routes con để xem cấu trúc (VD: `server/src/routes/users.routes.js`)

**Ví dụ:** Mở `server/src/routes/users.routes.js` để xem:
- Route nào là GET, POST, PUT, DELETE?
- Route nào cần authentication (middleware `checkAuth`)?

---

### BƯỚC 2.4: Hiểu Database Schema - Cấu Trúc Dữ Liệu (30 phút)

**Tại sao quan trọng?**
- Database là nơi lưu trữ tất cả dữ liệu
- Hiểu schema giúp hiểu cách dữ liệu được tổ chức
- Giúp hiểu mối quan hệ giữa các entities

**Thứ tự đọc models (theo mức độ quan trọng):**

#### 1. User Model (QUAN TRỌNG NHẤT)
**File:** `server/src/models/users.model.js`

**Những gì cần hiểu:**
- Các trường: `email`, `password`, `fullName`, `phone`, `address`, `role`, `avatar`
- `role`: `user` hoặc `admin` - phân quyền
- `password`: được hash bằng bcrypt (không lưu plain text)

**📝 Hành động:** Đọc file này và hiểu cấu trúc user

---

#### 2. Product Model (CORE BUSINESS)
**File:** `server/src/models/product.model.js`

**Những gì cần hiểu:**
- Các trường: `name`, `description`, `price`, `discount`, `images`, `category`
- `variants`: Mảng các biến thể (size, color, quantity)
- `colors`: Mảng các màu sắc
- `status`: Trạng thái sản phẩm (active, inactive)
- `isFeatured`: Sản phẩm nổi bật

**📝 Hành động:** Đọc file này và hiểu cách sản phẩm được lưu trữ

---

#### 3. Cart Model (E-COMMERCE FLOW)
**File:** `server/src/models/cart.model.js`

**Những gì cần hiểu:**
- `userId`: User sở hữu giỏ hàng
- `products`: Mảng các sản phẩm trong giỏ
- Mỗi product có: `productId`, `colorId`, `sizeId`, `quantity`
- `isSelected`: Sản phẩm được chọn để thanh toán

**📝 Hành động:** Đọc file này và hiểu cách giỏ hàng hoạt động

---

#### 4. Payment Model (ORDER)
**File:** `server/src/models/payment.model.js`

**Những gì cần hiểu:**
- `userId`: User đặt hàng
- `products`: Danh sách sản phẩm đã mua
- `totalPrice`, `finalPrice`: Tổng tiền
- `status`: Trạng thái đơn hàng (pending, completed, cancelled)
- `paymentMethod`: Phương thức thanh toán (VNPay, MoMo, ZaloPay, COD)

**📝 Hành động:** Đọc file này và hiểu cách đơn hàng được lưu

---

#### 5. Các Models Khác (Đọc sau)
- `category.model.js` - Danh mục
- `counpon.model.js` - Mã giảm giá
- `flashSale.model.js` - Flash sale
- `warranty.model.js` - Bảo hành
- `conversation.model.js` & `message.model.js` - Chat
- `messageChatbot.model.js` - Chat với AI
- `news.model.js` - Tin tức
- `favourite.model.js` - Sản phẩm yêu thích
- `previewProduct.model.js` - Preview sản phẩm
- `otp.model.js` - OTP cho xác thực
- `apiKey.model.js` - API Keys

**📝 Hành động:** Đọc file `SCHEMA_REVIEW.md` để xem đánh giá về các schema (có thể có vấn đề cần sửa)

---

### BƯỚC 2.5: Trace Một Flow Hoàn Chỉnh - Ví Dụ: "Đăng Nhập" (30 phút)

**Mục tiêu:** Hiểu cách một request đi từ frontend → backend → database → response

**Flow "Đăng Nhập":**

#### Bước 1: Frontend gửi request
**File:** `client/src/pages/auth/LoginPage.jsx`
- User nhập email/password
- Gọi API login

**File:** `client/src/services/user/userService.js`
- Tìm function `login()` hoặc tương tự
- Xem URL API được gọi: `/api/users/login`

---

#### Bước 2: Backend nhận request
**File:** `server/src/routes/users.routes.js`
- Tìm route `POST /login`
- Xem controller nào được gọi: `userController.login`

---

#### Bước 3: Controller xử lý logic
**File:** `server/src/controller/user.controller.js`
- Tìm function `login()`
- Xem logic:
  1. Lấy email/password từ request
  2. Tìm user trong database
  3. So sánh password (bcrypt)
  4. Tạo JWT token
  5. Trả về token cho client

---

#### Bước 4: Service layer (nếu có)
**File:** `server/src/services/users.service.js`
- Có thể có logic phức tạp hơn
- Database operations

---

#### Bước 5: Database
**File:** `server/src/models/users.model.js`
- Schema được sử dụng để query

---

#### Bước 6: Response
- Controller trả về JSON với token
- Frontend nhận token và lưu vào localStorage/cookie
- Redirect đến trang chủ

**📝 Hành động:**
1. Mở từng file trên và trace flow
2. Đọc code từng bước
3. Ghi chú lại flow để hiểu rõ

**Làm tương tự cho các flows khác:**
- Flow "Thêm sản phẩm vào giỏ hàng"
- Flow "Thanh toán"
- Flow "Xem chi tiết sản phẩm"

**📄 Xem chi tiết:** `FLOW_DANG_NHAP_CHI_TIET.md` và `FLOW_DANG_KY_CHI_TIET.md`

---

## 📚 PHẦN 3: HIỂU FRONTEND - GIAO DIỆN NGƯỜI DÙNG

### BƯỚC 3.1: Đọc Entry Point - main.jsx (10 phút)

**File:** `client/src/main.jsx`

**Tại sao đọc đầu tiên?**
- Đây là nơi React app được khởi động
- Hiểu cách routing được setup
- Hiểu state management (Context API)

**Những gì cần hiểu:**
1. **React app render:**
   - `createRoot().render()`
   - Component gốc: `Provider` (state management)

2. **Router:**
   - `BrowserRouter` từ react-router-dom
   - Routes được map từ `routes` array

3. **Provider:**
   - `<Provider>` - Context API cho global state

**📝 Hành động:** Đọc file này và hiểu cấu trúc cơ bản

---

### BƯỚC 3.2: Hiểu Routes - Navigation (15 phút)

**File:** `client/src/routes/index.jsx`

**Tại sao quan trọng?**
- Hiểu tất cả các trang trong app
- Biết route nào dẫn đến trang nào

**Các routes chính:**
```
/                       → Homepage (App.jsx)
/login                  → Đăng nhập (auth/LoginPage.jsx)
/register               → Đăng ký (auth/RegisterPage.jsx)
/forgot-password        → Quên mật khẩu (auth/ForgotPasswordPage.jsx)
/product/:id            → Chi tiết sản phẩm (product/ProductDetailPage.jsx)
/products               → Danh sách sản phẩm (product/ProductListPage.jsx)
/cart                   → Giỏ hàng (cart/CartPage.jsx)
/checkout               → Thanh toán (cart/CheckoutPage.jsx)
/payment/success/:id    → Thanh toán thành công (payment/PaymentSuccessPage.jsx)
/profile                → Thông tin user (InfoUser/index.jsx)
/news/:id               → Chi tiết tin tức (news/DetailNewsPage.jsx)
/admin/*                → Admin panel (admin/index.jsx + components)
```

**📝 Hành động:**
1. Mở file `client/src/routes/index.jsx`
2. Xem tất cả routes
3. Mở một vài page components để xem cấu trúc

---

### BƯỚC 3.3: Hiểu State Management - Context API (20 phút)

**Files:**
- `client/src/store/Provider.jsx`
- `client/src/store/Context.jsx`

**Tại sao quan trọng?**
- Hiểu cách global state được quản lý
- Hiểu user info, cart, v.v. được lưu ở đâu

**📝 Hành động:**
1. Đọc 2 files trên
2. Xem các state được quản lý:
   - User info
   - Cart
   - Authentication status
   - v.v.

**📄 Xem chi tiết:** `STATE_MANAGEMENT_CONTEXT_API_CHI_TIET.md`

---

### BƯỚC 3.4: Hiểu API Services (15 phút)

**Thư mục:** `client/src/services/`

**Cấu trúc mới:**
```
services/
├── api/                # Base configuration
│   ├── axiosClient.js  # Axios instance với interceptors
│   └── request.js      # Request utilities
├── user/
│   └── userService.js  # User API (login, register, profile)
├── product/
│   └── productService.js
├── cart/
│   └── cartService.js
├── payment/
│   └── paymentService.js
├── category/
│   └── categoryService.js
├── coupon/
│   └── couponService.js
├── flashSale/
│   └── flashSaleService.js
├── favourite/
│   └── favouriteService.js
├── warranty/
│   └── warrantyService.js
├── news/
│   └── newsService.js
├── message/
│   └── messageService.js
└── previewProduct/
    └── previewProductService.js
```

**Tại sao quan trọng?**
- Hiểu cách API calls được tổ chức theo feature
- Hiểu base URL, interceptors (thêm token vào header, v.v.)

**📝 Hành động:**
1. Đọc `services/api/axiosClient.js` - Cấu hình base
2. Đọc một vài service files để xem cách gọi API

**📄 Xem chi tiết:** `API_CONFIGURATION_CHI_TIET.md`

---

### BƯỚC 3.5: Hiểu Components Structure (30 phút)

**Thư mục:** `client/src/components/`

**Cấu trúc mới (theo feature):**
```
components/
├── layout/             # Layout components
│   ├── Header.jsx      # Header/Navigation
│   ├── Footer.jsx      # Footer
│   └── ScrollToTop.jsx # Scroll to top utility
├── banner/
│   └── Banner.jsx      # Banner trang chủ
├── product/
│   ├── CardBody.jsx    # Card hiển thị sản phẩm
│   └── ProductQuickAddModal.jsx  # Quick add modal
├── category/
│   └── CategoryList.jsx # Danh sách danh mục
├── flashsale/
│   └── FlashSale.jsx   # Flash sale section
├── coupon/
│   └── Coupon.jsx      # Mã giảm giá
├── chat/
│   ├── ChatBot.jsx     # AI Chatbot
│   └── ModalChat.jsx   # Modal chat với admin
└── news/
    └── NewsHome.jsx    # Tin tức trang chủ
```

**📝 Hành động:**
1. Mở từng component và xem cấu trúc
2. Hiểu props được truyền vào
3. Xem component nào được dùng ở đâu

---

### BƯỚC 3.6: Hiểu Pages Structure (45 phút)

**Thư mục:** `client/src/pages/`

**Cấu trúc mới (theo feature):**

#### 1. Auth Pages (`pages/auth/`)
- `LoginPage.jsx` - Đăng nhập
- `RegisterPage.jsx` - Đăng ký
- `ForgotPasswordPage.jsx` - Quên mật khẩu

#### 2. Product Pages (`pages/product/`)
- `ProductListPage.jsx` - Danh sách sản phẩm (filter, search)
- `ProductDetailPage.jsx` - Chi tiết sản phẩm

#### 3. Cart Pages (`pages/cart/`)
- `CartPage.jsx` - Giỏ hàng
- `CheckoutPage.jsx` - Thanh toán

#### 4. Payment Pages (`pages/payment/`)
- `PaymentSuccessPage.jsx` - Thanh toán thành công

#### 5. User Info Pages (`pages/InfoUser/`)
- `index.jsx` - Layout chính
- `components/PersonalInfo.jsx` - Thông tin cá nhân
- `components/OrderHistory.jsx` - Lịch sử đơn hàng
- `components/Favourite.jsx` - Sản phẩm yêu thích
- `components/Warranty.jsx` - Bảo hành
- `components/UserSidebar.jsx` - Sidebar menu

#### 6. News Pages (`pages/news/`)
- `DetailNewsPage.jsx` - Chi tiết tin tức

#### 7. Admin Pages (`pages/admin/`)
- `index.jsx` - Admin layout chính
- `components/Dashboard.jsx` - Dashboard thống kê
- `components/ProductAdmin.jsx` - Quản lý sản phẩm
- `components/UserAdmin.jsx` - Quản lý users
- `components/OrderAdmin.jsx` - Quản lý đơn hàng
- `components/CategoryAdmin.jsx` - Quản lý danh mục
- `components/CouponManager.jsx` - Quản lý mã giảm giá
- `components/FlashSaleManagement.jsx` - Quản lý flash sale
- `components/NewsAdmin.jsx` - Quản lý tin tức
- `components/WarrantyAdmin.jsx` - Quản lý bảo hành
- `components/MessageManager.jsx` - Quản lý tin nhắn
- `components/SidebarAdmin.jsx` - Sidebar admin

**📝 Hành động:**
1. Đọc từng page và hiểu chức năng
2. Trace flow: User click button → API call → Update UI
3. Xem cách state được sử dụng

---

### BƯỚC 3.7: Hiểu Hooks & Utils (10 phút)

**Hooks:** `client/src/hooks/`
- `useStore.jsx` - Hook để truy cập Context store
- `useAdminRoute.js` - Hook kiểm tra quyền admin
- `useDebounce.jsx` - Hook debounce cho search

**Utils:** `client/src/utils/`
- `formatPrice.js` - Format giá tiền (VND)
- `formatDate.js` - Format ngày tháng
- `validation.js` - Validate input

**📝 Hành động:** Đọc các files này để hiểu các utility functions

---

## 📚 PHẦN 4: HIỂU CÁC TÍNH NĂNG NÂNG CAO

### BƯỚC 4.1: Authentication & Authorization (30 phút)

**Backend:**
- `server/src/auth/checkAuth.js` - JWT middleware
- `server/src/utils/jwt.js` - JWT utilities
- `server/src/controller/user.controller.js` - Login/Register logic
- `server/src/models/otp.model.js` - OTP model cho forgot password

**Frontend:**
- `client/src/pages/auth/LoginPage.jsx` - Login page
- `client/src/pages/auth/RegisterPage.jsx` - Register page
- `client/src/pages/auth/ForgotPasswordPage.jsx` - Forgot password
- `client/src/hooks/useAdminRoute.js` - Admin route protection

**📝 Hành động:**
1. Đọc các files trên
2. Hiểu flow:
   - User đăng nhập → Backend tạo JWT → Frontend lưu token
   - Mỗi request → Frontend gửi token trong header → Backend verify token
3. Test flow đăng nhập trong app

---

### BƯỚC 4.2: Real-time Features - Socket.io (30 phút)

**Backend:**
- `server/src/socket.js` - Socket.io setup
- `server/src/utils/socket.service.js` - Socket utilities

**Frontend:**
- `client/src/components/chat/ChatBot.jsx` - Chatbot component
- `client/src/components/chat/ModalChat.jsx` - Chat modal

**📝 Hành động:**
1. Đọc các files trên
2. Hiểu cách Socket.io hoạt động:
   - Client connect → Server nhận connection
   - Client emit event → Server listen và xử lý
   - Server emit event → Client listen và update UI

---

### BƯỚC 4.3: AI Chatbot (20 phút)

**File:** `server/src/utils/chatbot.js`

**Tại sao quan trọng?**
- Sử dụng Groq SDK để tạo AI chatbot
- Hiểu cách AI được tích hợp

**📝 Hành động:**
1. Đọc file `chatbot.js`
2. Hiểu cách message được gửi đến AI
3. Xem response được xử lý như thế nào

---

### BƯỚC 4.4: Payment Integration - Multiple Payment Methods (30 phút)

**Backend:**
- `server/src/controller/payment.controller.js` - Payment logic
- `server/src/services/payment.service.js` - Payment service chính
- `server/src/services/payment/` - Payment services riêng cho từng phương thức:
  - `vnpayPayment.service.js` - VNPay
  - `momoPayment.service.js` - MoMo
  - `zalopayPayment.service.js` - ZaloPay
  - `payment.helpers.js` - Helper functions
  - `payment.utils.js` - Utility functions

**Frontend:**
- `client/src/pages/cart/CheckoutPage.jsx` - Checkout page
- `client/src/pages/payment/PaymentSuccessPage.jsx` - Payment success page
- `client/src/services/payment/paymentService.js` - Payment API calls

**📝 Hành động:**
1. Đọc các files trên
2. Hiểu flow thanh toán:
   - User checkout → Chọn payment method → Tạo payment URL
   - Redirect đến payment gateway (VNPay/MoMo/ZaloPay)
   - Payment callback → Verify payment → Update order status

---

### BƯỚC 4.5: Admin Panel (45 phút)

**Backend:**
- `server/src/routes/admin/` - Admin routes (10 files)
- `server/src/controller/admin/` - Admin controllers (10 files)

**Frontend:**
- `client/src/pages/admin/index.jsx` - Admin layout
- `client/src/pages/admin/components/` - Admin components:
  - `Dashboard.jsx` - Thống kê tổng quan
  - `ProductAdmin.jsx` - Quản lý sản phẩm (CRUD)
  - `UserAdmin.jsx` - Quản lý users
  - `OrderAdmin.jsx` - Quản lý đơn hàng
  - `CategoryAdmin.jsx` - Quản lý danh mục
  - `CouponManager.jsx` - Quản lý mã giảm giá
  - `FlashSaleManagement.jsx` - Quản lý flash sale
  - `NewsAdmin.jsx` - Quản lý tin tức
  - `WarrantyAdmin.jsx` - Quản lý bảo hành
  - `MessageManager.jsx` - Quản lý tin nhắn
  - `SidebarAdmin.jsx` - Sidebar navigation
  - `AdminRedirect.jsx` - Redirect component

**📝 Hành động:**
1. Đọc các files admin
2. Hiểu cách admin được phân quyền
3. Xem các tính năng quản lý

---

## 📚 PHẦN 5: THỰC HÀNH VÀ KIỂM TRA

### BƯỚC 5.1: Setup Môi Trường (30 phút)

**Yêu cầu:**
1. **Node.js** (v18+)
2. **MongoDB** (local hoặc MongoDB Atlas)
3. **Git**

**Các bước:**

1. **Clone/Download project:**
   ```bash
   cd my-app
   ```

2. **Cài đặt dependencies:**
   ```bash
   # Root
   npm install
   
   # Server
   cd server
   npm install
   
   # Client
   cd ../client
   npm install
   ```

3. **Tạo file `.env` cho server:**
   ```bash
   cd server
   # Tạo file .env với nội dung:
   ```
   ```
   MONGODB_URI=mongodb://localhost:27017/shoe-shop
   JWT_SECRET=your-secret-key
   URL_CLIENT=http://localhost:5173
   
   # VNPay config
   VNPAY_TMN_CODE=your-tmn-code
   VNPAY_HASH_SECRET=your-hash-secret
   
   # MoMo config (nếu có)
   MOMO_PARTNER_CODE=your-partner-code
   MOMO_ACCESS_KEY=your-access-key
   MOMO_SECRET_KEY=your-secret-key
   
   # ZaloPay config (nếu có)
   ZALOPAY_APP_ID=your-app-id
   ZALOPAY_KEY1=your-key1
   ZALOPAY_KEY2=your-key2
   
   # Email config (nếu có)
   EMAIL_USER=your-email
   EMAIL_PASS=your-password
   
   # Groq API (cho chatbot)
   GROQ_API_KEY=your-groq-key
   ```

4. **Chạy project:**
   ```bash
   # Từ root
   npm start
   # Hoặc chạy riêng:
   # Terminal 1: cd server && npm run dev
   # Terminal 2: cd client && npm run dev
   ```

5. **Kiểm tra:**
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

**📝 Hành động:** Làm theo các bước trên và đảm bảo project chạy được

---

### BƯỚC 5.2: Test Các Tính Năng (60 phút)

**Test các flow chính:**

1. **Đăng ký/Đăng nhập:**
   - Tạo tài khoản mới
   - Đăng nhập
   - Kiểm tra token được lưu

2. **Xem sản phẩm:**
   - Xem danh sách sản phẩm
   - Xem chi tiết sản phẩm
   - Filter, search

3. **Giỏ hàng:**
   - Thêm sản phẩm vào giỏ
   - Xem giỏ hàng
   - Cập nhật số lượng
   - Xóa sản phẩm

4. **Thanh toán:**
   - Checkout
   - Test payment flow (nếu có test mode)

5. **Admin:**
   - Đăng nhập admin
   - Quản lý sản phẩm
   - Quản lý đơn hàng

**📝 Hành động:** Test từng tính năng và xem code tương ứng

---

### BƯỚC 5.3: Đọc Code Có Mục Đích (Tùy chọn)

**Chọn một tính năng và đọc toàn bộ code liên quan:**

**Ví dụ: Tính năng "Thêm sản phẩm vào giỏ hàng"**

1. **Frontend:**
   - Tìm button "Thêm vào giỏ" ở đâu? (có thể trong `ProductDetailPage.jsx`)
   - Xem function nào được gọi khi click
   - Xem API call trong `services/cart/cartService.js`

2. **Backend:**
   - Route: `server/src/routes/cart.routes.js`
   - Controller: `server/src/controller/cart.controller.js`
   - Service: `server/src/services/cart.service.js`
   - Model: `server/src/models/cart.model.js`

3. **Trace flow:**
   - Frontend → API call → Backend route → Controller → Service → Database
   - Response → Frontend update UI

**📝 Hành động:** Chọn một tính năng và trace toàn bộ flow

---

## 📚 PHẦN 6: TỔNG KẾT VÀ NEXT STEPS

### Checklist Hoàn Thành

**Phần 1: Tổng quan**
- [ ] Đã đọc `HUONG_DAN_TONG_QUAN.md`
- [ ] Đã khám phá cấu trúc thư mục
- [ ] Hiểu dự án là gì và dùng công nghệ gì

**Phần 2: Backend**
- [ ] Đã đọc `server/src/server.js`
- [ ] Đã hiểu `server/src/core/` (error handling)
- [ ] Đã đọc `server/src/routes/index.routes.js`
- [ ] Đã đọc các models chính (User, Product, Cart, Payment)
- [ ] Đã trace ít nhất 1 flow hoàn chỉnh (VD: Login)

**Phần 3: Frontend**
- [ ] Đã đọc `client/src/main.jsx`
- [ ] Đã đọc `client/src/routes/index.jsx`
- [ ] Đã hiểu state management (`store/`)
- [ ] Đã hiểu API services (`services/`)
- [ ] Đã xem các components và pages chính

**Phần 4: Tính năng nâng cao**
- [ ] Đã hiểu Authentication flow
- [ ] Đã hiểu Socket.io (chat)
- [ ] Đã hiểu Payment integration (VNPay, MoMo, ZaloPay)
- [ ] Đã xem Admin panel

**Phần 5: Thực hành**
- [ ] Đã setup môi trường
- [ ] Đã chạy được project
- [ ] Đã test các tính năng cơ bản

---

### Next Steps - Bước Tiếp Theo

1. **Sửa các vấn đề trong schema:**
   - Đọc `SCHEMA_REVIEW.md`
   - Sửa các vấn đề được đề cập (cẩn thận với production data)

2. **Cải thiện code:**
   - Refactor code nếu cần
   - Thêm error handling
   - Thêm validation

3. **Thêm tính năng mới:**
   - Hiểu code hiện tại trước
   - Thêm tính năng theo pattern hiện có

4. **Tối ưu:**
   - Performance optimization
   - Security improvements
   - UI/UX improvements

---

## 🎯 KẾT LUẬN

**Bắt đầu từ đâu?**
1. **BƯỚC 1.1** → Hiểu dự án là gì
2. **BƯỚC 1.2** → Khám phá cấu trúc
3. **BƯỚC 2.1** → Đọc `server/src/server.js` ⭐
4. **BƯỚC 2.2** → Hiểu Core module (error handling)
5. **BƯỚC 2.3** → Đọc routes
6. **BƯỚC 2.4** → Đọc models
7. **BƯỚC 2.5** → Trace một flow
8. **BƯỚC 3.1-3.7** → Hiểu frontend
9. **BƯỚC 4.1-4.5** → Hiểu tính năng nâng cao
10. **BƯỚC 5.1-5.3** → Thực hành

**Lưu ý:**
- Đọc code từ trên xuống dưới
- Trace một flow cụ thể để hiểu rõ
- Sử dụng IDE features (Go to Definition, Find Usages)
- Đọc comments trong code
- Test trong app để hiểu flow thực tế

**Chúc bạn học tốt! 🚀**

---

## 📞 Khi Gặp Vấn Đề

1. **Check console errors** (browser & server)
2. **Check network tab** (API calls)
3. **Check database connection**
4. **Check environment variables**
5. **Review logs** trong server terminal
6. **Đọc lại code** và trace flow

---

*Tài liệu này được tạo để hướng dẫn chi tiết từ A-Z. Hãy đọc từng bước và thực hành!*

*Cập nhật lần cuối: 20/01/2026*
