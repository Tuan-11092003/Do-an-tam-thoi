# 🎯 State Management - Context API - Tóm Tắt

**Mục tiêu:** Hiểu cách global state được quản lý và chia sẻ giữa các components

---

## 📊 Tổng Quan

```
Provider (quản lý state) → Context (lưu trữ) → Components (sử dụng useStore())
```

**Luồng:** Provider wrap app → Cung cấp state qua Context → Components dùng `useStore()` để truy cập → State thay đổi → Components tự động re-render

---

## 📁 Cấu Trúc Files

### 1. Context.jsx - Tạo Context
```javascript
import { createContext } from 'react';
const Context = createContext();
export default Context;
```

### 2. Provider.jsx - Quản Lý State
```javascript
export function Provider({ children }) {
    const [dataUser, setDataUser] = useState({});
    const [cartData, setCartData] = useState([]);
    const [couponData, setCouponData] = useState([]);
    const [dataConversation, setDataConversation] = useState();
    const [newMessage, setNewMessage] = useState();

    // Fetch khi app khởi động
    useEffect(() => {
        const token = cookies.get('logged');
        if (token) {
            fetchAuth();   // Lấy user info
            fetchCart();   // Lấy giỏ hàng
        }
    }, []);

    return (
        <Context.Provider value={{
            dataUser, fetchAuth,
            cartData, fetchCart,
            couponData,
            dataConversation,
            newMessage,
        }}>
            {children}
        </Context.Provider>
    );
}
```

### 3. useStore.jsx - Custom Hook
```javascript
import { useContext } from 'react';
import Context from '../store/Context';

export const useStore = () => {
    return useContext(Context);
};
```

### 4. main.jsx - Setup
```javascript
<Provider>
    <Router>
        <Routes>...</Routes>
    </Router>
</Provider>
```

---

## 📦 Các State Được Quản Lý

### 1. dataUser - Thông Tin User
```javascript
const [dataUser, setDataUser] = useState({});
// { _id, fullName, email, phone, address, avatar, isAdmin, ... }
```

**Cập nhật:** `fetchAuth()` → Gọi API `/api/users/auth` → Giải mã AES → `setDataUser(user)`

### 2. cartData - Giỏ Hàng
```javascript
const [cartData, setCartData] = useState([]);
// [{ productId, colorId, sizeId, quantity, isSelected, ... }]
```

**Cập nhật:** `fetchCart()` → Gọi API `/api/cart` → `setCartData(items)`

### 3. couponData - Mã Giảm Giá
```javascript
const [couponData, setCouponData] = useState([]);
```

**Cập nhật:** Được fetch cùng với `fetchCart()`

### 4. dataConversation - Conversation ID
```javascript
const [dataConversation, setDataConversation] = useState();
// String ID của conversation
```

**Cập nhật:** `fetchConversation()` → Gọi API `/api/conversation/user` → `setDataConversation(id)`

### 5. newMessage - Tin Nhắn Mới (Real-time)
```javascript
const [newMessage, setNewMessage] = useState();
```

**Cập nhật:** Socket.io event `'new_message'` → `setNewMessage(data)`

---

## 🔧 Functions Được Cung Cấp

### fetchAuth() - Lấy Thông Tin User
```javascript
const fetchAuth = async () => {
    const res = await requestAuth();
    const bytes = CryptoJS.AES.decrypt(res.metadata, VITE_SECRET_CRYPTO);
    const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    setDataUser(user);
};
```

### fetchCart() - Lấy Giỏ Hàng
```javascript
const fetchCart = async () => {
    const res = await requestGetCart();
    setCartData(res.metadata.items || []);
    setCouponData(res.metadata.coupon || []);
    return res.metadata.summary;
};
```

---

## 💡 Cách Sử Dụng trong Components

```javascript
// Header.jsx
const { dataUser, cartData } = useStore();

// DetailProduct.jsx
const { fetchCart, dataUser } = useStore();
await fetchCart();  // Refresh giỏ hàng

// PersonalInfo.jsx
const { dataUser, fetchAuth } = useStore();
await fetchAuth();  // Refresh user data
```

---

## 🎯 Điểm Quan Trọng

1. **Re-render:** Khi state thay đổi → Tất cả components sử dụng state đó tự động re-render
2. **Initial State:** `dataUser = {}` ban đầu → Cần kiểm tra `dataUser._id` trước khi dùng
3. **Error Handling:** 401/403 (user chưa login) → Không log error, chỉ xóa cookies
4. **Socket.io:** Tự động connect khi `dataUser._id` tồn tại → Disconnect khi unmount

---

## 🔗 Files Liên Quan

- `client/src/store/Context.jsx` - Tạo Context
- `client/src/store/Provider.jsx` - Quản lý state
- `client/src/hooks/useStore.jsx` - Custom hook
- `client/src/main.jsx` - Setup Provider
