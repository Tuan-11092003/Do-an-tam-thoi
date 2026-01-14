import { request } from './request';
import { apiClient } from './axiosClient';

const apiWarranty = '/api/warranty';

export const requestGetWarrantyByUserId = async () => {
    const res = await apiClient.get(`${apiWarranty}/history`);
    return res.data;
};

export const requestSubmitReturn = async (data) => {
    const res = await apiClient.post(`${apiWarranty}/request`, data);
    return res.data;
};

export const requestGetWarrantyByAdmin = async () => {
    const res = await apiClient.get(`/api/admin/warranty`);
    return res.data;
};

export const requestUpdateWarrantyStatus = async (warrantyId, status) => {
    const res = await apiClient.put(`/api/admin/warranty/${warrantyId}`, { status });
    return res.data;
};
