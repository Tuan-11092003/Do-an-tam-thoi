import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminRedirect() {
    const navigate = useNavigate();

    useEffect(() => {
        // Kiểm tra sessionStorage để lấy route đã lưu
        const savedRoute = sessionStorage.getItem('adminRoute');
        
        // Nếu có route đã lưu và hợp lệ, redirect đến đó
        if (savedRoute && savedRoute.startsWith('/admin/') && savedRoute !== '/admin') {
            navigate(savedRoute, { replace: true });
        } else {
            // Nếu không có route đã lưu, redirect đến dashboard
            navigate('/admin/dashboard', { replace: true });
        }
    }, [navigate]);

    return null;
}

export default AdminRedirect;

