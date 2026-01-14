import { request } from './request';
import { apiClient } from './axiosClient';

const apiNews = '/api/news';

export const requestCreateNews = async (data) => {
    const res = await apiClient.post(`/api/admin/news/create`, data);
    return res.data;
};

export const requestGetAllNews = async () => {
    const res = await request.get(`${apiNews}/get-all`);
    return res.data;
};

export const requestDeleteNews = async (id) => {
    const res = await apiClient.post(`/api/admin/news/delete`, { id });
    return res.data;
};

export const requestUpdateNews = async (id, data) => {
    const res = await apiClient.post(`/api/admin/news/update`, { id, ...data });
    return res.data;
};

export const requestGetNewsById = async (id) => {
    const res = await request.get(`${apiNews}/get-by-id`, {
        params: {
            id,
        },
    });
    return res.data;
};

