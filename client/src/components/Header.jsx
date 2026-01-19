import { Search, User, ShoppingCart, FileText, Package, Home, Heart } from 'lucide-react';

import { Dropdown, Avatar } from 'antd';

import { UserOutlined, DownOutlined, CrownOutlined } from '@ant-design/icons';

import logo from '../assets/logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { useStore } from '../hooks/useStore';
import { requestLogout } from '../config/UserRequest';
import { toast } from 'react-toastify';
import useDebounce from '../hooks/useDebounce';
import { useEffect, useState } from 'react';
import { requestSearchProduct } from '../config/ProductRequest';

function Header() {
    const { dataUser, cartData } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Kiểm tra đường dẫn hiện tại có đang active không
    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const handleLogout = () => {
        try {
            requestLogout();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            navigate('/login');
        } catch (error) {
            toast.error(error.response.data.message);
        }
    };

    const debounce = useDebounce(query, 500);

    useEffect(() => {
        const fetchSearchProduct = async () => {
            if (debounce.trim()) {
                setIsSearching(true);
                try {
                    const res = await requestSearchProduct(debounce);
                    setSearchResults(res.metadata || []);
                    setShowResults(true);
                } catch (error) {
                    console.error('Search error:', error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        };
        fetchSearchProduct();
    }, [debounce]);

    // Đóng kết quả tìm kiếm khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.search-container')) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Xử lý scroll để hiện/ẩn header
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Nếu scroll xuống và đã scroll quá 100px thì ẩn header
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsHeaderVisible(false);
            } 
            // Nếu scroll lên thì hiện header
            else if (currentScrollY < lastScrollY) {
                setIsHeaderVisible(true);
            }
            // Nếu ở đầu trang thì luôn hiện header
            else if (currentScrollY < 10) {
                setIsHeaderVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    const navigateUser = (path) => {
        navigate(path);
    };

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
        setQuery('');
        setShowResults(false);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const handleSearchInputChange = (e) => {
        setQuery(e.target.value);
        if (!e.target.value.trim()) {
            setShowResults(false);
        }
    };

    const userMenuItems = [
        { 
            key: 'profile', 
            label: (
                <div className="flex items-center space-x-2 py-1">
                    <UserOutlined className="text-[#ed1d24]" />
                    <span>Thông tin cá nhân</span>
                </div>
            ), 
            onClick: () => navigateUser('/profile') 
        },
        { 
            key: 'bookings', 
            label: (
                <div className="flex items-center space-x-2 py-1">
                    <ShoppingCart className="w-4 h-4 text-[#ed1d24]" />
                    <span>Đơn hàng của tôi</span>
                </div>
            ), 
            onClick: () => navigateUser('/order') 
        },
        { 
            key: 'warranty', 
            label: (
                <div className="flex items-center space-x-2 py-1">
                    <FileText className="w-4 h-4 text-[#ed1d24]" />
                    <span>Quản lý bảo hành</span>
                </div>
            ), 
            onClick: () => navigateUser('/warranty') 
        },
        { 
            key: 'favourite', 
            label: (
                <div className="flex items-center space-x-2 py-1">
                    <Heart className="w-4 h-4 text-[#ed1d24]" />
                    <span>Sản phẩm yêu thích</span>
                </div>
            ), 
            onClick: () => navigateUser('/favourite') 
        },
        // Chỉ hiển thị "Trang Admin" cho admin
        ...(dataUser?.isAdmin === true ? [
            { 
                type: 'divider' 
            },
            { 
                key: 'admin', 
                label: (
                    <div className="flex items-center space-x-2 py-1">
                        <CrownOutlined className="text-[#ed1d24]" />
                        <span>Trang Admin</span>
                    </div>
                ), 
                onClick: () => navigateUser('/admin') 
            },
        ] : []),
        { 
            type: 'divider' 
        },
        { 
            key: 'logout', 
            label: (
                <div className="flex items-center space-x-2 py-1 text-red-600">
                    <span>Đăng xuất</span>
                </div>
            ), 
            onClick: handleLogout,
            danger: true
        },
    ];

    return (
        <div 
            className="bg-gradient-to-r from-[#ed1d24] to-[#c41e3a] text-white fixed top-0 left-0 right-0 z-50 shadow-lg border-b border-red-800/20 transition-transform duration-300 ease-in-out"
            style={{
                transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
            }}
        >
            <div className="flex items-center justify-between h-16">
                {/* Logo Section - Sát mép trái */}
                <Link to="/" className="flex items-center group ml-2 sm:ml-4 lg:ml-6 flex-shrink-0">
                    <div className="flex items-center space-x-2 transition-transform duration-300 group-hover:scale-105">
                        <img 
                            className="h-12 object-contain drop-shadow-lg" 
                            src={logo} 
                            alt="logo"
                            style={{ width: 'auto', minWidth: '150px' }}
                        />
                    </div>
                </Link>

                {/* Right Section - Container cho search và navigation */}
                <div className="flex-1 flex items-center justify-end max-w-[calc(100%-200px)] pr-4 sm:pr-6 lg:pr-8">
                    {/* Phần thanh tìm kiếm */}
                    <div className="flex-1 max-w-lg mx-8">
                        <div className="relative search-container">
                            <div className="flex items-center bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    className="w-full px-4 py-2.5 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-sm"
                                    value={query}
                                    onChange={handleSearchInputChange}
                                    onFocus={() => query.trim() && setShowResults(true)}
                                />
                                <button className="px-4 py-2.5 bg-gradient-to-r from-[#ed1d24] to-[#c41e3a] hover:from-[#c41e3a] hover:to-[#ed1d24] transition-all duration-300 flex items-center justify-center">
                                    <Search className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Dropdown kết quả tìm kiếm */}
                            {showResults && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto mt-1">
                                    {isSearching ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                                            <span className="ml-2 text-gray-600">Đang tìm kiếm...</span>
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <>
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    Tìm thấy {searchResults.length} sản phẩm
                                                </span>
                                            </div>
                                            {searchResults.map((product) => (
                                                <div
                                                    key={product._id}
                                                    onClick={() => handleProductClick(product._id)}
                                                    className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                >
                                                    <img
                                                        src={`${import.meta.env.VITE_API_URL}/uploads/products/${
                                                            (() => {
                                                                const color = product.colors?.[0];
                                                                if (!color?.images) return '';
                                                                if (Array.isArray(color.images)) {
                                                                    return color.images[0] || '';
                                                                }
                                                                return color.images;
                                                            })()
                                                        }`}
                                                        alt={product.name}
                                                        className="w-12 h-12 object-cover rounded-lg mr-3"
                                                        onError={(e) => {
                                                            e.target.src =
                                                                'https://via.placeholder.com/48x48?text=No+Image';
                                                        }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                                            {product.name}
                                                        </h4>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <span className="text-sm font-bold text-red-600">
                                                                {formatPrice(
                                                                    product.priceAfterDiscount ?? product.price,
                                                                )}
                                                            </span>
                                                            {product.discount > 0 && (
                                                                <>
                                                                    <span className="text-xs text-gray-500 line-through">
                                                                        {formatPrice(product.price)}
                                                                    </span>
                                                                    <span className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                                                                        -{product.discount}%
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {searchResults.length > 5 && (
                                                <div className="p-3 text-center border-t border-gray-100">
                                                    <button
                                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                        onClick={() => {
                                                            navigate(`/search?q=${query}`);
                                                            setShowResults(false);
                                                        }}
                                                    >
                                                        Xem tất cả kết quả
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        query.trim() && (
                                            <div className="flex flex-col items-center justify-center py-8 px-4">
                                                <div className="text-gray-400 text-4xl mb-2">🔍</div>
                                                <p className="text-gray-500 text-sm text-center">
                                                    Không tìm thấy sản phẩm nào cho "{query}"
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        <Link to={'/'}>
                            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                                isActive('/') 
                                    ? 'bg-white/20 text-white shadow-md' 
                                    : 'hover:bg-white/10 text-white/90 hover:text-white'
                            }`}>
                                <Home className="w-5 h-5" />
                                <span className="text-sm font-medium hidden sm:inline">Trang chủ</span>
                            </div>
                        </Link>
                        <Link to={'/category'}>
                            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                                isActive('/category') 
                                    ? 'bg-white/20 text-white shadow-md' 
                                    : 'hover:bg-white/10 text-white/90 hover:text-white'
                            }`}>
                                <Package className="w-5 h-5" />
                                <span className="text-sm font-medium hidden sm:inline">Sản phẩm</span>
                            </div>
                        </Link>
                        {dataUser._id && (
                            <Link to={'/cart'}>
                                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 relative ${
                                    isActive('/cart') 
                                        ? 'bg-white/20 text-white shadow-md' 
                                        : 'hover:bg-white/10 text-white/90 hover:text-white'
                                }`}>
                                    <div className="relative">
                                        <ShoppingCart className="w-5 h-5" />
                                        {cartData.length > 0 && (
                                            <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg">
                                                {cartData.length}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium hidden sm:inline">Giỏ hàng</span>
                                </div>
                            </Link>
                        )}
                        {!dataUser._id ? (
                            <div className="flex items-center space-x-3">
                                <Link to={'/login'}>
                                    <div className="px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition-all duration-300">
                                        Đăng nhập
                                    </div>
                                </Link>
                                <Link to={'/register'}>
                                    <div className="px-4 py-2 bg-white text-[#ed1d24] text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-md hover:shadow-lg">
                                        Đăng ký
                                    </div>
                                </Link>
                            </div>
                        ) : (
                            <Dropdown
                                menu={{ items: userMenuItems }}
                                placement="bottomRight"
                                trigger={['hover']}
                                mouseEnterDelay={0.05}
                                mouseLeaveDelay={0.1}
                                dropdownRender={(menu) => (
                                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 mt-2 min-w-[220px] overflow-hidden">
                                        <div className="px-4 py-3 bg-gradient-to-r from-[#ed1d24] to-[#c41e3a] text-white">
                                            <p className="font-semibold text-sm">
                                                {dataUser.fullName || 'Người dùng'}
                                            </p>
                                            <p className="text-xs text-white/80 truncate mt-0.5">{dataUser.email}</p>
                                        </div>
                                        {menu}
                                    </div>
                                )}
                            >
                                <div className="flex items-center cursor-pointer gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300">
                                    <Avatar
                                        icon={<UserOutlined />}
                                        className="bg-white text-[#ed1d24] flex items-center justify-center border-2 border-white/30 shadow-md"
                                        size="default"
                                        src={dataUser.avatar ? `${import.meta.env.VITE_API_URL}/uploads/avatars/${dataUser.avatar}` : undefined}
                                    />
                                    <div className="hidden md:block">
                                        <span className="text-sm font-medium">{dataUser.fullName || 'Người dùng'}</span>
                                        <DownOutlined className="text-xs ml-1 opacity-70" />
                                    </div>
                                </div>
                            </Dropdown>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Header;
