# Đề xuất cấu trúc thư mục Client

## 📁 Cấu trúc đề xuất

```
src/
├── 📂 assets/                    # Static files (images, icons, fonts)
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── 📂 components/                 # Reusable UI components
│   ├── 📂 common/                 # Components dùng chung (Button, Input, Modal, etc.)
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   └── Modal.jsx
│   │
│   ├── 📂 layout/                 # Layout components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── ScrollToTop.jsx
│   │
│   ├── 📂 product/               # Product-related components
│   │   ├── CardBody.jsx
│   │   ├── ProductQuickAddModal.jsx
│   │   ├── ProductList.jsx
│   │   └── ProductCard.jsx
│   │
│   ├── 📂 category/               # Category-related components
│   │   ├── CategoryList.jsx      # (đổi tên từ Category.jsx)
│   │   └── CategoryFilter.jsx
│   │
│   ├── 📂 flashsale/              # Flash sale components
│   │   └── FlashSale.jsx
│   │
│   ├── 📂 news/                   # News components
│   │   └── NewsHome.jsx
│   │
│   ├── 📂 coupon/                 # Coupon components
│   │   └── Coupon.jsx             # (sửa từ Counpon.jsx)
│   │
│   ├── 📂 chat/                   # Chat components
│   │   ├── ChatBot.jsx
│   │   └── ModalChat.jsx
│   │
│   └── 📂 banner/                 # Banner components
│       └── Banner.jsx
│
├── 📂 pages/                      # Page components (routes)
│   ├── 📂 home/
│   │   └── HomePage.jsx
│   │
│   ├── 📂 product/
│   │   ├── ProductListPage.jsx   # (đổi tên từ Category.jsx)
│   │   └── ProductDetailPage.jsx # (đổi tên từ DetailProduct.jsx)
│   │
│   ├── 📂 cart/
│   │   ├── CartPage.jsx           # (đổi tên từ Cart.jsx)
│   │   └── CheckoutPage.jsx       # (đổi tên từ Checkout.jsx)
│   │
│   ├── 📂 auth/
│   │   ├── LoginPage.jsx          # (đổi tên từ LoginUser.jsx)
│   │   ├── RegisterPage.jsx       # (đổi tên từ Register.jsx)
│   │   └── ForgotPasswordPage.jsx # (đổi tên từ ForgotPassword.jsx)
│   │
│   ├── 📂 user/
│   │   └── InfoUser/
│   │       ├── index.jsx
│   │       └── components/
│   │
│   ├── 📂 news/
│   │   └── DetailNewsPage.jsx
│   │
│   ├── 📂 payment/
│   │   └── PaymentSuccessPage.jsx # (đổi tên từ PaymentSucces.jsx)
│   │
│   └── 📂 admin/
│       ├── index.jsx
│       └── components/
│
├── 📂 services/                    # API services (tách từ config/)
│   ├── 📂 api/
│   │   ├── axiosClient.js         # Base axios config
│   │   └── request.js             # Request interceptors
│   │
│   ├── 📂 product/
│   │   └── productService.js
│   │
│   ├── 📂 cart/
│   │   └── cartService.js
│   │
│   ├── 📂 category/
│   │   └── categoryService.js
│   │
│   ├── 📂 coupon/
│   │   └── couponService.js
│   │
│   ├── 📂 user/
│   │   └── userService.js
│   │
│   ├── 📂 payment/
│   │   └── paymentService.js
│   │
│   └── 📂 ... (các service khác)
│
├── 📂 hooks/                       # Custom React hooks
│   ├── useStore.jsx
│   ├── useDebounce.jsx
│   ├── useAdminRoute.js
│   └── useAuth.js                 # (có thể thêm)
│
├── 📂 store/                      # State management
│   ├── Context.jsx
│   ├── Provider.jsx
│   └── actions/                   # (có thể thêm nếu cần)
│
├── 📂 utils/                      # Utility functions
│   ├── formatPrice.js
│   ├── formatDate.js
│   ├── validation.js
│   └── constants.js               # App constants
│
├── 📂 constants/                  # App-wide constants
│   ├── routes.js                  # Route paths
│   ├── api.js                     # API endpoints
│   └── messages.js                # Toast messages, labels
│
├── 📂 routes/                     # Route configuration
│   └── index.jsx
│
├── App.jsx                        # Root component
├── main.jsx                       # Entry point
└── App.css                        # Global styles
```

## 🔄 Các thay đổi chính

### 1. **Tổ chức lại Components**
- Nhóm theo chức năng: `product/`, `category/`, `flashsale/`, etc.
- Tách `common/` cho components dùng chung
- Tách `layout/` cho Header, Footer

### 2. **Đổi tên Pages**
- `Category.jsx` → `ProductListPage.jsx` (tránh trùng với component)
- `DetailProduct.jsx` → `ProductDetailPage.jsx`
- `Cart.jsx` → `CartPage.jsx`
- `Checkout.jsx` → `CheckoutPage.jsx`
- `LoginUser.jsx` → `LoginPage.jsx`
- `Register.jsx` → `RegisterPage.jsx`
- `ForgotPassword.jsx` → `ForgotPasswordPage.jsx`
- `PaymentSucces.jsx` → `PaymentSuccessPage.jsx` (sửa lỗi chính tả)

### 3. **Tách Services từ Config**
- Di chuyển API requests từ `config/` → `services/`
- Giữ `config/` chỉ cho configuration files
- Nhóm services theo domain

### 4. **Thêm Utils & Constants**
- `utils/` cho helper functions
- `constants/` cho constants, routes, messages

### 5. **Sửa lỗi chính tả**
- `Counpon` → `Coupon`
- `PaymentSucces` → `PaymentSuccess`

## 📋 Lợi ích

✅ **Dễ tìm kiếm**: Components được nhóm theo chức năng
✅ **Tránh nhầm lẫn**: Tên file rõ ràng, không trùng lặp
✅ **Dễ maintain**: Cấu trúc logic, dễ mở rộng
✅ **Tái sử dụng**: Utils và constants tập trung
✅ **Chuẩn hóa**: Naming convention nhất quán

## ⚠️ Lưu ý khi refactor

1. **Cập nhật imports** trong tất cả files
2. **Cập nhật routes** nếu có thay đổi tên file
3. **Test kỹ** sau khi refactor
4. **Làm từng bước** để tránh break code

