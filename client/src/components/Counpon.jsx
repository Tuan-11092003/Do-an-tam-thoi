import { useEffect, useState } from 'react';
import { requestGetActiveCoupon } from '../config/CounponRequest';
import { Copy, Tag, Calendar, ShoppingBag } from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

function Counpon() {
    const [coupons, setCoupons] = useState([]);

    useEffect(() => {
        const fetchCoupons = async () => {
            // Server đã filter active coupons (startDate <= today <= endDate && quantity > 0)
            const res = await requestGetActiveCoupon();
            setCoupons(res.metadata || []);
        };
        fetchCoupons();
    }, []);

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success(`Đã sao chép mã ${code}`);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const CouponCard = ({ coupons }) => (
        <div className="group relative">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 hover:border-red-500">
                {/* Gradient Left Section with Discount */}
                <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-600 flex flex-col items-center justify-center px-4 py-4 relative min-w-[80px]">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10 text-white text-center">
                        <div className="text-2xl font-extrabold leading-tight mb-0.5 drop-shadow-lg">
                            {coupons.discount}%
                        </div>
                        <div className="text-xs font-medium opacity-90 uppercase tracking-wider">Giảm giá</div>
                    </div>
                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-0 h-0 border-l-[15px] border-l-transparent border-t-[15px] border-t-white/20"></div>
                    <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[15px] border-l-transparent border-b-[15px] border-b-white/20"></div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-3 bg-gradient-to-br from-white to-gray-50">
                    <div className="space-y-2.5">
                        {/* Coupon Name */}
                        <div className="flex items-start justify-between">
                            <h4 className="font-bold text-base text-gray-900 leading-tight flex-1">
                                {coupons.nameCoupon}
                            </h4>
                            <Tag className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                        </div>

                        {/* Condition */}
                        <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                            <ShoppingBag className="w-4 h-4 text-red-600" />
                            <span className="font-medium">
                                Đơn hàng từ <span className="text-red-600 font-bold">{formatPrice(coupons.minPrice)}</span>
                            </span>
                        </div>

                        {/* Code and Expiry */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                <span className="text-xs font-medium text-gray-600">Mã:</span>
                                <span className="text-sm font-bold text-gray-900 tracking-wider">{coupons.nameCoupon}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>HSD: <span className="font-semibold text-gray-700">{dayjs(coupons.endDate).format('DD/MM/YYYY')}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Copy Button */}
                    <div className="mt-3.5 pt-3 border-t border-gray-200">
                        {coupons.quantity > 0 ? (
                            <button
                                onClick={() => handleCopyCode(coupons.nameCoupon)}
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
    );

    return (
        <div className="w-[90%] mx-auto py-6 px-4">
            {/* Header Section */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center space-x-2.5 mb-2.5">
                    <div className="p-2 bg-red-100 rounded-full">
                        <Tag className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Mã Giảm Giá</h2>
                </div>
                <p className="text-gray-600 text-sm">Áp dụng mã giảm giá để tiết kiệm thêm khi mua sắm</p>
            </div>

            {/* Grid layout for multiple coupons */}
            {coupons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {coupons.map((coupon) => (
                        <CouponCard key={coupon._id} coupons={coupon} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <Tag className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Hiện chưa có mã giảm giá nào</p>
                </div>
            )}
        </div>
    );
}

export default Counpon;
