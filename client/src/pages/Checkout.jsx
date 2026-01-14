import { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useStore } from '../hooks/useStore';
import { requestGetCart, requestUpdateInfoCart, requestApplyCoupon } from '../config/CartRequest';
import { requestGetActiveCoupon } from '../config/CounponRequest';
import { CreditCard, MapPin, Phone, User, Package, Tag, CheckCircle, Smartphone, Wallet, X } from 'lucide-react';
import { requestCreatePayment } from '../config/PaymentsRequest';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import momoLogo from '../assets/momo.png';
import vnpayLogo from '../assets/logovnpay.png';

function Checkout() {
    const { fetchCart, dataUser } = useStore();
    const [cartData, setCartData] = useState([]);
    const [couponData, setCouponData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
    });
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [couponCode, setCouponCode] = useState('');
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [momoLogoLoaded, setMomoLogoLoaded] = useState(true);
    const [vnpayLogoLoaded, setVnpayLogoLoaded] = useState(true);

    useEffect(() => {
        const fetchCartData = async () => {
            try {
                setIsLoading(true);

                // Kiểm tra user đã đăng nhập chưa trước khi gọi API yêu cầu auth
                const isLoggedIn = Cookies.get('logged') === '1';
                if (!isLoggedIn) {
                    // Nếu chưa đăng nhập, chỉ fetch coupons (không cần auth)
                    const fetchCoupons = async () => {
                        try {
                            const couponRes = await requestGetActiveCoupon();
                            return couponRes.metadata || [];
                        } catch (couponError) {
                            console.error('Error fetching coupons:', couponError);
                            return [];
                        }
                    };
                    const coupons = await fetchCoupons();
                    setCouponData(coupons);
                    setCartData([]);
                    setIsLoading(false);
                    return;
                }

                const fetchCoupons = async () => {
                    try {
                        const couponRes = await requestGetActiveCoupon();
                        return couponRes.metadata || [];
                    } catch (couponError) {
                        console.error('Error fetching coupons:', couponError);
                        return [];
                    }
                };

                try {
                    const res = await requestGetCart();
                    // Chỉ lấy các sản phẩm đã được tick (isSelected: true) để thanh toán
                    const selectedItems = (res.metadata.items || []).filter((item) => item.isSelected === true);
                    setCartData(selectedItems);

                    if (res.metadata.coupon && res.metadata.coupon.length > 0) {
                        setCouponData(res.metadata.coupon);
                    } else {
                        const coupons = await fetchCoupons();
                        setCouponData(coupons);
                    }
                } catch (cartError) {
                    // Chỉ log error nếu không phải lỗi 401/403 (unauthorized/forbidden)
                    const status = cartError.response?.status;
                    if (status !== 401 && status !== 403) {
                        console.error('Error fetching cart:', cartError);
                    }
                    setCartData([]);
                    const coupons = await fetchCoupons();
                    setCouponData(coupons);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                try {
                    const couponRes = await requestGetActiveCoupon();
                    setCouponData(couponRes.metadata || []);
                } catch (couponError) {
                    setCouponData([]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchCartData();
    }, []);

    // Prefill customer info from logged-in user profile
    useEffect(() => {
        if (!dataUser || Object.keys(dataUser).length === 0) return;

        // Some responses may wrap info under `user`, so handle both
        const prefillFullName = dataUser.fullName || dataUser.user?.fullName;
        const prefillPhone = dataUser.phone || dataUser.user?.phone;
        const prefillAddress = dataUser.address || dataUser.user?.address;

        setFormData((prev) => {
            const updated = { ...prev };
            let changed = false;

            // Tự động điền fullName nếu trống hoặc có giá trị mới từ dataUser
            if (prefillFullName && (!prev.fullName || prefillFullName !== prev.fullName)) {
                updated.fullName = prefillFullName;
                changed = true;
            }
            // Tự động điền phone nếu trống hoặc có giá trị mới từ dataUser
            if (prefillPhone && (!prev.phone || prefillPhone !== prev.phone)) {
                updated.phone = prefillPhone;
                changed = true;
            }
            // Tự động điền address: ưu tiên điền khi trống, hoặc cập nhật khi có giá trị mới từ dataUser
            if (prefillAddress && (!prev.address || prefillAddress !== prev.address)) {
                updated.address = prefillAddress;
                changed = true;
            }
            return changed ? updated : prev;
        });
    }, [dataUser]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    // Calculate subtotal from server data (using subtotal field from each item)
    const calculateSubtotal = () => {
        return cartData.reduce((sum, item) => {
            // Use subtotal from server if available, otherwise fallback to priceAfterDiscount * quantity
            return sum + (item.subtotal ?? ((item.priceAfterDiscount ?? item.price) * (item.quantity || 1)));
        }, 0);
    };

    // Calculate coupon discount (preview only, server will calculate final when applied)
    const calculateCouponDiscount = () => {
        // Chỉ tính giảm giá khi người dùng chủ động áp dụng coupon trong Checkout
        // Không tự động lấy coupon từ cart để tránh áp dụng coupon không mong muốn
        if (selectedCoupon) {
            const subtotal = calculateSubtotal();
            return (subtotal * selectedCoupon.discount) / 100;
        }
        return 0;
    };

    const calculateTotal = () => {
        return calculateSubtotal() - calculateCouponDiscount();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Vui lòng nhập mã giảm giá');
            return;
        }

        const coupon = couponData?.find((c) => c.nameCoupon === couponCode.trim());
        if (!coupon) {
            toast.error('Mã giảm giá không hợp lệ');
            return;
        }

        // Server sẽ validate minPrice, không cần validate ở client
        try {
            setIsApplyingCoupon(true);
            await requestApplyCoupon({
                couponCode: couponCode.trim(),
            });
            setSelectedCoupon(coupon);
            toast.success(`Áp dụng mã giảm giá ${coupon.nameCoupon} thành công!`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể áp dụng mã giảm giá');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setSelectedCoupon(null);
        setCouponCode('');
        toast.info('Đã xóa mã giảm giá');
    };

    const navigate = useNavigate();

    const handleSubmit = async () => {
        if (!formData.fullName || !formData.phone || !formData.address) {
            toast.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        const data = {
            fullName: formData.fullName,
            phone: formData.phone,
            address: formData.address,
        };

        try {
            // Thanh toán: cập nhật thông tin giỏ hàng rồi tạo payment từ Cart trong DB
            await requestUpdateInfoCart(data);
            
            // Gửi thông tin về coupon được chọn (nếu có)
            const paymentData = {
                paymentMethod,
                useCoupon: selectedCoupon !== null, // Chỉ áp dụng coupon nếu người dùng đã chọn trong checkout
            };
            
            if (paymentMethod === 'cod') {
                const res = await requestCreatePayment(paymentData);
                // Kiểm tra payment ID có tồn tại không
                if (!res?.metadata?._id) {
                    toast.error('Không thể tạo đơn hàng. Vui lòng thử lại.');
                    return;
                }
                // Sau khi thanh toán thành công, reload giỏ hàng trong global store
                await fetchCart();
                navigate(`/payment/success/${res.metadata._id}`);
            } else if (paymentMethod === 'momo') {
                const res = await requestCreatePayment(paymentData);
                // Kiểm tra response từ MoMo API
                // MoMo API trả về: { resultCode: 0, payUrl: "..." } khi thành công
                // Hoặc { resultCode: 1001, message: "..." } khi lỗi
                if (!res?.metadata) {
                    toast.error('Không thể tạo link thanh toán MoMo. Vui lòng thử lại.');
                    return;
                }
                
                // Kiểm tra resultCode từ MoMo
                if (res.metadata.resultCode !== 0) {
                    const errorMessage = res.metadata.message || 'Không thể tạo link thanh toán MoMo. Vui lòng thử lại.';
                    toast.error(errorMessage);
                    return;
                }
                
                // Kiểm tra payUrl
                if (!res.metadata.payUrl) {
                    toast.error('Không thể tạo link thanh toán MoMo. Vui lòng thử lại.');
                    return;
                }
                
                await fetchCart();
                window.location.href = res.metadata.payUrl;
            } else if (paymentMethod === 'vnpay') {
                const res = await requestCreatePayment(paymentData);
                if (!res?.metadata) {
                    toast.error('Không thể tạo link thanh toán VNPay. Vui lòng thử lại.');
                    return;
                }
                await fetchCart();
                window.location.href = res.metadata;
            } else if (paymentMethod === 'zalopay') {
                const res = await requestCreatePayment(paymentData);
                if (!res?.metadata) {
                    toast.error('Không thể tạo link thanh toán ZaloPay. Vui lòng thử lại.');
                    return;
                }
                
                // Kiểm tra order_url
                if (!res.metadata.order_url) {
                    toast.error('Không thể tạo link thanh toán ZaloPay. Vui lòng thử lại.');
                    return;
                }
                
                await fetchCart();
                window.location.href = res.metadata.order_url;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đặt hàng thất bại');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center min-h-[60vh] pt-24">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Thanh toán</h1>
                    <p className="text-gray-600 text-sm mt-1">Hoàn tất đơn hàng của bạn</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Customer Information Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Package className="w-5 h-5 mr-2 text-red-600" />
                                Sản phẩm đã chọn
                            </h2>

                            <div className="space-y-4">
                                {cartData.map((item, index) => (
                                    <div
                                        key={item._id}
                                        className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}/uploads/products/${
                                                Array.isArray(item.image) 
                                                    ? item.image[0] || '' 
                                                    : item.image || ''
                                            }`}
                                            alt={item.name}
                                            className="w-16 h-16 object-cover rounded-lg"
                                            onError={(e) => {
                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="10"%3ENo image%3C/text%3E%3C/svg%3E';
                                            }}
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                                            <div className="text-xs text-gray-500 mt-1">
                                                <span>Màu: {item.color}</span>
                                                <span className="mx-2">•</span>
                                                <span>Size: {item.size}</span>
                                                <span className="mx-2">•</span>
                                                <span>Số lượng: {item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {formatPrice(item.subtotal ?? (item.priceAfterDiscount * item.quantity))}
                                            </div>
                                            {item.discount > 0 && (
                                                <div className="text-xs text-gray-500 line-through">
                                                    {formatPrice(item.price * item.quantity)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2 text-red-600" />
                                Thông tin giao hàng
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Số điện thoại *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Địa chỉ giao hàng *
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Nhập địa chỉ giao hàng chi tiết"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <CreditCard className="w-5 h-5 mr-2 text-red-600" />
                                Phương thức thanh toán
                            </h2>

                            <div className="space-y-3">
                                <label className="flex items-center p-3 border-2 border-red-200 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="cod"
                                        className="mr-3"
                                        defaultChecked
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center">
                                            <MapPin className="w-5 h-5 mr-2 text-red-600" />
                                            <span className="font-medium text-red-800">
                                                Thanh toán khi nhận hàng (COD)
                                            </span>
                                        </div>
                                        <span className="text-xs text-red-600 font-medium">Khuyến nghị</span>
                                    </div>
                                </label>

                                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="momo"
                                        className="mr-3"
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center">
                                            {momoLogoLoaded ? (
                                                <img 
                                                    src={momoLogo} 
                                                    alt="MoMo" 
                                                    className="h-6 mr-2 object-contain"
                                                    style={{ width: 'auto', maxWidth: '80px' }}
                                                    onError={() => setMomoLogoLoaded(false)}
                                                />
                                            ) : (
                                                <Smartphone className="w-5 h-5 mr-2 text-pink-600" />
                                            )}
                                            <span className="font-medium">Ví điện tử MoMo</span>
                                        </div>
                                        <span className="text-xs text-gray-500">Nhanh chóng & An toàn</span>
                                    </div>
                                </label>

                                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="vnpay"
                                        className="mr-3"
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center">
                                            {vnpayLogoLoaded ? (
                                                <img 
                                                    src={vnpayLogo} 
                                                    alt="VNPay" 
                                                    className="h-6 mr-2 object-contain"
                                                    style={{ width: 'auto', maxWidth: '100px' }}
                                                    onError={() => setVnpayLogoLoaded(false)}
                                                />
                                            ) : (
                                                <Wallet className="w-5 h-5 mr-2 text-blue-600" />
                                            )}
                                            <span className="font-medium">VNPay</span>
                                        </div>
                                        <span className="text-xs text-gray-500">Đa dạng phương thức</span>
                                    </div>
                                </label>

                                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="zalopay"
                                        className="mr-3"
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center">
                                            <Wallet className="w-5 h-5 mr-2 text-blue-600" />
                                            <span className="font-medium">ZaloPay</span>
                                        </div>
                                        <span className="text-xs text-gray-500">App & QR Code</span>
                                    </div>
                                </label>

                                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="bank"
                                        className="mr-3"
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className="flex items-center">
                                        <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                                        <span className="font-medium">Chuyển khoản ngân hàng</span>
                                    </div>
                                </label>
                            </div>

                            {/* Payment Note */}
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start space-x-2">
                                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                                        <span className="text-blue-600 text-xs font-bold">i</span>
                                    </div>
                                    <div className="text-xs text-blue-800">
                                        <p className="font-medium mb-1">Lưu ý về thanh toán:</p>
                                        <ul className="space-y-1 text-blue-700">
                                            <li>
                                                • <strong>COD:</strong> Thanh toán bằng tiền mặt khi nhận hàng
                                            </li>
                                            <li>
                                                • <strong>MoMo:</strong> Thanh toán qua ứng dụng MoMo
                                            </li>
                                            <li>
                                                • <strong>VNPay:</strong> Hỗ trợ thẻ ATM, Internet Banking, QR Code
                                            </li>
                                            <li>
                                                • <strong>ZaloPay:</strong> Thanh toán qua ứng dụng ZaloPay hoặc QR Code
                                            </li>
                                            <li>
                                                • <strong>Chuyển khoản:</strong> Chuyển khoản trực tiếp vào tài khoản
                                                ngân hàng
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

                            {/* Price Breakdown */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tạm tính ({cartData.length} sản phẩm)</span>
                                    <span className="font-medium">{formatPrice(calculateSubtotal())}</span>
                                </div>

                                {calculateCouponDiscount() > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 flex items-center">
                                            <Tag className="w-4 h-4 mr-1" />
                                            Giảm giá
                                        </span>
                                        <span className="font-medium text-green-600">
                                            -{formatPrice(calculateCouponDiscount())}
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
                                        <span className="text-red-600">{formatPrice(calculateTotal())}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon Section – hiển thị trong Tóm tắt đơn hàng */}
                            <div className="mb-6 border-t border-gray-200 pt-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                    <Tag className="w-4 h-4 mr-2 text-red-600" />
                                    Mã giảm giá
                                </h3>

                                {!selectedCoupon ? (
                                    <div className="space-y-4">
                                        {/* Chọn mã có sẵn */}
                                        {couponData && couponData.length > 0 && (
                                            <div>
                                                <div className="flex">
                                                    <select
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                    >
                                                        <option value="">Chọn mã</option>
                                                        {couponData.map((coupon) => (
                                                            <option key={coupon._id} value={coupon.nameCoupon}>
                                                                {coupon.nameCoupon} - Giảm {coupon.discount}% (từ{' '}
                                                                {formatPrice(coupon.minPrice)})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {/* Nhập mã thủ công */}
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                placeholder="Nhập mã giảm giá"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={isApplyingCoupon || !couponCode.trim()}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isApplyingCoupon ? 'Đang áp dụng...' : 'Áp dụng'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                <Tag className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-green-900">
                                                    {selectedCoupon.nameCoupon}
                                                </div>
                                                <div className="text-xs text-green-600">
                                                    Giảm {selectedCoupon.discount}% - Tiết kiệm{' '}
                                                    {formatPrice(calculateCouponDiscount())}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRemoveCoupon}
                                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Place Order Button */}
                            <button
                                onClick={handleSubmit}
                                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors mb-4 flex items-center justify-center"
                            >
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Đặt hàng
                            </button>

                            {/* Security Features */}
                            <div className="space-y-3 text-xs text-gray-500">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Thanh toán an toàn</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Package className="w-4 h-4 text-green-500" />
                                    <span>Giao hàng nhanh chóng</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Phone className="w-4 h-4 text-green-500" />
                                    <span>Hỗ trợ 24/7</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Checkout;
