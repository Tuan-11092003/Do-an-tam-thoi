# 🔍 Trace Chi Tiết Flow "Đăng Nhập"

**Mục tiêu:** Hiểu cách một request đi từ frontend → backend → database → response

---

## 📊 Tổng Quan Flow "Đăng Nhập"

```
┌─────────────┐      HTTP POST       ┌─────────────┐      Query DB      ┌─────────────┐
│  Frontend   │ ───────────────────> │  Backend    │ ────────────────> │  Database   │
│ (React)     │                       │ (Express)   │                   │ (MongoDB)   │
│             │ <───────────────────  │             │ <────────────────  │             │
└─────────────┘      JSON Response    └─────────────┘      User Data     └─────────────┘
```

**Luồng xử lý:**
1. User nhập email/password → Submit form
2. Frontend gửi HTTP POST request đến `/api/users/login`
3. Backend Route nhận request → gọi Controller
4. Controller gọi Service để xử lý logic
5. Service query Database để tìm user
6. Service so sánh password (bcrypt) → tạo JWT token
7. Controller trả về response với token
8. Frontend nhận token → lưu vào cookie → redirect

---

## 🔍 BƯỚC 1: Frontend - User Nhập Thông Tin và Submit

### File: `client/src/pages/LoginUser.jsx`

#### 1.1. User tương tác với form

```jsx
// Dòng 19-40: Function xử lý khi submit form
const onFinish = async (values) => {
    setLoading(true);
    try {
        // values = { email: "user@example.com", password: "123456" }
        await requestLogin(values);  // ← Gọi API login
        toast.success('Đăng nhập thành công!');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        navigate('/');
    } catch (error) {
        // Xử lý lỗi...
    } finally {
        setLoading(false);
    }
};
```

**Giải thích:**
- `onFinish` được gọi khi form submit thành công (validation pass)
- `values` chứa dữ liệu từ form: `{ email: "...", password: "..." }`
- `requestLogin(values)` gọi function từ `UserRequest.jsx`

#### 1.2. Form validation (Ant Design)

```jsx
// Dòng 108-117: Validation cho email
<Form.Item
    name="email"
    rules={[
        { required: true, message: 'Vui lòng nhập email!' },
        { type: 'email', message: 'Email không hợp lệ!' },
    ]}
>
    <Input placeholder="nguyenvana@gmail.com" />
</Form.Item>

// Dòng 133-143: Validation cho password
<Form.Item
    name="password"
    rules={[
        { required: true, message: 'Vui lòng nhập mật khẩu!' },
        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
    ]}
>
    <Input.Password placeholder="••••••••••" />
</Form.Item>
```

**Giải thích:**
- Ant Design Form tự động validate trước khi gọi `onFinish`
- Nếu validation fail → không gọi `onFinish`, hiển thị error message

---

## 🌐 BƯỚC 2: Frontend - Gọi API

### File: `client/src/config/UserRequest.jsx`

#### 2.1. Function `requestLogin`

```javascript
// Dòng 6-9
export const requestLogin = async (data) => {
    const res = await request.post(`${apiUser}/login`, data);
    return res.data;
};
```

**Giải thích:**
- `apiUser = '/api/users'` (dòng 4)
- `request.post('/api/users/login', data)` gửi HTTP POST request
- `data = { email: "...", password: "..." }`

#### 2.2. Axios instance configuration

### File: `client/src/config/request.jsx`

```javascript
// Dòng 3-7
export const request = axios.create({
    baseURL: import.meta.env.VITE_API_URL,  // Ví dụ: "http://localhost:3000"
    withCredentials: true,  // Gửi cookies (quan trọng cho JWT)
    timeout: 100000000000,
});
```

**Giải thích:**
- `baseURL`: URL gốc của backend (từ `.env`)
- `withCredentials: true`: Tự động gửi cookies trong request (cần cho JWT)
- Request đầy đủ: `POST http://localhost:3000/api/users/login`

**Request được gửi:**
```http
POST http://localhost:3000/api/users/login
Content-Type: application/json
Cookie: (nếu có)

{
    "email": "user@example.com",
    "password": "123456"
}
```

---

## 🛣️ BƯỚC 3: Backend - Route Nhận Request

### File: `server/src/routes/users.routes.js`

#### 3.1. Route definition

```javascript
// Dòng 24
router.post('/login', asyncHandler(userController.login));
```

**Giải thích:**
- `router.post('/login', ...)`: Đăng ký route POST `/login`
- Route đầy đủ: `POST /api/users/login` (vì router được mount tại `/api/users`)
- `asyncHandler`: Middleware bắt lỗi async (tránh crash server)
- `userController.login`: Function xử lý request

#### 3.2. Request flow trong Express

```
HTTP Request
    ↓
Express App
    ↓
/users routes (mount tại /api/users)
    ↓
POST /login handler
    ↓
asyncHandler (bắt lỗi)
    ↓
userController.login(req, res)
```

**Request object (`req`):**
```javascript
req.body = {
    email: "user@example.com",
    password: "123456"
}
req.cookies = { ... }  // Cookies từ client
req.headers = { ... }  // HTTP headers
```

---

## 🎮 BƯỚC 4: Backend - Controller Xử Lý

### File: `server/src/controller/user.controller.js`

#### 4.1. Function `login`

```javascript
// Dòng 50-63
async login(req, res) {
    // 1. Lấy dữ liệu từ request body
    const { email, password } = req.body;
    
    // 2. Validation cơ bản
    if (!email || !password) {
        throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }
    
    // 3. Chuẩn bị data
    const data = {
        email,
        password,
    };
    
    // 4. Gọi Service để xử lý logic
    const { token, refreshToken } = await UserService.login(data);
    
    // 5. Set cookies
    setCookie(res, token, refreshToken);
    
    // 6. Trả về response
    return new OK({ 
        message: 'success', 
        metadata: { token, refreshToken } 
    }).send(res);
}
```

**Giải thích từng bước:**

**Bước 1-2: Validation**
- Kiểm tra `email` và `password` có tồn tại không
- Nếu thiếu → throw `BadRequestError` → trả về 400

**Bước 3-4: Gọi Service**
- Controller không xử lý logic phức tạp
- Chuyển logic sang Service layer (`UserService.login`)

**Bước 5: Set Cookies**
```javascript
// Dòng 5-29: Function setCookie
function setCookie(res, token, refreshToken) {
    // Cookie token (15 phút)
    res.cookie('token', token, {
        httpOnly: true,    // Không thể truy cập từ JavaScript (bảo mật)
        secure: true,      // Chỉ gửi qua HTTPS
        sameSite: 'Strict', // Chống CSRF
        maxAge: 15 * 60 * 1000, // 15 phút
    });
    
    // Cookie refreshToken (7 ngày)
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
    
    // Cookie logged (để frontend biết user đã login)
    res.cookie('logged', 1, {
        httpOnly: false,  // Có thể truy cập từ JavaScript
        secure: true,
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}
```

**Bước 6: Response**
```javascript
// OK là class success response
return new OK({ 
    message: 'success', 
    metadata: { token, refreshToken } 
}).send(res);
```

**Response được gửi:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=900
Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
Set-Cookie: logged=1; Secure; SameSite=Strict; Max-Age=604800

{
    "statusCode": 200,
    "message": "success",
    "metadata": {
        "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

---

## ⚙️ BƯỚC 5: Backend - Service Layer Xử Lý Logic

### File: `server/src/services/users.service.js`

#### 5.1. Function `login`

```javascript
// Dòng 57-75
async login(data) {
    const { email, password } = data;
    
    // 1. Tìm user trong database
    const user = await modelUser.findOne({ email });
    if (!user) {
        throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
    }
    
    // 2. Kiểm tra typeLogin
    if (user.typeLogin === 'google') {
        throw new BadRequestError('Tài khoản đăng nhập bằng google');
    }
    
    // 3. So sánh password (bcrypt)
    const checkPassword = bcrypt.compareSync(password, user.password);
    if (!checkPassword) {
        throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
    }
    
    // 4. Tạo API key (nếu chưa có)
    await createApiKey(user._id);
    
    // 5. Tạo JWT token
    const token = await createToken({ id: user._id });
    const refreshToken = await createRefreshToken({ id: user._id });
    
    // 6. Trả về tokens
    return { token, refreshToken };
}
```

**Giải thích chi tiết:**

#### 5.2. Bước 1: Query Database

```javascript
const user = await modelUser.findOne({ email });
```

**Database Query:**
```javascript
// MongoDB query tương đương:
db.users.findOne({ email: "user@example.com" })
```

**Kết quả (nếu tìm thấy):**
```javascript
{
    _id: ObjectId("..."),
    fullName: "Nguyễn Văn A",
    email: "user@example.com",
    password: "$2b$10$...",  // Password đã được hash bằng bcrypt
    isAdmin: false,
    typeLogin: "email",
    // ... các fields khác
}
```

**Nếu không tìm thấy:**
- `user = null`
- Throw error: `'Tài khoản hoặc mật khẩu không chính xác'`

#### 5.3. Bước 2: Kiểm tra typeLogin

```javascript
if (user.typeLogin === 'google') {
    throw new BadRequestError('Tài khoản đăng nhập bằng google');
}
```

**Giải thích:**
- Ngăn user đăng ký bằng Google đăng nhập bằng email/password
- Bảo mật: Tránh conflict giữa 2 phương thức đăng nhập

#### 5.4. Bước 3: So sánh Password (bcrypt)

```javascript
const checkPassword = bcrypt.compareSync(password, user.password);
```

**Giải thích:**
- `password`: Password người dùng nhập (plain text) - `"123456"`
- `user.password`: Password đã hash trong database - `"$2b$10$..."`

**Cách bcrypt hoạt động:**
```javascript
// Khi đăng ký (createUser):
const passwordHash = bcrypt.hashSync("123456", salt);
// → "$2b$10$abcdefghijklmnopqrstuvwxyz..."

// Khi đăng nhập (login):
bcrypt.compareSync("123456", "$2b$10$...")
// → true (nếu đúng) hoặc false (nếu sai)
```

**Ví dụ:**
```javascript
// Password người dùng nhập: "123456"
// Password trong DB: "$2b$10$abcdefghijklmnopqrstuvwxyz..."

bcrypt.compareSync("123456", "$2b$10$...")
// → true ✅ (password đúng)

bcrypt.compareSync("wrongpass", "$2b$10$...")
// → false ❌ (password sai)
```

**Nếu password sai:**
- Throw error: `'Tài khoản hoặc mật khẩu không chính xác'`

#### 5.5. Bước 4: Tạo API Key

```javascript
await createApiKey(user._id);
```

**File: `server/src/utils/jwt.js` (dòng 9-22):**

```javascript
const createApiKey = async (userId) => {
    // 1. Kiểm tra đã có API key chưa
    const findApiKey = await modelApiKey.findOne({ userId });
    if (findApiKey) {
        return findApiKey;  // Trả về key cũ nếu đã có
    }
    
    // 2. Tạo cặp RSA key (public/private)
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048
    });
    
    // 3. Lưu vào database
    const newApiKey = new modelApiKey({
        userId,
        publicKey: publicKeyString,
        privateKey: privateKeyString
    });
    return await newApiKey.save();
};
```

**Giải thích:**
- Mỗi user có 1 cặp RSA key (public/private)
- Private key dùng để **ký** JWT token
- Public key dùng để **verify** JWT token
- Bảo mật hơn shared secret (mỗi user có key riêng)

#### 5.6. Bước 5: Tạo JWT Token

```javascript
const token = await createToken({ id: user._id });
const refreshToken = await createRefreshToken({ id: user._id });
```

**File: `server/src/utils/jwt.js` (dòng 24-48):**

```javascript
const createToken = async (payload) => {
    // 1. Lấy private key của user
    const findApiKey = await modelApiKey.findOne({ userId: payload.id });
    if (!findApiKey?.privateKey) {
        throw new Error('Private key not found for user');
    }
    
    // 2. Ký JWT token với private key
    return jwt.sign(payload, findApiKey.privateKey, {
        algorithm: 'RS256',  // RSA với SHA-256
        expiresIn: '15m',     // Token hết hạn sau 15 phút
    });
};

const createRefreshToken = async (payload) => {
    // Tương tự nhưng expiresIn: '7d' (7 ngày)
    return jwt.sign(payload, findApiKey.privateKey, {
        algorithm: 'RS256',
        expiresIn: '7d',
    });
};
```

**JWT Token Structure:**
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODkwMTIzNDU2Nzg5MCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDA5MDAwfQ.signature
│─────────────────────────────────────────────────────────────────────────│
│                            HEADER.PAYLOAD.SIGNATURE                      │
```

**Payload (decoded):**
```json
{
    "id": "678901234567890",
    "iat": 1700000000,  // Issued at
    "exp": 1700009000   // Expires at (15 phút sau)
}
```

**Refresh Token:**
- Tương tự nhưng `exp` = 7 ngày sau
- Dùng để refresh access token khi hết hạn

---

## 🗄️ BƯỚC 6: Database - Schema và Query

### File: `server/src/models/users.model.js`

#### 6.1. User Schema

```javascript
// Dòng 5-21
const modelUser = new Schema(
    {
        fullName: { type: String, require: true },
        email: { type: String, require: true, unique: true },
        password: { type: String, require: true },
        isAdmin: { type: Boolean, default: false },
        address: { type: String, require: false, default: '' },
        phone: { type: String, require: false, default: '' },
        birthDay: { type: Date, require: false, default: null },
        typeLogin: { type: String, enum: ['email', 'google'] },
        avatar: { type: String, require: false, default: '' },
        isOnline: { type: Boolean, default: false },
    },
    {
        timestamps: true,  // Tự động thêm createdAt, updatedAt
    },
);
```

**Giải thích:**
- `Schema`: Định nghĩa cấu trúc document trong MongoDB
- `unique: true` cho `email`: Đảm bảo email không trùng lặp
- `enum: ['email', 'google']`: Chỉ cho phép 2 giá trị
- `timestamps: true`: Tự động thêm `createdAt`, `updatedAt`

#### 6.2. Query trong Service

```javascript
// users.service.js - dòng 59
const user = await modelUser.findOne({ email });
```

**MongoDB Query tương đương:**
```javascript
db.users.findOne({ 
    email: "user@example.com" 
})
```

**Kết quả trả về:**
```javascript
{
    _id: ObjectId("678901234567890abcdef012"),
    fullName: "Nguyễn Văn A",
    email: "user@example.com",
    password: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
    isAdmin: false,
    typeLogin: "email",
    address: "123 Đường ABC",
    phone: "0123456789",
    avatar: "avatar.jpg",
    isOnline: false,
    createdAt: ISODate("2024-01-01T00:00:00.000Z"),
    updatedAt: ISODate("2024-01-01T00:00:00.000Z")
}
```

---

## 📤 BƯỚC 7: Backend - Response Trả Về

### Flow Response:

```
UserService.login()
    ↓
return { token, refreshToken }
    ↓
userController.login()
    ↓
setCookie(res, token, refreshToken)
    ↓
new OK({ message: 'success', metadata: { token, refreshToken } }).send(res)
    ↓
HTTP Response gửi về client
```

**Response Headers:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: token=eyJhbGci...; HttpOnly; Secure; SameSite=Strict; Max-Age=900
Set-Cookie: refreshToken=eyJhbGci...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
Set-Cookie: logged=1; Secure; SameSite=Strict; Max-Age=604800
```

**Response Body:**
```json
{
    "statusCode": 200,
    "message": "success",
    "metadata": {
        "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

---

## 📥 BƯỚC 8: Frontend - Nhận Response và Xử Lý

### File: `client/src/pages/LoginUser.jsx`

#### 8.1. Nhận response

```javascript
// Dòng 19-27
const onFinish = async (values) => {
    setLoading(true);
    try {
        await requestLogin(values);  // ← API call
        // ✅ Nếu thành công:
        toast.success('Đăng nhập thành công!');
        setTimeout(() => {
            window.location.reload();  // Reload để cập nhật state
        }, 1000);
        navigate('/');  // Redirect về trang chủ
    } catch (error) {
        // ❌ Nếu lỗi:
        toast.error(error.response.data.message || 'Đăng nhập thất bại');
    } finally {
        setLoading(false);
    }
};
```

**Giải thích:**
- `await requestLogin(values)`: Đợi response từ server
- Nếu thành công (200 OK):
  - Cookies tự động được lưu bởi browser (vì `withCredentials: true`)
  - Hiển thị toast success
  - Reload trang để cập nhật user state
  - Navigate về trang chủ

#### 8.2. Cookies được lưu tự động

**Browser tự động lưu cookies từ `Set-Cookie` headers:**
```
Cookies:
- token: eyJhbGci... (HttpOnly, Secure)
- refreshToken: eyJhbGci... (HttpOnly, Secure)
- logged: 1 (có thể đọc từ JavaScript)
```

**Lưu ý:**
- `HttpOnly: true` → JavaScript không thể đọc `token` và `refreshToken` (bảo mật)
- `logged: 1` → Frontend có thể đọc để biết user đã login

#### 8.3. Xác thực user sau khi login

**File: `client/src/config/UserRequest.jsx` (dòng 16-19):**

```javascript
export const requestAuth = async () => {
    const res = await apiClient.get(`${apiUser}/auth`);
    return res.data;
};
```

**Sau khi login, frontend thường gọi `/api/users/auth` để:**
- Verify token còn hợp lệ
- Lấy thông tin user (fullName, email, avatar, ...)
- Cập nhật global state (Context/Redux)

---

## 🔄 Tóm Tắt Flow Hoàn Chỉnh

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND: User nhập email/password → Submit form             │
│    File: LoginUser.jsx (onFinish)                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND: Gọi API POST /api/users/login                      │
│    File: UserRequest.jsx (requestLogin)                         │
│    Request: { email: "...", password: "..." }                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. BACKEND: Route nhận request                                  │
│    File: users.routes.js (router.post('/login', ...))           │
│    → Gọi userController.login                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. BACKEND: Controller xử lý                                    │
│    File: user.controller.js (login)                              │
│    - Lấy email/password từ req.body                             │
│    - Gọi UserService.login(data)                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. BACKEND: Service xử lý logic                                 │
│    File: users.service.js (login)                               │
│    - Query DB: modelUser.findOne({ email })                     │
│    - So sánh password: bcrypt.compareSync()                    │
│    - Tạo API key: createApiKey()                                │
│    - Tạo JWT: createToken(), createRefreshToken()              │
│    - Return: { token, refreshToken }                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. DATABASE: MongoDB query                                      │
│    Collection: users                                            │
│    Query: db.users.findOne({ email: "..." })                    │
│    Return: User document với password (hashed)                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. BACKEND: Controller nhận tokens từ Service                   │
│    - Set cookies: setCookie(res, token, refreshToken)          │
│    - Response: new OK({ message, metadata }).send(res)          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. FRONTEND: Nhận response                                      │
│    - Cookies tự động được lưu bởi browser                       │
│    - Hiển thị toast success                                     │
│    - Reload trang → Navigate về trang chủ                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Điểm Quan Trọng Cần Nhớ

1. **Separation of Concerns:**
   - **Controller**: Nhận request, gọi Service, trả response
   - **Service**: Xử lý logic nghiệp vụ, query database
   - **Model**: Định nghĩa schema, cung cấp methods query

2. **Security:**
   - Password được hash bằng bcrypt (không lưu plain text)
   - JWT token được ký bằng RSA private key (mỗi user có key riêng)
   - Cookies có `HttpOnly`, `Secure`, `SameSite=Strict`

3. **Error Handling:**
   - `asyncHandler` bắt lỗi async trong routes
   - Service throw error → Controller catch → Trả về error response
   - Frontend catch error → Hiển thị toast error

4. **State Management:**
   - Cookies lưu tokens (HttpOnly, tự động gửi trong requests)
   - Frontend có thể gọi `/auth` để lấy user info và cập nhật state

---

## 📝 Bài Tập Thực Hành

1. **Trace flow "Đăng ký" (Register):**
   - Tìm file `RegisterUser.jsx`
   - Trace từ frontend → backend → database
   - So sánh với flow "Đăng nhập"

2. **Trace flow "Quên mật khẩu" (Forgot Password):**
   - Tìm các file liên quan
   - Hiểu cách OTP được tạo và gửi email
   - Hiểu cách OTP được verify

3. **Thêm logging:**
   - Thêm `console.log` ở mỗi bước để debug
   - Xem request/response trong Network tab (DevTools)

---

## 🔗 Các File Liên Quan

**Frontend:**
- `client/src/pages/LoginUser.jsx` - Login page
- `client/src/config/UserRequest.jsx` - API calls
- `client/src/config/request.jsx` - Axios config

**Backend:**
- `server/src/routes/users.routes.js` - Routes
- `server/src/controller/user.controller.js` - Controller
- `server/src/services/users.service.js` - Service
- `server/src/models/users.model.js` - Model
- `server/src/utils/jwt.js` - JWT utilities

---

*Tài liệu này giải thích chi tiết từng bước của flow "Đăng Nhập". Hãy đọc kỹ và trace code để hiểu rõ hơn!*

