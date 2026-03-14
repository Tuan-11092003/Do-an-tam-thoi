import { Menu, Avatar, Badge } from 'antd';
import { UserOutlined, LogoutOutlined, CrownOutlined } from '@ant-design/icons';
import { ShoppingCart, FileText, Heart } from 'lucide-react';
import { useStore } from '../../../hooks/useStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { requestLogout } from '../../../services/user/userService';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../../utils/imageUrl';

function UserSidebar({ activeKey, onSelect, setActiveKey }) {
    const { dataUser, clearAuth } = useStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await requestLogout();
            clearAuth();
            navigate('/login');
            toast.success('Đăng xuất thành công!');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Đăng xuất thất bại');
        }
    };

    const { pathname } = useLocation();

    useEffect(() => {
        const path = pathname.split('/')[1];
        switch (path) {
            case 'profile':
                setActiveKey('profile');
                break;
            case 'order':
                setActiveKey('order');
                break;
            case 'warranty':
                setActiveKey('warranty');
                break;
            case 'favourite':
                setActiveKey('favourite');
                break;
        }
    }, [pathname]);

    const items = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Tài khoản của tôi',
            path: '/profile',
        },
        {
            key: 'order',
            icon: <ShoppingCart className="w-4 h-4" />,
            label: 'Đơn hàng của tôi',
            path: '/order',
        },
        {
            key: 'warranty',
            icon: <FileText className="w-4 h-4" />,
            label: 'Bảo hành sản phẩm',
            path: '/warranty',
        },
        {
            key: 'favourite',
            icon: <Heart className="w-4 h-4" />,
            label: 'Sản phẩm yêu thích',
            path: '/favourite',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
            onClick: handleLogout,
        },
    ];

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-[#e45464] to-[#d70018] text-white p-6">
                <div className="flex flex-col items-center">
                    <Badge
                        count={dataUser?.role === 'admin' ? <CrownOutlined style={{ color: '#f5c518' }} /> : 0}
                        offset={[-5, 5]}
                    >
                        <Avatar
                            size={80}
                            src={dataUser?.avatar ? getImageUrl(dataUser.avatar, 'avatars') : undefined}
                            icon={<UserOutlined />}
                            className="border-4 border-white shadow-lg"
                        />
                    </Badge>
                    <div className="text-center mt-4">
                        <h3 className="font-bold text-lg">{dataUser?.fullName || 'Người dùng'}</h3>
                        <p className="text-gray-100 text-sm mt-1">{dataUser?.email}</p>
                    </div>
                </div>
            </div>

            <Menu
                mode="inline"
                selectedKeys={[activeKey]}
                items={items}
                onClick={(e) => {
                    if (e.key === 'logout') {
                        handleLogout();
                    } else {
                        onSelect(e.key);
                        navigate(items.find((item) => item.key === e.key).path);
                    }
                }}
                className="border-0"
                style={{
                    boxShadow: 'none',
                }}
            />
        </div>
    );
}

export default UserSidebar;
