import axios from 'axios';
import Cookies from 'js-cookie';
import { requestRefreshToken } from './UserRequest';

export class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL || import.meta.env.VITE_API_URL || '';
        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            withCredentials: true, // Tự động gửi cookies (token, refreshToken) trong mọi request
        });

        // Flag để tránh gọi refresh token nhiều lần cùng lúc
        // Khi một request đang refresh token, các request khác sẽ chờ
        this.isRefreshing = false;
        
        // Queue chứa các request bị fail (401) khi đang refresh token
        // Sau khi refresh thành công, sẽ retry lại tất cả các request trong queue này
        this.failedQueue = [];

        this.setupInterceptors();
    }

    setupInterceptors() {
        // Request interceptor: Chạy trước khi gửi request
        // Hiện tại không làm gì, có thể thêm token vào header ở đây nếu cần
        this.axiosInstance.interceptors.request.use(
            (config) => config,
            (error) => Promise.reject(error),
        );

        // Response interceptor: Chạy sau khi nhận response
        // Xử lý lỗi 401 (token hết hạn) và tự động refresh token
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                
                // Chỉ xử lý lỗi 401 (Unauthorized) và chưa retry
                // _retry flag để tránh loop vô hạn khi refresh token thất bại
                if (error.response?.status === 401 && !originalRequest._retry) {
                    // Nếu user chưa login (không có cookie 'logged') → Logout và redirect
                    if (!this.isLoggedIn()) {
                        this.handleAuthFailure();
                        return Promise.reject(error);
                    }

                    // Nếu đang refresh token → Thêm request vào queue để retry sau
                    // Tránh gọi refresh token nhiều lần cùng lúc
                    if (this.isRefreshing) {
                        return new Promise((resolve, reject) => {
                            // Lưu resolve/reject vào queue để xử lý sau khi refresh xong
                            this.failedQueue.push({ resolve, reject });
                        })
                            .then(() => this.axiosInstance(originalRequest)) // Retry request ban đầu
                            .catch((err) => Promise.reject(err));
                    }

                    // Bắt đầu refresh token
                    originalRequest._retry = true; // Đánh dấu đã retry, tránh loop
                    this.isRefreshing = true; // Báo cho request khác biết đang refresh

                    try {
                        // Gọi API refresh token (dùng refreshToken cookie)
                        await this.refreshToken();
                        
                        // Retry tất cả request trong queue (refresh thành công)
                        this.processQueue(null);
                        
                        // Retry request ban đầu với token mới
                        return this.axiosInstance(originalRequest);
                    } catch (refreshError) {
                        // Refresh thất bại → Reject tất cả request trong queue
                        this.processQueue(refreshError);
                        
                        // Logout và redirect về trang login
                        this.handleAuthFailure();
                        return Promise.reject(refreshError);
                    } finally {
                        // Luôn reset flag sau khi xử lý xong
                        this.isRefreshing = false;
                    }
                }

                // Các lỗi khác (không phải 401) → Reject bình thường
                return Promise.reject(error);
            },
        );
    }

    // Gọi API refresh token để lấy token mới
    // Server sẽ set cookie token mới sau khi refresh thành công
    async refreshToken() {
        try {
            await requestRefreshToken();
            console.log('Token refreshed successfully');
        } catch (error) {
            console.error('Failed to refresh token:', error);
            throw error;
        }
    }

    // Xử lý queue các request bị fail khi đang refresh token
    // Nếu refresh thành công (error = null) → Resolve tất cả để retry
    // Nếu refresh thất bại (error != null) → Reject tất cả
    processQueue(error) {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error); // Refresh thất bại → Reject request
            } else {
                resolve(); // Refresh thành công → Resolve để retry request
            }
        });

        // Xóa queue sau khi xử lý xong
        this.failedQueue = [];
    }

    // Xử lý khi authentication thất bại (refresh token thất bại hoặc chưa login)
    // Gọi API logout và redirect về trang login
    handleAuthFailure() {
        this.logout().finally(() => {
            window.location.href = '/login';
        });
    }

    // Kiểm tra user đã login chưa (dựa vào cookie 'logged')
    isLoggedIn() {
        return Cookies.get('logged') === '1';
    }

    // Gọi API logout để xóa cookies ở server
    async logout() {
        try {
            await this.axiosInstance.get('/api/users/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Kiểm tra trạng thái authentication
    checkAuthStatus() {
        return this.isLoggedIn();
    }

    // Wrapper methods cho axios HTTP methods
    // Tất cả các method này đều có interceptors (tự động refresh token khi 401)
    get(url, config) {
        return this.axiosInstance.get(url, config);
    }

    post(url, data, config) {
        return this.axiosInstance.post(url, data, config);
    }

    put(url, data, config) {
        return this.axiosInstance.put(url, data, config);
    }

    delete(url, config) {
        return this.axiosInstance.delete(url, config);
    }

    patch(url, data, config) {
        return this.axiosInstance.patch(url, data, config);
    }
}

// Export instance duy nhất để sử dụng trong toàn bộ ứng dụng
// Tất cả API calls cần authentication nên dùng apiClient này
export const apiClient = new ApiClient();
