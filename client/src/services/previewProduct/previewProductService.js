import { request } from '../api/request';
import { apiClient } from '../api/axiosClient';

const apiPreviewProduct = '/api/previewProduct';

export const requestCreatePreviewProduct = async (data) => {
    const res = await apiClient.post(`${apiPreviewProduct}/create`, data);
    return res.data;
};

export const requestGetAllPreviewProduct = async () => {
    const res = await request.get(`${apiPreviewProduct}/getAll`);
    return res.data;
};

