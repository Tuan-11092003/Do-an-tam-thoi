import React, { useEffect, useState } from 'react';
import { Menu, Badge } from 'antd';
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
    HomeOutlined,
} from '@ant-design/icons';
import { requestGetAllConversation } from '../../../services/message/messageService';

function SidebarAdmin() {
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await requestGetAllConversation();
                const total = (res.metadata || []).reduce((sum, c) => sum + (c.lengthIsRead || 0), 0);
                setUnreadCount(total);
            } catch {}
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 2000);
        return () => clearInterval(interval);
    }, []);

    // Lấy key từ pathname (ví dụ: /admin/dashboard -> dashboard)
    const getSelectedKey = () => {
        const path = location.pathname;
        const match = path.match(/\/admin\/(.+)/);
        return match ? match[1] : 'dashboard';
    };

    const isUserSiteKey = (key) => key === 'trang-nguoi-dung';

    const menuItems = [
        {
            key: 'trang-nguoi-dung',
            icon: <HomeOutlined />,
            label: <span className="font-medium">Trang người dùng</span>,
        },
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
            key: 'order',
            icon: <ShoppingCartOutlined />,
            label: <span className="font-medium">Quản lý đơn hàng</span>,
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
            key: 'news',
            icon: <NotificationOutlined />,
            label: <span className="font-medium">Quản lý tin tức</span>,
        },
        {
            key: 'warranty',
            icon: <SafetyOutlined />,
            label: <span className="font-medium">Quản lý bảo hành</span>,
        },
        {
            key: 'message',
            icon: <MessageOutlined />,
            label: (
                <span className="font-medium flex items-center justify-between w-full">
                    Quản lý tin nhắn
                    {unreadCount > 0 && (
                        <Badge count={unreadCount} size="small" style={{ marginLeft: 8 }} />
                    )}
                </span>
            ),
        },
    ];

    const handleMenuClick = ({ key }) => {
        if (isUserSiteKey(key)) {
            navigate('/');
            return;
        }
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
                selectedKeys={[getSelectedKey()].filter((k) => !isUserSiteKey(k))}
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
