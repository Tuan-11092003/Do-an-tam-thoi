import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    DashboardOutlined,
    AppstoreOutlined,
    ShoppingOutlined,
    TagOutlined,
    ShoppingCartOutlined,
    SafetyOutlined,
    MessageOutlined,
    ThunderboltFilled,
    FileTextOutlined,
    NotificationOutlined,
    UserOutlined,
} from '@ant-design/icons';

function SidebarAdmin() {
    const navigate = useNavigate();
    const location = useLocation();

    // Lấy key từ pathname (ví dụ: /admin/dashboard -> dashboard)
    const getSelectedKey = () => {
        const path = location.pathname;
        const match = path.match(/\/admin\/(.+)/);
        return match ? match[1] : 'dashboard';
    };

    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: <span className="font-medium">Thống kê</span>,
        },
        {
            key: 'user',
            icon: <UserOutlined />,
            label: <span className="font-medium">Quản lý người dùng</span>,
        },
        {
            key: 'coupon',
            icon: <TagOutlined />,
            label: <span className="font-medium">Quản lý mã giảm giá</span>,
        },
        {
            key: 'flashSale',
            icon: <ThunderboltFilled />,
            label: <span className="font-medium">Quản lý khuyến mãi</span>,
        },
        {
            key: 'category',
            icon: <AppstoreOutlined />,
            label: <span className="font-medium">Quản lý danh mục</span>,
        },
        {
            key: 'product',
            icon: <ShoppingOutlined />,
            label: <span className="font-medium">Quản lý sản phẩm</span>,
        },
        {
            key: 'news',
            icon: <NotificationOutlined />,
            label: <span className="font-medium">Quản lý tin tức</span>,
        },
        {
            key: 'order',
            icon: <ShoppingCartOutlined />,
            label: <span className="font-medium">Quản lý đơn hàng</span>,
        },
        {
            key: 'message',
            icon: <MessageOutlined />,
            label: <span className="font-medium">Quản lý tin nhắn</span>,
        },
        {
            key: 'warranty',
            icon: <SafetyOutlined />,
            label: <span className="font-medium">Quản lý bảo hành</span>,
        },
    ];

    const handleMenuClick = ({ key }) => {
        navigate(`/admin/${key}`);
    };

    return (
        <div className="flex flex-col">
            <style>{`
                .admin-menu .ant-menu-item {
                    margin: 4px 0 !important;
                    border-radius: 8px !important;
                    height: 44px !important;
                    line-height: 44px !important;
                    padding-left: 16px !important;
                    transition: all 0.2s ease !important;
                }
                .admin-menu .ant-menu-item:hover {
                    background-color: #f3f4f6 !important;
                }
                .admin-menu .ant-menu-item-selected {
                    background-color: #eff6ff !important;
                    color: #2563eb !important;
                    font-weight: 500 !important;
                }
                .admin-menu .ant-menu-item-selected .ant-menu-item-icon {
                    color: #2563eb !important;
                }
                .admin-menu .ant-menu-item-icon {
                    font-size: 18px !important;
                    margin-right: 12px !important;
                }
                .admin-menu .ant-menu-item span {
                    font-size: 14px !important;
                }
            `}</style>
            <Menu
                mode="inline"
                selectedKeys={[getSelectedKey()]}
                onClick={handleMenuClick}
                items={menuItems}
                className="admin-menu border-0"
                style={{
                    background: 'transparent',
                }}
            />
        </div>
    );
}

export default SidebarAdmin;
