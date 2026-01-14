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
- **Payment**: VNPay
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
├── server/          # Backend (Node.js/Express)
│   └── src/
│       ├── server.js        # ⭐ Entry point - ĐỌC ĐẦU TIÊN
│       ├── config/          # Cấu hình (DB, v.v.)
│       ├── models/          # Database schemas
│       ├── routes/          # API routes
│       ├── controller/      # Business logic
│       ├── services/        # Service layer
│       ├── auth/            # Authentication
│       ├── utils/           # Utilities
│       └── socket.js        # Socket.io
│
├── client/          # Frontend (React)
│   └── src/
│       ├── main.jsx         # ⭐ Entry point - ĐỌC ĐẦU TIÊN
│       ├── App.jsx          # Homepage
│       ├── routes/          # React Router
│       ├── pages/           # Các trang
│       ├── components/      # Components tái sử dụng
│       ├── config/          # API clients
│       ├── store/           # State management
│       └── hooks/           # Custom hooks
│
└── database/        # Sample data (JSON)
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
   - Dòng 36-37: `const express = require('express')` và `const app = express()`

2. **Database connection:**
   - Dòng 40: `const connectDB = require('./config/connectDB')`
   - Dòng 50: `connectDB()` - Kết nối MongoDB

3. **Middleware:**
   - Dòng 52-54: `express.json()`, `express.urlencoded()`, `cookieParser()`
   - Dòng 64-82: CORS configuration (cho phép frontend gọi API)

4. **Routes:**
   - Dòng 86: `routes(app)` - Đăng ký tất cả routes

5. **Socket.io:**
   - Dòng 43-45: Tạo HTTP server từ Express app
   - Dòng 111: `initSocket(server)` - Khởi tạo Socket.io

6. **Error handling:**
   - Dòng 88-109: Middleware xử lý lỗi

7. **Server start:**
   - Dòng 184: `startServer(port)` - Khởi động server trên port 3000

**📝 Hành động:** 
- Mở file `server/src/server.js`
- Đọc từng dòng và hiểu từng phần
- Ghi chú lại những gì chưa hiểu để hỏi sau

---

### BƯỚC 2.2: Hiểu Routes - Cổng Vào Của API (20 phút)

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

Admin Routes (quản trị viên):
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

### BƯỚC 2.3: Hiểu Database Schema - Cấu Trúc Dữ Liệu (30 phút)

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
- `paymentMethod`: Phương thức thanh toán (VNPay, COD, v.v.)

**📝 Hành động:** Đọc file này và hiểu cách đơn hàng được lưu

---

#### 5. Các Models Khác (Đọc sau)
- `category.model.js` - Danh mục
- `counpon.model.js` - Mã giảm giá
- `flashSale.model.js` - Flash sale
- `warranty.model.js` - Bảo hành
- `conversation.model.js` & `message.model.js` - Chat
- `news.model.js` - Tin tức

**📝 Hành động:** Đọc file `SCHEMA_REVIEW.md` để xem đánh giá về các schema (có thể có vấn đề cần sửa)

---

### BƯỚC 2.4: Trace Một Flow Hoàn Chỉnh - Ví Dụ: "Đăng Nhập" (30 phút)

**Mục tiêu:** Hiểu cách một request đi từ frontend → backend → database → response

**Flow "Đăng Nhập":**

#### Bước 1: Frontend gửi request
**File:** `client/src/pages/LoginUser.jsx`
- User nhập email/password
- Gọi API login

**File:** `client/src/config/UserRequest.jsx`
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
   - Dòng 9-31: `createRoot().render()`
   - Component gốc: `Provider` (state management)

2. **Router:**
   - Dòng 4: `BrowserRouter` từ react-router-dom
   - Dòng 14-26: Routes được map từ `routes` array

3. **Provider:**
   - Dòng 11: `<Provider>` - Context API cho global state

**📝 Hành động:** Đọc file này và hiểu cấu trúc cơ bản

---

### BƯỚC 3.2: Hiểu Routes - Navigation (15 phút)

**File:** `client/src/routes/index.jsx`

**Tại sao quan trọng?**
- Hiểu tất cả các trang trong app
- Biết route nào dẫn đến trang nào

**Các routes chính:**
```
/                    → Homepage (App.jsx)
/login               → Đăng nhập
/register            → Đăng ký
/product/:id         → Chi tiết sản phẩm
/cart                → Giỏ hàng
/checkout            → Thanh toán
/payment/success/:id → Thanh toán thành công
/profile             → Thông tin user
/category            → Danh mục sản phẩm
/news/:id            → Chi tiết tin tức
/admin/*             → Admin panel (nhiều sub-routes)
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

---

### BƯỚC 3.4: Hiểu API Configuration (15 phút)

**File:** `client/src/config/axiosClient.jsx` hoặc `request.jsx`

**Tại sao quan trọng?**
- Hiểu cách API calls được cấu hình
- Hiểu base URL, interceptors (thêm token vào header, v.v.)

**📝 Hành động:**
1. Đọc file config
2. Xem các API request files:
   - `UserRequest.jsx` - User API
   - `ProductRequest.jsx` - Product API
   - `CartRequest.jsx` - Cart API
   - v.v.

---

### BƯỚC 3.5: Hiểu Components Structure (30 phút)

**Thư mục:** `client/src/components/`

**Các components chính:**
- `Header.jsx` - Header/Navigation
- `Footer.jsx` - Footer
- `Banner.jsx` - Banner trang chủ
- `FlashSale.jsx` - Flash sale section
- `Category.jsx` - Danh mục
- `ChatBot.jsx` - AI Chatbot
- `CardBody.jsx` - Card hiển thị sản phẩm
- `chat/ModalChat.jsx` - Modal chat

**📝 Hành động:**
1. Mở từng component và xem cấu trúc
2. Hiểu props được truyền vào
3. Xem component nào được dùng ở đâu

---

### BƯỚC 3.6: Hiểu Pages (45 phút)

**Thư mục:** `client/src/pages/`

**Các pages chính:**
- `App.jsx` - Homepage
- `LoginUser.jsx` - Đăng nhập
- `Register.jsx` - Đăng ký
- `DetailProduct.jsx` - Chi tiết sản phẩm
- `Cart.jsx` - Giỏ hàng
- `Checkout.jsx` - Thanh toán
- `InfoUser/` - Thông tin user (có sub-components)
- `admin/` - Admin panel (nhiều components)

**📝 Hành động:**
1. Đọc từng page và hiểu chức năng
2. Trace flow: User click button → API call → Update UI
3. Xem cách state được sử dụng

---

## 📚 PHẦN 4: HIỂU CÁC TÍNH NĂNG NÂNG CAO

### BƯỚC 4.1: Authentication & Authorization (30 phút)

**Backend:**
- `server/src/auth/checkAuth.js` - JWT middleware
- `server/src/utils/jwt.js` - JWT utilities
- `server/src/controller/user.controller.js` - Login/Register logic

**Frontend:**
- `client/src/pages/LoginUser.jsx` - Login page
- `client/src/pages/Register.jsx` - Register page
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
- `client/src/components/ChatBot.jsx` - Chatbot component
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

### BƯỚC 4.4: Payment Integration - VNPay (30 phút)

**Backend:**
- `server/src/controller/payment.controller.js` - Payment logic
- `server/src/services/payment.service.js` - Payment service

**Frontend:**
- `client/src/pages/Checkout.jsx` - Checkout page
- `client/src/pages/PaymentSucces.jsx` - Payment success page

**📝 Hành động:**
1. Đọc các files trên
2. Hiểu flow thanh toán:
   - User checkout → Tạo payment URL → Redirect đến VNPay
   - VNPay callback → Verify payment → Update order status

---

### BƯỚC 4.5: Admin Panel (45 phút)

**Backend:**
- `server/src/routes/admin/*` - Admin routes
- `server/src/controller/admin/*` - Admin controllers

**Frontend:**
- `client/src/pages/admin/` - Admin pages
- `client/src/pages/admin/index.jsx` - Admin layout

**Các tính năng admin:**
- Dashboard - Thống kê
- Quản lý users
- Quản lý sản phẩm
- Quản lý đơn hàng
- Quản lý mã giảm giá
- Quản lý bảo hành
- Quản lý tin tức
- v.v.

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
   # VNPay config (nếu có)
   VNPAY_TMN_CODE=your-tmn-code
   VNPAY_HASH_SECRET=your-hash-secret
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
   - Tìm button "Thêm vào giỏ" ở đâu? (có thể trong `DetailProduct.jsx`)
   - Xem function nào được gọi khi click
   - Xem API call trong `CartRequest.jsx`

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
- [ ] Đã đọc `server/src/routes/index.routes.js`
- [ ] Đã đọc các models chính (User, Product, Cart, Payment)
- [ ] Đã trace ít nhất 1 flow hoàn chỉnh (VD: Login)

**Phần 3: Frontend**
- [ ] Đã đọc `client/src/main.jsx`
- [ ] Đã đọc `client/src/routes/index.jsx`
- [ ] Đã hiểu state management
- [ ] Đã xem các components và pages chính

**Phần 4: Tính năng nâng cao**
- [ ] Đã hiểu Authentication flow
- [ ] Đã hiểu Socket.io (nếu có)
- [ ] Đã hiểu Payment integration
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
4. **BƯỚC 2.2** → Đọc routes
5. **BƯỚC 2.3** → Đọc models
6. **BƯỚC 2.4** → Trace một flow
7. **BƯỚC 3.1-3.6** → Hiểu frontend
8. **BƯỚC 4.1-4.5** → Hiểu tính năng nâng cao
9. **BƯỚC 5.1-5.3** → Thực hành

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

