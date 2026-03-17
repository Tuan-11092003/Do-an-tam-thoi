import Context from './Context';
import CryptoJS from 'crypto-js';

import cookies from 'js-cookie';
import { io } from 'socket.io-client';

import { useEffect, useState, useRef } from 'react';
import { requestAuth } from '../services/user/userService';
import { ToastContainer, toast } from 'react-toastify';
import { requestGetCart } from '../services/cart/cartService';
import { requestGetConversationByUserId } from '../services/message/messageService';

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

        socket.on('warranty_status_updated', (data) => {
            showWarrantyToast(data);
            saveWarrantyNotification(data);
        });

        return () => {
            socket.disconnect();
        };
    }, [dataUser._id]);

    const warrantyMessages = {
        'Hoàn thành': '🎉 Yêu cầu bảo hành của bạn đã hoàn thành!',
        'Từ chối': '❌ Yêu cầu bảo hành của bạn đã bị từ chối.',
    };

    const getWarrantyMessage = (data) => {
        if (data.statusLabel === 'Đã chấp nhận') {
            return data.emailSent
                ? '✅ Yêu cầu bảo hành của bạn đã được chấp nhận! Vui lòng kiểm tra email.'
                : '✅ Yêu cầu bảo hành của bạn đã được chấp nhận!';
        }
        return warrantyMessages[data.statusLabel] || null;
    };

    const showWarrantyToast = (data) => {
        const msg = getWarrantyMessage(data);
        if (msg) {
            toast.info(msg, {
                autoClose: false,
                closeOnClick: false,
                toastId: `warranty-${data.warrantyId}`,
                onClose: () => removeWarrantyNotification(data.warrantyId),
            });
        }
    };

    const saveWarrantyNotification = (data) => {
        try {
            const pending = JSON.parse(localStorage.getItem('warranty-pending-notifications') || '[]');
            if (!pending.find((n) => n.warrantyId === data.warrantyId)) {
                pending.push(data);
                localStorage.setItem('warranty-pending-notifications', JSON.stringify(pending));
            }
        } catch {}
    };

    const removeWarrantyNotification = (warrantyId) => {
        try {
            const pending = JSON.parse(localStorage.getItem('warranty-pending-notifications') || '[]');
            const updated = pending.filter((n) => n.warrantyId !== warrantyId);
            localStorage.setItem('warranty-pending-notifications', JSON.stringify(updated));
        } catch {}
    };

    useEffect(() => {
        if (!dataUser._id || dataUser.isAdmin) return;
        try {
            const pending = JSON.parse(localStorage.getItem('warranty-pending-notifications') || '[]');
            pending.forEach((data) => showWarrantyToast(data));
        } catch {}
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

    const clearAuth = () => {
        cookies.remove('logged');
        setDataUser({});
        setCartData([]);
        setCouponData([]);
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
                clearAuth,
                cartData,
                fetchCart,
                couponData,
                dataConversation,
                newMessage,
            }}
        >
            {children}
            <ToastContainer autoClose={2000} pauseOnHover={false} />
        </Context.Provider>
    );
}
