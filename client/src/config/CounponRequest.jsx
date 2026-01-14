import { request } from './request';
import { apiClient } from './axiosClient';

const apiCoupon = '/api/coupon';

export const requestCreateCoupon = async (data) => {
    const res = await apiClient.post('/api/admin/coupons/create', data);
    return res.data;
};

export const requestGetAllCoupon = async () => {
    const res = await apiClient.get('/api/admin/coupons/all');
    return res.data;
};

export const requestGetActiveCoupon = async () => {
    const res = await request.get(apiCoupon + '/active');
    return res.data;
};

export const requestUpdateCoupon = async (data) => {
    const res = await apiClient.put('/api/admin/coupons/update', data);
    return res.data;
};

export const requestDeleteCoupon = async (id) => {
    const res = await apiClient.delete('/api/admin/coupons/delete', {
        data: {
            id,
        },
    });
    return res.data;
};
