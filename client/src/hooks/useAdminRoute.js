import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook để khôi phục route admin sau khi reload
 * Sử dụng sessionStorage để lưu route admin
 */
export function useAdminRoute() {
    const location = useLocation();

    useEffect(() => {
        // Nếu đang ở route admin, lưu vào sessionStorage
        if (location.pathname.startsWith('/admin')) {
            sessionStorage.setItem('adminRoute', location.pathname);
        }
    }, [location.pathname]);
}

