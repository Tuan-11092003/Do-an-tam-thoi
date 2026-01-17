# 🔍 Flow "Đăng Ký" - Tóm Tắt

**Mục tiêu:** Hiểu cách request đăng ký đi từ frontend → backend → database → response

---

## 📊 Tổng Quan

```
Frontend → POST /api/users/register → Backend Route → Controller → Service → Database (Create) → Response
```

**Luồng:** User nhập thông tin → Submit → API call → Backend kiểm tra email → Hash password → Tạo user mới → Tạo JWT → Set cookies → Response

---

## 🔍 Các Bước Chính

### 1. Frontend - Submit Form
**File:** `client/src/pages/Register.jsx`

**Form Fields:** fullName, phone, email, password, confirmPassword

```jsx
const onFinish = async (values) => {
    await requestRegister(values);
    toast.success('Đăng ký thành công!');
    window.location.reload();
    navigate('/');
};
```

**Giải thích:**
- `onFinish`: Function được gọi khi form submit thành công (validation pass)
- `values`: Object chứa dữ liệu từ form: `{ fullName, phone, email, password, confirmPassword }`
- `requestRegister(values)`: Gọi API để đăng ký user mới
- `toast.success()`: Hiển thị thông báo thành công
- `window.location.reload()`: Reload trang để cập nhật state (Provider sẽ fetch user data)
- `navigate('/')`: Redirect về trang chủ

**API Call:** `client/src/config/UserRequest.jsx`
```javascript
export const requestRegister = async (data) => {
    const res = await request.post(`${apiUser}/register`, data);
    return res.data;
};
```

**Giải thích:**
- `request.post()`: Gửi HTTP POST request đến `/api/users/register`
- `data`: Object chứa `{ fullName, phone, email, password, confirmPassword }`
- `res.data`: Response data từ server (chứa `statusCode`, `message`, `metadata`)
- **Lưu ý:** Backend chỉ nhận `fullName`, `email`, `password`, `phone`. `confirmPassword` không được gửi đến backend

---

### 2. Backend Route
**File:** `server/src/routes/users.routes.js`
```javascript
router.post('/register', asyncHandler(userController.createUser));
```

**Giải thích:**
- `router.post('/register', ...)`: Đăng ký route POST `/register`
- Route đầy đủ: `POST /api/users/register` (vì router được mount tại `/api/users`)
- `asyncHandler`: Middleware bắt lỗi async, tránh crash server khi có lỗi
- `userController.createUser`: Function xử lý request (sẽ được gọi với `req, res`)

---

### 3. Controller
**File:** `server/src/controller/user.controller.js`
```javascript
async createUser(req, res) {
    const { fullName, email, password, phone } = req.body;
    if (!fullName || !email || !password || !phone) {
        throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }
    const { token, refreshToken } = await UserService.createUser({ fullName, email, password, phone });
    setCookie(res, token, refreshToken);
    return new OK({ message: 'Tạo user thành công', metadata: { token, refreshToken } }).send(res);
}
```

**Giải thích từng dòng:**
- **Dòng 55:** `const { fullName, email, password, phone } = req.body;`
  - Destructure để lấy dữ liệu từ request body
  - `req.body` chứa JSON data từ frontend: `{ fullName, phone, email, password, confirmPassword }`
  - **Lưu ý:** `confirmPassword` không được lấy (bị bỏ qua)

- **Dòng 56-58:** Validation cơ bản
  - Kiểm tra các field bắt buộc có tồn tại không
  - Nếu thiếu → Throw `BadRequestError` → Trả về HTTP 400 với message lỗi
  - Đây là validation đầu tiên ở backend (sau validation ở frontend)

- **Dòng 59:** `await UserService.createUser({ ... })`
  - Gọi Service layer để xử lý logic nghiệp vụ
  - Service sẽ: Kiểm tra email, hash password, tạo user, tạo token
  - Trả về `{ token, refreshToken }` nếu thành công
  - Nếu lỗi (VD: email đã tồn tại) → Service throw error → Controller không chạy tiếp

- **Dòng 60:** `setCookie(res, token, refreshToken);`
  - Set cookies vào response để browser tự động lưu
  - Cookies được set:
    - `token`: JWT token (15 phút, HttpOnly, Secure)
    - `refreshToken`: Refresh token (7 ngày, HttpOnly, Secure)
    - `logged`: Flag để frontend biết user đã login (7 ngày, không HttpOnly)

- **Dòng 61:** `return new OK({ ... }).send(res);`
  - `OK` là class success response (HTTP 200)
  - `metadata`: Chứa `token` và `refreshToken` (để frontend có thể dùng nếu cần)
  - `.send(res)`: Gửi response về client

---

### 4. Service - Logic Chính
**File:** `server/src/services/users.service.js`
```javascript
async createUser(data) {
    const { fullName, email, password, phone } = data;
    
    // 1. Kiểm tra email đã tồn tại
    const findUser = await modelUser.findOne({ email });
    if (findUser) {
        throw new ConflictRequestError('Email đã tồn tại');
    }
    
    // 2. Hash password
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    // 3. Tạo user mới
    const newUser = await modelUser.create({
        fullName,
        email,
        phone,
        password: passwordHash,
        typeLogin: 'email',
    });
    
    // 4. Tạo API key và token
    await createApiKey(newUser._id);
    const token = await createToken({ id: newUser._id });
    const refreshToken = await createRefreshToken({ id: newUser._id });
    
    return { token, refreshToken };
}
```

**Giải thích từng bước:**

**Bước 1: Kiểm tra email đã tồn tại (dòng 74-77)**
- `modelUser.findOne({ email })`: Query MongoDB để tìm user có email này
- Nếu tìm thấy (`findUser !== null`) → Throw `ConflictRequestError` (HTTP 409)
- Nếu không tìm thấy → Tiếp tục bước 2
- **Tại sao cần kiểm tra:** Email phải unique (schema có `unique: true`)

**Bước 2: Hash password (dòng 80-82)**
- `saltRounds = 10`: Số vòng lặp hash (càng cao càng an toàn nhưng chậm hơn)
- `genSaltSync(saltRounds)`: Tạo salt ngẫu nhiên (VD: `"$2b$10$abcdefghijklmnopqrstuv"`)
- `hashSync(password, salt)`: Hash password với salt
  - Input: `"123456"` (plain text)
  - Output: `"$2b$10$abcdefghijklmnopqrstuvwxyz1234567890..."` (hash)
- **Tại sao cần hash:** Bảo mật - Không lưu password dạng plain text trong database

**Bước 3: Tạo user mới (dòng 85-91)**
- `modelUser.create({ ... })`: Tạo document mới trong MongoDB collection `users`
- Dữ liệu được lưu:
  - `fullName`, `email`, `phone`: Từ input
  - `password`: Password đã hash (không phải plain text)
  - `typeLogin: 'email'`: Phân biệt với user đăng ký bằng Google
  - Các field khác có default values từ schema:
    - `isAdmin: false`
    - `address: ""`
    - `avatar: ""`
    - `isOnline: false`
    - `createdAt`, `updatedAt`: Tự động từ `timestamps: true`
- Kết quả: `newUser` object với `_id` mới được tạo

**Bước 4: Tạo API key và token (dòng 94-96)**
- `createApiKey(newUser._id)`: Tạo cặp RSA key (public/private) cho user
  - Private key dùng để ký JWT token
  - Public key dùng để verify JWT token
  - Mỗi user có key riêng (bảo mật hơn shared secret)
- `createToken({ id: newUser._id })`: Tạo JWT access token
  - Payload: `{ id: "user_id", iat: timestamp, exp: timestamp + 15m }`
  - Được ký bằng RSA private key của user
  - Hết hạn sau 15 phút
- `createRefreshToken({ id: newUser._id })`: Tạo JWT refresh token
  - Tương tự nhưng hết hạn sau 7 ngày
  - Dùng để refresh access token khi hết hạn

**Database Operation:**
```javascript
// MongoDB tương đương:
db.users.insertOne({
    fullName: "Nguyễn Văn A",
    email: "user@example.com",
    phone: "0909090909",
    password: "$2b$10$...",  // Hash, không phải plain text
    typeLogin: "email",
    isAdmin: false,
    address: "",
    avatar: "",
    isOnline: false,
    createdAt: ISODate("2024-01-01T00:00:00.000Z"),
    updatedAt: ISODate("2024-01-01T00:00:00.000Z")
})
```

---

## 🔄 So Sánh với "Đăng Nhập"

| Khía cạnh | Đăng Ký | Đăng Nhập |
|-----------|---------|-----------|
| **Route** | `POST /register` | `POST /login` |
| **Input** | fullName, email, password, phone | email, password |
| **Validation** | Kiểm tra email chưa tồn tại | Kiểm tra email đã tồn tại |
| **Password** | Hash password mới | So sánh password với hash |
| **Database** | `create()` - Tạo user mới | `findOne()` - Tìm user |
| **Kết quả** | User mới + Token | Token (user đã tồn tại) |

---

## 🎯 Điểm Quan Trọng

1. **Email Uniqueness:** Email phải unique, kiểm tra trước khi tạo
2. **Password Hashing:** Password được hash bằng bcrypt trước khi lưu
3. **Auto Login:** Sau đăng ký → Tự động tạo token → User đã "logged in"
4. **confirmPassword:** Frontend có field này nhưng không validate so sánh với password

---

## 🔗 Files Liên Quan

- `client/src/pages/Register.jsx` - Register page
- `client/src/config/UserRequest.jsx` - API call
- `server/src/routes/users.routes.js` - Route
- `server/src/controller/user.controller.js` - Controller
- `server/src/services/users.service.js` - Service
- `server/src/models/users.model.js` - Model
