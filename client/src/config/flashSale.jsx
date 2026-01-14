import { request } from './request';
import { apiClient } from './axiosClient';

const apiFlashSale = '/api/flashSale';

// Admin FlashSale endpoints
export const requestCreateFlashSale = async (data) => {
    const res = await apiClient.post(`/api/admin/flashSale/create`, data);
    return res.data;
};

export const requestGetAllFlashSale = async () => {
    const res = await apiClient.get(`/api/admin/flashSale/all`);
    return res.data;
};

export const requestGetFlashSaleByDate = async () => {
    const res = await request.get(`${apiFlashSale}/date`);
    return res.data;
};

export const requestDeleteFlashSale = async (id) => {
    const res = await apiClient.delete(`/api/admin/flashSale/delete/${id}`);
    return res.data;
};

export const requestUpdateFlashSale = async (data) => {
    const res = await apiClient.put(`/api/admin/flashSale/update/${data._id}`, data);
    return res.data;
};
