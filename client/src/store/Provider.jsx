import Context from './Context';
import CryptoJS from 'crypto-js';

import cookies from 'js-cookie';
import { io } from 'socket.io-client';

import { useEffect, useState, useRef } from 'react';
import { requestAuth } from '../config/UserRequest';
import { ToastContainer } from 'react-toastify';
import { requestGetCart } from '../config/CartRequest';
import { requestGetConversationByUserId } from '../config/MessageRequest';

export function Provider({ children }) {
    const [dataUser, setDataUser] = useState({});
    const [cartData, setCartData] = useState([]);
    const [couponData, setCouponData] = useState([]);

    const [dataConversation, setDataConversation] = useState();
    const [newMessage, setNewMessage] = useState();

    const socketRef = useRef(null);

    const fetchConversation = async () => {
        const res = await requestGetConversationByUserId();
        setDataConversation(res.metadata._id);
    };

    useEffect(() => {
        if (dataUser?.isAdmin === false) {
            fetchConversation();
        }
    }, [dataUser]);

    useEffect(() => {
        if (!dataUser._id) return;

        const socket = io(import.meta.env.VITE_API_URL, {
            withCredentials: true,
        });

        socketRef.current = socket;

        socket.on('new_message', (data) => {
            setNewMessage(data);
        });

        return () => {
            socket.disconnect();
        };
    }, [dataUser._id]);

    const fetchAuth = async () => {
        try {
            const res = await requestAuth();
            const bytes = CryptoJS.AES.decrypt(res.metadata, import.meta.env.VITE_SECRET_CRYPTO);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (!originalText) {
                console.error('Failed to decrypt data');
                return;
            }
            const user = JSON.parse(originalText);
            setDataUser(user);
        } catch (error) {
            // Chỉ log error nếu không phải lỗi 401/403 (unauthorized/forbidden) - có nghĩa là user chưa đăng nhập hoặc không có quyền
            const status = error.response?.status;
            if (status !== 401 && status !== 403) {
                console.error('Auth error:', error);
            }
            // Xóa cookie nếu token không hợp lệ
            if (status === 401 || status === 403) {
                cookies.remove('logged');
                cookies.remove('token');
                cookies.remove('refreshToken');
            }
        }
    };

    const fetchCart = async () => {
        try {
            const res = await requestGetCart();
            setCartData(res.metadata.items || []);
            // Đảm bảo couponData luôn là mảng, không phải undefined
            setCouponData(res.metadata.coupon || []);
            // Lưu summary từ server (subtotal, couponDiscount, finalTotal)
            return res.metadata.summary || null;
        } catch (error) {
            // Chỉ log error nếu không phải lỗi 401/403 (unauthorized/forbidden) - có nghĩa là user chưa đăng nhập hoặc không có quyền
            const status = error.response?.status;
            if (status !== 401 && status !== 403) {
                console.error('Error fetching cart:', error);
            }
            // Đặt về mảng rỗng nếu có lỗi
            setCartData([]);
            setCouponData([]);
            return null;
        }
    };

    useEffect(() => {
        const token = cookies.get('logged');

        if (!token) {
            return;
        }
        fetchAuth();
        fetchCart();
    }, []);

    return (
        <Context.Provider
            value={{
                dataUser,
                fetchAuth,
                cartData,
                fetchCart,
                couponData,
                dataConversation,
                newMessage,
            }}
        >
            {children}
            <ToastContainer />
        </Context.Provider>
    );
}
