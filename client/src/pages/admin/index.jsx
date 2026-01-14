import React, { useEffect } from 'react';
import { Layout } from 'antd';
import SidebarAdmin from './components/SidebarAdmin';
import { requestGetDashboardAdmin } from '../../config/UserRequest';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

const { Content } = Layout;

function Admin() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const currentPath = location.pathname;
        
        // Lưu route hiện tại vào sessionStorage mỗi khi location thay đổi
        if (currentPath.startsWith('/admin/') && currentPath !== '/admin') {
            sessionStorage.setItem('adminRoute', currentPath);
        }
        
        const fetchDashboardAdmin = async () => {
            try {
                await requestGetDashboardAdmin();
                return;
            } catch (error) {
                // Chỉ redirect nếu là lỗi authentication (401/403)
                // KHÔNG redirect nếu là lỗi network hoặc CORS
                const isAuthError = error.response?.status === 401 || error.response?.status === 403;
                
                if (isAuthError && error.response) {
                    // Chỉ redirect nếu thực sự không có quyền admin
                    sessionStorage.removeItem('adminRoute');
                    navigate('/');
                }
                // Nếu là lỗi network/CORS, giữ nguyên trang admin
            }
        };
        fetchDashboardAdmin();
    }, [navigate, location.pathname]);

    return (
        <div className="min-h-screen flex bg-gray-50 overflow-x-hidden">
            {/* Sidebar */}
            <div
                className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-gray-200 shadow-sm transition-all duration-300 overflow-y-auto z-50"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-semibold text-gray-800">Trang Quản Trị</h1>
                    </div>
                
                {/* Menu */}
                <div className="p-2">
                    <SidebarAdmin />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-[260px] overflow-x-hidden">
                <Layout>
                    <Content className="min-h-screen p-6 overflow-x-hidden">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-hidden">
                            <Outlet />
                        </div>
                    </Content>
                </Layout>
            </div>
        </div>
    );
}

export default Admin;
