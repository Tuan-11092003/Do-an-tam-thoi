import { request } from './request';
import { apiClient } from './axiosClient';

const apiCategory = '/api/category';

export const requestCreateCategory = async (data) => {
    const res = await apiClient.post(`/api/admin/categories/create`, data);
    return res.data;
};

export const requestGetAllCategory = async (search = '') => {
    const params = search ? { search } : {};
    const res = await request.get(`${apiCategory}/all`, { params });
    return res.data;
};

export const requestUpdateCategory = async (data) => {
    const res = await apiClient.post(`/api/admin/categories/update`, data);
    return res.data;
};

export const requestDeleteCategory = async (id) => {
    const res = await apiClient.delete(`/api/admin/categories/delete/${id}`);
    return res.data;
};
