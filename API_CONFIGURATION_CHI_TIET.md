# 🔍 API Configuration - Giải Thích Chi Tiết

**Mục tiêu:** Hiểu cách API calls được cấu hình, base URL, interceptors, và cách xử lý refresh token tự động

---

## 📊 Tổng Quan

Dự án có **2 file config** để tạo axios instance:

| File | Mục đích | Độ phức tạp |
|------|----------|-------------|
| `request.jsx` | Axios instance đơn giản | ⭐ Đơn giản |
| `axiosClient.jsx` | Axios instance với interceptors (refresh token) | ⭐⭐⭐ Phức tạp |

---

## 1. File `request.jsx` - Config Đơn Giản

**File:** `client/src/config/request.jsx`

```javascript
import axios from 'axios';

export const request = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    timeout: 100000000000,
});
```

### Giải thích:

- **`axios.create({ ... })`**: Tạo axios instance mới với config tùy chỉnh
- **`baseURL`**: URL gốc cho tất cả requests
  - Ví dụ: `baseURL = "http://localhost:3000"`
  - Khi gọi `request.post('/api/users/login')` → URL thực tế: `http://localhost:3000/api/users/login`
  - Lấy từ biến môi trường `VITE_API_URL` (file `.env`)
- **`withCredentials: true`**: Tự động gửi cookies trong mọi request
  - Cookies (token, refreshToken, logged) được gửi kèm theo
  - Cần thiết cho authentication
- **`timeout`**: Thời gian chờ tối đa (100 giây)

### Khi nào dùng `request`?

- API không cần authentication (VD: login, register, get products)
- API đơn giản, không cần xử lý refresh token

---

## 2. File `axiosClient.jsx` - Config Với Interceptors

**File:** `client/src/config/axiosClient.jsx`

### 2.1. Khởi Tạo

```javascript
export class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL || import.meta.env.VITE_API_URL || '';
        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            withCredentials: true,
        });

        this.isRefreshing = false;  // Flag để tránh refresh token nhiều lần
        this.failedQueue = [];      // Queue các request bị fail khi refresh token

        this.setupInterceptors();   // Thiết lập interceptors
    }
}
```

**Giải thích:**
- **`isRefreshing`**: Flag để biết đang refresh token hay chưa
  - Tránh gọi refresh token nhiều lần cùng lúc
- **`failedQueue`**: Mảng chứa các request bị fail (401) khi đang refresh token
  - Sau khi refresh xong, retry lại các request này

### 2.2. Request Interceptor

```javascript
this.axiosInstance.interceptors.request.use(
    (config) => config,  // Trước khi gửi request
    (error) => Promise.reject(error),  // Nếu có lỗi
);
```

**Giải thích:**
- **Request interceptor**: Chạy **trước khi** gửi request
- Hiện tại không làm gì, chỉ return `config` (có thể thêm token vào header ở đây nếu cần)
- **Ví dụ có thể thêm:**
  ```javascript
  (config) => {
      const token = Cookies.get('token');
      if (token) {
          config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
  }
  ```

### 2.3. Response Interceptor - Xử Lý 401 (Token Hết Hạn)

```javascript
this.axiosInstance.interceptors.response.use(
    (response) => response,  // Response thành công
    async (error) => {      // Response lỗi
        const originalRequest = error.config;
        
        // Nếu lỗi 401 (Unauthorized) và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Kiểm tra user đã login chưa
            if (!this.isLoggedIn()) {
                this.handleAuthFailure();
                return Promise.reject(error);
            }

            // Nếu đang refresh token → Thêm request vào queue
            if (this.isRefreshing) {
                return new Promise((resolve, reject) => {
                    this.failedQueue.push({ resolve, reject });
                })
                    .then(() => this.axiosInstance(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            // Bắt đầu refresh token
            originalRequest._retry = true;
            this.isRefreshing = true;

            try {
                await this.refreshToken();        // Gọi API refresh token
                this.processQueue(null);          // Retry các request trong queue
                return this.axiosInstance(originalRequest);  // Retry request ban đầu
            } catch (refreshError) {
                this.processQueue(refreshError);  // Reject tất cả request trong queue
                this.handleAuthFailure();         // Logout và redirect
                return Promise.reject(refreshError);
            } finally {
                this.isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);
```

**Giải thích chi tiết:**

#### Bước 1: Kiểm tra lỗi 401
- `error.response?.status === 401`: Token hết hạn hoặc không hợp lệ
- `!originalRequest._retry`: Chưa retry request này (tránh loop vô hạn)

#### Bước 2: Kiểm tra user đã login
- `this.isLoggedIn()`: Kiểm tra cookie `logged === '1'`
- Nếu chưa login → Logout và redirect về `/login`

#### Bước 3: Xử lý khi đang refresh token
- Nếu `isRefreshing === true` → Request khác đang refresh token
- Thêm request vào `failedQueue` để retry sau
- Return Promise để chờ refresh xong

#### Bước 4: Bắt đầu refresh token
- Set `originalRequest._retry = true` (đánh dấu đã retry)
- Set `isRefreshing = true` (báo cho request khác biết)
- Gọi `refreshToken()` → Gọi API `/api/users/refresh-token`
- Nếu thành công:
  - `processQueue(null)` → Retry tất cả request trong queue
  - Retry request ban đầu
- Nếu thất bại:
  - `processQueue(error)` → Reject tất cả request trong queue
  - `handleAuthFailure()` → Logout và redirect

**Ví dụ flow:**
```
1. User gọi API GET /api/users/auth (token hết hạn)
   → 401 Unauthorized
   
2. Response interceptor bắt lỗi 401
   → Gọi refreshToken()
   → GET /api/users/refresh-token (dùng refreshToken cookie)
   
3. Nếu refresh thành công:
   → Server set cookie token mới
   → Retry GET /api/users/auth (với token mới)
   → Thành công ✅
   
4. Nếu refresh thất bại:
   → Logout user
   → Redirect về /login
```

### 2.4. Các Method Hỗ Trợ

```javascript
refreshToken()        // Gọi API refresh token
processQueue(error)   // Xử lý queue các request bị fail
handleAuthFailure()   // Logout và redirect
isLoggedIn()          // Kiểm tra user đã login
logout()              // Gọi API logout
get/post/put/delete() // Wrapper cho axios methods
```

**Export instance:**
```javascript
export const apiClient = new ApiClient();
```

---

## 3. So Sánh `request` vs `apiClient`

| Khía cạnh | `request` | `apiClient` |
|-----------|-----------|-------------|
| **Interceptors** | ❌ Không có | ✅ Có (refresh token tự động) |
| **Xử lý 401** | ❌ Không | ✅ Tự động refresh token |
| **Queue requests** | ❌ Không | ✅ Có (khi đang refresh) |
| **Khi nào dùng** | API public, đơn giản | API cần auth, phức tạp |

---

## 4. Cách Sử Dụng Trong API Request Files

### 4.1. UserRequest.jsx

```javascript
import { request } from './request';        // Dùng cho API đơn giản
import { apiClient } from './axiosClient';  // Dùng cho API cần auth

// API đơn giản (không cần auth)
export const requestLogin = async (data) => {
    const res = await request.post(`${apiUser}/login`, data);
    return res.data;
};

// API cần auth (có thể cần refresh token)
export const requestAuth = async () => {
    const res = await apiClient.get(`${apiUser}/auth`);
    return res.data;
};
```

**Giải thích:**
- **`requestLogin`**: Dùng `request` vì đây là API login (chưa có token)
- **`requestAuth`**: Dùng `apiClient` vì cần token, và nếu token hết hạn sẽ tự động refresh

### 4.2. ProductRequest.jsx

```javascript
// API public (không cần auth)
export const requestGetAllProduct = async () => {
    const res = await request.get(`${apiProduct}/all`);
    return res.data;
};

// API cần auth (admin)
export const requestCreateProduct = async (data) => {
    const res = await apiClient.post(`/api/admin/products/create`, data);
    return res.data;
};
```

**Giải thích:**
- **`requestGetAllProduct`**: Dùng `request` vì ai cũng xem được (public)
- **`requestCreateProduct`**: Dùng `apiClient` vì cần admin auth, và có thể cần refresh token

### 4.3. CartRequest.jsx

```javascript
// Tất cả API đều dùng apiClient (cần auth)
export const requestAddToCart = async (data) => {
    const res = await apiClient.post(`${apiCart}/add-to-cart`, data);
    return res.data;
};
```

**Giải thích:**
- Tất cả API cart đều cần user đã login → Dùng `apiClient`
- Nếu token hết hạn → Tự động refresh → Retry request

---

## 5. Ví Dụ Flow Hoàn Chỉnh

**Scenario:** User đang xem giỏ hàng, token hết hạn

```
1. User mở trang Cart
   → Component gọi: requestGetCart()
   → apiClient.get('/api/cart/get-cart')

2. Request gửi đi với cookie token (hết hạn)
   → Server trả về: 401 Unauthorized

3. Response interceptor bắt lỗi 401
   → Kiểm tra: isLoggedIn() === true ✅
   → Kiểm tra: isRefreshing === false ✅
   → Set: isRefreshing = true
   → Gọi: refreshToken()
   → GET /api/users/refresh-token (với refreshToken cookie)

4. Server refresh thành công
   → Set cookie token mới
   → Response interceptor: processQueue(null)
   → Retry: apiClient.get('/api/cart/get-cart')

5. Request mới với token mới
   → Server trả về: 200 OK + cart data
   → Component nhận được data ✅

6. User không biết gì, chỉ thấy cart load thành công
```

---

## 6. Tóm Tắt

**API Configuration giúp:**
1. ✅ **Tập trung config**: Base URL, timeout, credentials ở một nơi
2. ✅ **Tự động xử lý auth**: Refresh token tự động khi hết hạn
3. ✅ **Tránh duplicate code**: Không cần viết lại logic refresh token ở mỗi component
4. ✅ **User experience tốt**: User không bị logout đột ngột khi token hết hạn

**Quy tắc sử dụng:**
- **Dùng `request`**: API public, login, register, get products
- **Dùng `apiClient`**: API cần auth, admin, cart, user profile

---

## 🔗 Files Liên Quan

- `client/src/config/request.jsx` - Axios instance đơn giản
- `client/src/config/axiosClient.jsx` - Axios instance với interceptors
- `client/src/config/UserRequest.jsx` - User API requests
- `client/src/config/ProductRequest.jsx` - Product API requests
- `client/src/config/CartRequest.jsx` - Cart API requests

