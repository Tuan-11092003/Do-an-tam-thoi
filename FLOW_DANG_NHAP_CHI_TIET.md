# 🔍 Flow "Đăng Nhập" - Tóm Tắt

**Mục tiêu:** Hiểu cách request đi từ frontend → backend → database → response

---

## 📊 Tổng Quan

```
Frontend → POST /api/users/login → Backend Route → Controller → Service → Database → Response
```

**Luồng:** User nhập email/password → Submit → API call → Backend tìm user → So sánh password → Tạo JWT → Set cookies → Response

---

## 🔍 Các Bước Chính

### 1. Frontend - Submit Form
**File:** `client/src/pages/LoginUser.jsx`

```jsx
const onFinish = async (values) => {
    await requestLogin(values);  // { email, password }
    toast.success('Đăng nhập thành công!');
    window.location.reload();
    navigate('/');
};
```

**API Call:** `client/src/config/UserRequest.jsx`
```javascript
export const requestLogin = async (data) => {
    const res = await request.post(`${apiUser}/login`, data);
    return res.data;
};
```

---

### 2. Backend Route
**File:** `server/src/routes/users.routes.js`
```javascript
router.post('/login', asyncHandler(userController.login));
```

---

### 3. Controller
**File:** `server/src/controller/user.controller.js`
```javascript
async login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }
    const { token, refreshToken } = await UserService.login({ email, password });
    setCookie(res, token, refreshToken);
    return new OK({ message: 'success', metadata: { token, refreshToken } }).send(res);
}
```

---

### 4. Service - Logic Chính
**File:** `server/src/services/users.service.js`
```javascript
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
    
    return { token, refreshToken };
}
```

**Database Query:**
```javascript
// MongoDB: db.users.findOne({ email: "user@example.com" })
```

**Password Comparison:**
```javascript
// bcrypt.compareSync("123456", "$2b$10$...") → true/false
```

---

### 5. JWT Token Creation
**File:** `server/src/utils/jwt.js`
```javascript
const createToken = async (payload) => {
    const findApiKey = await modelApiKey.findOne({ userId: payload.id });
    return jwt.sign(payload, findApiKey.privateKey, {
        algorithm: 'RS256',
        expiresIn: '15m',  // 15 phút
    });
};
```

---

### 6. Response
**Headers:**
```http
Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=900
Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
Set-Cookie: logged=1; Secure; SameSite=Strict; Max-Age=604800
```

**Body:**
```json
{
    "statusCode": 200,
    "message": "success",
    "metadata": {
        "token": "eyJhbGci...",
        "refreshToken": "eyJhbGci..."
    }
}
```

---

## 🎯 Điểm Quan Trọng

1. **Password Security:** Password được hash bằng bcrypt, không lưu plain text
2. **JWT Token:** Được ký bằng RSA private key (mỗi user có key riêng)
3. **Cookies:** Token được lưu trong HttpOnly cookie (bảo mật)
4. **Auto Login:** Sau khi đăng nhập, cookies được set → User đã "logged in"

---

## 🔗 Files Liên Quan

- `client/src/pages/LoginUser.jsx` - Login page
- `client/src/config/UserRequest.jsx` - API call
- `server/src/routes/users.routes.js` - Route
- `server/src/controller/user.controller.js` - Controller
- `server/src/services/users.service.js` - Service
- `server/src/models/users.model.js` - Model
- `server/src/utils/jwt.js` - JWT utilities
