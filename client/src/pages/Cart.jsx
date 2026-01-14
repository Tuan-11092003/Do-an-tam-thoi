import { useEffect, useState, useRef, useMemo } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import {
    requestApplyCoupon,
    requestRemoveItemFromCart,
    requestUpdateCartQuantity,
    requestUpdateCartSelection,
} from '../config/CartRequest';
import { requestGetActiveCoupon } from '../config/CounponRequest';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Truck, Shield, Tag, X, Copy, Calendar, Home, ChevronRight } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { toast } from 'react-toastify';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

function Cart() {
    const location = useLocation();
    const { cartData, fetchCart, couponData } = useStore();
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const navigate = useNavigate();
    const hasProcessedBuyNow = useRef(false);

    // Đảm bảo cartData và couponData luôn là mảng
    const safeCartData = Array.isArray(cartData) ? cartData : [];
    const safeCouponData = Array.isArray(couponData) ? couponData : [];

    // Sắp xếp lại giỏ hàng: sản phẩm mới thêm vào giỏ sẽ lên đầu
    const [recentlyAddedItems, setRecentlyAddedItems] = useState([]);

    // Lấy danh sách sản phẩm mới thêm vào giỏ từ localStorage
    useEffect(() => {
        const loadRecentlyAdded = () => {
            const added = JSON.parse(localStorage.getItem('recentlyAddedToCart') || '[]');
            setRecentlyAddedItems(added);
        };
        
        loadRecentlyAdded();
        
        // Lắng nghe event khi có sản phẩm mới được thêm vào giỏ
        const handleProductAdded = (event) => {
            const itemId = String(event.detail.itemId || event.detail.productId);
            const isBuyNow = event.detail.buyNow || false;
            if (itemId) {
                setRecentlyAddedItems(prev => {
                    const prevStr = prev.map(id => String(id));
                    if (!prevStr.includes(itemId)) {
                        // Nếu là "Mua ngay", thêm vào đầu, ngược lại thêm vào đầu (mới nhất)
                        const updated = [itemId, ...prev];
                        localStorage.setItem('recentlyAddedToCart', JSON.stringify(updated));
                        return updated;
                    }
                    // Nếu đã có, di chuyển lên đầu (đặc biệt cho "Mua ngay")
                    const filtered = prev.filter(id => String(id) !== itemId);
                    const updated = [itemId, ...filtered];
                    localStorage.setItem('recentlyAddedToCart', JSON.stringify(updated));
                    return updated;
                });
            }
        };
        
        window.addEventListener('productAddedToCart', handleProductAdded);
        return () => {
            window.removeEventListener('productAddedToCart', handleProductAdded);
        };
    }, []);

    // Đồng bộ danh sách recentlyAdded với giỏ hàng thực tế
    useEffect(() => {
        if (safeCartData.length > 0 && recentlyAddedItems.length > 0) {
            const cartItemIds = safeCartData.map(item => String(item._id));
            const validRecentlyAdded = recentlyAddedItems.filter(id => 
                cartItemIds.includes(String(id))
            );
            
            if (validRecentlyAdded.length !== recentlyAddedItems.length) {
                localStorage.setItem('recentlyAddedToCart', JSON.stringify(validRecentlyAdded));
                setRecentlyAddedItems(validRecentlyAdded);
            }
        } else if (safeCartData.length === 0 && recentlyAddedItems.length > 0) {
            // Nếu giỏ hàng trống, xóa danh sách recentlyAdded
            localStorage.removeItem('recentlyAddedToCart');
            setRecentlyAddedItems([]);
        }
    }, [safeCartData]);

    // Sắp xếp giỏ hàng: sản phẩm mới thêm lên đầu
    const orderedCartData = useMemo(() => {
        if (recentlyAddedItems.length === 0) {
            // Nếu vào từ "Mua ngay", vẫn giữ logic cũ
            let result = [...safeCartData];
            if (location.state?.fromBuyNow && result.length > 0) {
                const targetId = location.state?.addedItemId
                    ? String(location.state.addedItemId)
                    : selectedItemIds.length > 0
                      ? String(selectedItemIds[0])
                      : null;

                if (targetId) {
                    const targetIndex = result.findIndex((item) => String(item._id) === targetId);
                    if (targetIndex > 0) {
                        const [targetItem] = result.splice(targetIndex, 1);
                        result = [targetItem, ...result];
                    }
                }
            }
            return result;
        }

        // Sắp xếp theo thứ tự mới thêm vào giỏ
        const recentlyAddedStr = recentlyAddedItems.map(id => String(id));
        const added = [];
        const notAdded = [];

        safeCartData.forEach(item => {
            const itemIdStr = String(item._id);
            if (recentlyAddedStr.includes(itemIdStr)) {
                added.push(item);
            } else {
                notAdded.push(item);
            }
        });

        // Sắp xếp added theo thứ tự trong recentlyAddedItems (mới nhất lên đầu)
        added.sort((a, b) => {
            const indexA = recentlyAddedStr.indexOf(String(a._id));
            const indexB = recentlyAddedStr.indexOf(String(b._id));
            return indexA - indexB;
        });

        return [...added, ...notAdded];
    }, [safeCartData, recentlyAddedItems, location.state, selectedItemIds]);

    // Fetch active coupons from server (server handles filtering)
    const fetchAvailableCoupons = async () => {
        try {
            const couponRes = await requestGetActiveCoupon();
            setAvailableCoupons(couponRes.metadata || []);
        } catch (error) {
            console.error('Error fetching available coupons:', error);
            setAvailableCoupons([]);
        }
    };

    // Load available coupons khi component mount
    useEffect(() => {
        fetchAvailableCoupons();
    }, []);

    // Nếu vào từ "Mua ngay", xử lý tick sản phẩm (chỉ chạy một lần)
    useEffect(() => {
        // Reset flag khi location.state thay đổi
        if (location.state?.fromBuyNow) {
            hasProcessedBuyNow.current = false;
        } else {
            hasProcessedBuyNow.current = false;
        }
    }, [location.state?.fromBuyNow]);

    // Xử lý tick sản phẩm khi vào từ "Mua ngay" (chỉ chạy một lần)
    useEffect(() => {
        // Nếu có state từ navigation (từ "Mua ngay") và chưa xử lý
        if (location.state?.fromBuyNow && !hasProcessedBuyNow.current && safeCartData.length > 0) {
            hasProcessedBuyNow.current = true;
            
            // Load các sản phẩm đã được tick trong DB (sau khi requestUpdateCartSelection)
            const selectedFromDB = safeCartData
                .filter((item) => item.isSelected === true)
                .map((item) => String(item._id));
            
            if (selectedFromDB.length > 0) {
                setSelectedItemIds(selectedFromDB);
            } else if (location.state?.addedItemId) {
                // Nếu không tìm thấy trong DB, thử dùng addedItemId từ state
                const addedItemIdStr = String(location.state.addedItemId);
                const addedItem = safeCartData.find(
                    (item) => String(item._id) === addedItemIdStr
                );
                if (addedItem) {
                    setSelectedItemIds([String(addedItem._id)]);
                } else {
                    setSelectedItemIds([addedItemIdStr]);
                }
            }
        } else if (!location.state?.fromBuyNow && !hasProcessedBuyNow.current) {
            // Luôn bắt đầu với mảng rỗng - không tick sản phẩm nào
            setSelectedItemIds([]);
            hasProcessedBuyNow.current = true;
        }
    }, [location.state, safeCartData]); // Chạy khi location.state hoặc safeCartData thay đổi

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success(`Đã sao chép mã ${code}`);
    };

    // Calculate subtotal from server data (using subtotal field from each item)
    const calculateSubtotal = (products) => {
        if (!Array.isArray(products) || products.length === 0) return 0;
        return products.reduce((sum, product) => {
            // Use subtotal from server if available, otherwise fallback to priceAfterDiscount * quantity
            return sum + (product.subtotal ?? (product.priceAfterDiscount ?? product.price) * product.quantity);
        }, 0);
    };

    // Calculate coupon discount (preview only, server will calculate final when applied)
    const calculateCouponDiscount = (totalPrice, coupon) => {
        if (!coupon) return 0;
        return (totalPrice * coupon.discount) / 100;
    };

    // Calculate final total (preview only)
    const calculateFinalTotal = (products, coupon) => {
        const subtotal = calculateSubtotal(products);
        const couponDiscount = calculateCouponDiscount(subtotal, coupon);
        return subtotal - couponDiscount;
    };

    const syncSelectionToServer = async (ids) => {
        try {
            await requestUpdateCartSelection({ selectedItemIds: ids });
            await fetchCart();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể cập nhật sản phẩm được chọn');
        }
    };

    const handleToggleSelect = async (itemId) => {
        const itemIdStr = String(itemId);
        const isSelected = selectedItemIds.some((id) => String(id) === itemIdStr);
        const newSelected = isSelected
            ? selectedItemIds.filter((id) => String(id) !== itemIdStr)
            : [...selectedItemIds, itemIdStr];
        setSelectedItemIds(newSelected);
        await syncSelectionToServer(newSelected);
    };

    const handleBuyNowFromCart = async (itemId) => {
        const newSelected = [String(itemId)];
        setSelectedItemIds(newSelected);
        await syncSelectionToServer(newSelected);
        navigate('/checkout');
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Vui lòng nhập mã giảm giá');
            return;
        }

        setIsApplyingCoupon(true);
        try {
            await requestApplyCoupon({
                couponCode: couponCode.trim(),
            });

            // Tìm coupon trong danh sách available coupons
            const coupon = availableCoupons.find((c) => c.nameCoupon === couponCode.trim());
            if (!coupon) {
                // Nếu không tìm thấy trong danh sách, có thể mã hợp lệ nhưng không có trong danh sách hiển thị
                // Refresh cart và available coupons để lấy thông tin mới nhất từ server
                await fetchCart();
                await fetchAvailableCoupons();
                toast.success(`Áp dụng mã giảm giá ${couponCode.trim()} thành công!`);
                // Tìm lại coupon sau khi refresh (server đã filter active coupons)
                const refreshedCoupons = await requestGetActiveCoupon();
                const refreshedCoupon = (refreshedCoupons.metadata || []).find((c) => c.nameCoupon === couponCode.trim());
                if (refreshedCoupon) {
                    setSelectedCoupon(refreshedCoupon);
                } else {
                setSelectedCoupon({ nameCoupon: couponCode.trim() }); // Tạm thời set với tên mã
                }
                return;
            }

            // Server sẽ validate minPrice, không cần validate ở client
            setSelectedCoupon(coupon);
            toast.success(`Áp dụng mã giảm giá ${coupon.nameCoupon} thành công!`);
            // Refresh cart để cập nhật thông tin coupon
            await fetchCart();
            // Refresh available coupons
            await fetchAvailableCoupons();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = async () => {
        setSelectedCoupon(null);
        setCouponCode('');
        // Refresh cart để xóa coupon
        await fetchCart();
        toast.info('Đã xóa mã giảm giá');
    };

    const handleQuantityChange = async (index, change) => {
        try {
            const data = {
                itemId: orderedCartData[index]._id,
                quantity: orderedCartData[index].quantity + change,
            };
            await requestUpdateCartQuantity(data);
            await fetchCart();
            // Refresh available coupons sau khi cập nhật số lượng
            await fetchAvailableCoupons();
        } catch (error) {
            toast.error(error.response.data.message);
        }
    };

    const handleRemoveItem = async (index) => {
        if (!orderedCartData || orderedCartData.length === 0) return;

        try {
            const itemId = String(orderedCartData[index]._id);
            const data = {
                itemId: itemId,
            };
            await requestRemoveItemFromCart(data);
            
            // Xóa itemId khỏi danh sách recentlyAdded
            const recentlyAdded = JSON.parse(localStorage.getItem('recentlyAddedToCart') || '[]');
            const filtered = recentlyAdded.filter(id => String(id) !== itemId);
            localStorage.setItem('recentlyAddedToCart', JSON.stringify(filtered));
            setRecentlyAddedItems(filtered);
            
            await fetchCart();
            // Refresh available coupons sau khi xóa item
            await fetchAvailableCoupons();
        } catch (error) {
            toast.error(error.response.data.message);
        }
    };

    // if (isLoading) {
    //     return (
    //         <div className="min-h-screen bg-gray-50">
    //             <Header />
    //             <div className="flex items-center justify-center min-h-[60vh]">
    //                 <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
    //             </div>
    //             <Footer />
    //         </div>
    //     );
    // }

    // Kiểm tra cartData - nếu là null/undefined hoặc mảng rỗng thì hiển thị giỏ hàng trống
    if (!safeCartData || safeCartData.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                    {/* Breadcrumb Navigation */}
                    <nav className="mb-6" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-2 text-sm text-gray-600">
                            <li>
                                <Link 
                                    to="/" 
                                    className="flex items-center hover:text-red-600 transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-1" />
                                    Trang chủ
                                </Link>
                            </li>
                            <li>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </li>
                            <li className="text-gray-900 font-medium">
                                Giỏ hàng
                            </li>
                        </ol>
                    </nav>

                    <div className="text-center py-16">
                        <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Giỏ hàng trống</h2>
                        <p className="text-gray-600 mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                        <Link to="/">
                        <button className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                            Tiếp tục mua sắm
                        </button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Các sản phẩm đang được chọn để tính tiền
    const selectedProducts = orderedCartData.filter((item) =>
        selectedItemIds.some((id) => String(id) === String(item._id))
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Breadcrumb Navigation */}
                <nav className="mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 text-sm text-gray-600">
                        <li>
                            <Link 
                                to="/" 
                                className="flex items-center hover:text-red-600 transition-colors"
                            >
                                <Home className="w-4 h-4 mr-1" />
                                Trang chủ
                            </Link>
                        </li>
                        <li>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </li>
                        <li className="text-gray-900 font-medium">
                            Giỏ hàng
                        </li>
                    </ol>
                </nav>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
                    <p className="text-gray-600 text-sm mt-1">{orderedCartData.length} sản phẩm trong giỏ hàng</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Sản phẩm</h2>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {orderedCartData.map((product, index) => (
                                    <div key={`${product._id}-${index}`} className="p-4">
                                        <div className="flex items-center space-x-4">
                                            {/* Checkbox chọn sản phẩm */}
                                            <input
                                                type="checkbox"
                                                checked={selectedItemIds.some((id) => String(id) === String(product._id))}
                                                onChange={() => handleToggleSelect(product._id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                            />
                                            {/* Product Image & Info - Clickable */}
                                            <Link 
                                                to={`/product/${
                                                    (() => {
                                                        // Lấy productId - có thể là string hoặc object
                                                        let productId = product.productId;
                                                        
                                                        // Nếu productId là object, lấy _id
                                                        if (productId && typeof productId === 'object') {
                                                            productId = productId._id || productId.toString();
                                                        }
                                                        
                                                        // Nếu không có productId, thử lấy từ _id
                                                        if (!productId) {
                                                            productId = product._id;
                                                        }
                                                        
                                                        // Đảm bảo là string và không phải [object Object]
                                                        const idString = String(productId);
                                                        if (idString === '[object Object]' || idString === 'null' || idString === 'undefined') {
                                                            console.error('Invalid productId:', product);
                                                            return '';
                                                        }
                                                        
                                                        return idString;
                                                    })()
                                                }`}
                                                className="flex items-center space-x-4 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                                            >
                                                {/* Product Image */}
                                                <div className="flex-shrink-0">
                                                    {(() => {
                                                        let imageUrl = '';
                                                        if (product.image) {
                                                            if (Array.isArray(product.image)) {
                                                                imageUrl = product.image[0] || '';
                                                            } else {
                                                                imageUrl = product.image;
                                                            }
                                                        }
                                                        
                                                        if (!imageUrl) {
                                                            return (
                                                                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                                                    <span className="text-xs text-gray-400">No image</span>
                                                                </div>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <img
                                                                src={`${import.meta.env.VITE_API_URL}/uploads/products/${imageUrl}`}
                                                                alt={product.name}
                                                                className="w-20 h-20 object-cover rounded-lg"
                                                                onError={(e) => {
                                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="10"%3ENo image%3C/text%3E%3C/svg%3E';
                                                                }}
                                                            />
                                                        );
                                                    })()}
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium text-gray-900 truncate hover:text-red-600 transition-colors">
                                                        {product.name}
                                                    </h3>
                                                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                                                        <span>Màu: {product.color}</span>
                                                        <span>Size: {product.size}</span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-sm font-semibold text-red-600">
                                                                {formatPrice(
                                                                    product.priceAfterDiscount ?? product.price,
                                                                )}
                                                            </span>
                                                            {product.discount > 0 && (
                                                                <>
                                                                    <span className="text-xs text-gray-500 line-through">
                                                                        {formatPrice(product.price)}
                                                                    </span>
                                                                    <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs font-medium">
                                                                        -{product.discount}%
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleQuantityChange(index, -1)}
                                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">
                                                    {product.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleQuantityChange(index, 1)}
                                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Total Price + Buy now */}
                                            <div className="text-right space-y-2" onClick={(e) => e.stopPropagation()}>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {formatPrice(
                                                        product.subtotal ?? ((product.priceAfterDiscount ?? product.price) * product.quantity),
                                                    )}
                                                </div>
                                                <button
                                                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                                                    onClick={() => handleBuyNowFromCart(product._id)}
                                                >
                                                    Mua ngay
                                                </button>
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveItem(index);
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Coupon Section - Luôn hiển thị khi có sản phẩm trong giỏ hàng */}
                        {safeCartData.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Tag className="w-5 h-5 mr-2 text-red-600" />
                                    Mã giảm giá
                                </h2>

                                {!selectedCoupon ? (
                                    <div className="space-y-4">
                                        {/* Khuyến mãi dành cho bạn - UI giống trang chủ (Counpon) */}
                                        {availableCoupons.length > 0 && (
                                            <div className="w-full">
                                                <p className="text-sm font-semibold text-gray-900 mb-4">
                                                    Khuyến mãi dành cho bạn
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                                    {availableCoupons.map((coupon) => (
                                                        <div key={coupon._id} className="group relative">
                                                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 hover:border-red-500">
                                                                {/* Gradient Top Section with Discount */}
                                                                <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-600 flex flex-col items-center justify-center px-5 py-6 relative w-full">
                                                                    <div className="absolute inset-0 bg-black/10"></div>
                                                                    <div className="relative z-10 text-white text-center">
                                                                        <div className="text-3xl font-extrabold leading-tight mb-1 drop-shadow-lg">
                                                                            {coupon.discount}%
                                                                        </div>
                                                                        <div className="text-xs font-medium opacity-90 uppercase tracking-wider">Giảm giá</div>
                                                                    </div>
                                                            </div>

                                                                {/* Main Content */}
                                                                <div className="p-4 bg-gradient-to-br from-white to-gray-50">
                                                                    <div className="space-y-2.5">
                                                                        {/* Coupon Name */}
                                                                        <div className="flex items-start justify-between">
                                                                            <h4 className="font-bold text-base text-gray-900 leading-tight flex-1">
                                                                                {coupon.nameCoupon}
                                                                            </h4>
                                                                            <Tag className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                                                                        </div>

                                                                        {/* Condition */}
                                                                        <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                                                                            <ShoppingBag className="w-4 h-4 text-red-600" />
                                                                            <span className="font-medium">
                                                                                Đơn hàng từ <span className="text-red-600 font-bold">{formatPrice(coupon.minPrice)}</span>
                                                                            </span>
                                                                        </div>

                                                                        {/* Code and Expiry */}
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                                                                <span className="text-xs font-medium text-gray-600">Mã:</span>
                                                                                <span className="text-sm font-bold text-gray-900 tracking-wider">{coupon.nameCoupon}</span>
                                                                            </div>
                                                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                                                <Calendar className="w-3.5 h-3.5" />
                                                                                <span>HSD: <span className="font-semibold text-gray-700">{dayjs(coupon.endDate).format('DD/MM/YYYY')}</span></span>
                                                                            </div>
                                                                    </div>
                                                                </div>

                                                                    {/* Copy Button */}
                                                                    <div className="mt-3.5 pt-3 border-t border-gray-200">
                                                                    {coupon.quantity > 0 ? (
                                                                        <button
                                                                            type="button"
                                                                                onClick={() => handleCopyCode(coupon.nameCoupon)}
                                                                                className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                                                                        >
                                                                                <Copy className="w-4 h-4" />
                                                                                <span>Sao chép mã</span>
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            disabled
                                                                                className="w-full bg-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed opacity-60"
                                                                        >
                                                                                Đã hết lượt
                                                                        </button>
                                                                    )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <Tag className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-green-900">
                                                {selectedCoupon.nameCoupon}
                                            </div>
                                            <div className="text-sm text-green-600">
                                                Giảm {selectedCoupon.discount}% - Tiết kiệm{' '}
                                                {formatPrice(
                                                    calculateCouponDiscount(
                                                    calculateSubtotal(safeCartData),
                                                        selectedCoupon,
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRemoveCoupon}
                                        className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

                            {/* Price Breakdown */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Tạm tính ({selectedProducts.length} sản phẩm đã chọn)
                                    </span>
                                    <span className="font-medium">
                                        {formatPrice(calculateSubtotal(selectedProducts))}
                                    </span>
                                </div>

                                {selectedCoupon && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Giảm giá ({selectedCoupon.nameCoupon})</span>
                                        <span className="font-medium text-green-600">
                                            -
                                            {formatPrice(
                                                calculateCouponDiscount(
                                                    calculateSubtotal(selectedProducts),
                                                    selectedCoupon,
                                                ),
                                            )}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Phí vận chuyển</span>
                                    <span className="font-medium text-green-600">Miễn phí</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between text-base font-semibold">
                                        <span>Tổng cộng</span>
                                        <span className="text-red-600">
                                            {formatPrice(calculateFinalTotal(selectedProducts, selectedCoupon))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Checkout Button */}
                            <Link to={selectedProducts.length > 0 ? '/checkout' : '#'}>
                                <button
                                    disabled={selectedProducts.length === 0}
                                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {selectedProducts.length > 0
                                        ? 'Tiến hành thanh toán'
                                        : 'Chọn sản phẩm để thanh toán'}
                                </button>
                            </Link>

                            {/* Security Features */}
                            <div className="space-y-3 text-xs text-gray-500">
                                <div className="flex items-center space-x-2">
                                    <Shield className="w-4 h-4" />
                                    <span>Thanh toán an toàn</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Truck className="w-4 h-4" />
                                    <span>Giao hàng nhanh chóng</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CreditCard className="w-4 h-4" />
                                    <span>Hỗ trợ nhiều phương thức thanh toán</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Continue Shopping */}
                <div className="mt-8 text-center">
                    <button className="text-red-600 hover:text-red-700 font-medium text-sm">← Tiếp tục mua sắm</button>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Cart;
