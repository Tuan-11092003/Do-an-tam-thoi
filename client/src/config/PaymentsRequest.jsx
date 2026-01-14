import { request } from './request';
import { apiClient } from './axiosClient';

const apiPayment = '/api/payment';

export const requestCreatePayment = async (data) => {
    const res = await apiClient.post(`${apiPayment}/create`, data);
    return res.data;
};

export const requestGetPaymentById = async (id) => {
    const res = await apiClient.get(`${apiPayment}/detail/${id}`);
    return res.data;
};

export const requestGetAllOrder = async (search = '', status = '') => {
    const params = {};
    if (search) params.search = search;
    if (status && status !== 'all') params.status = status;
    const res = await apiClient.get(`/api/admin/orders/all`, { params });
    return res.data;
};

export const requestUpdateOrderStatus = async (orderId, status) => {
    const res = await apiClient.put(`/api/admin/orders/update-status/${orderId}`, { status });
    return res.data;
};

export const requestGetOrderHistory = async () => {
    const res = await apiClient.get(`${apiPayment}/order-history`);
    return res.data;
};

export const requestCancelOrder = async (orderId) => {
    const res = await apiClient.put(`${apiPayment}/cancel-order/${orderId}`);
    return res.data;
};
