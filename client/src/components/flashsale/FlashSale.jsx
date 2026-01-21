import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useEffect, useState, useMemo } from 'react';
import { requestGetFlashSaleByDate } from '../../services/flashSale/flashSaleService';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { toast } from 'react-toastify';
import ProductQuickAddModal from '../product/ProductQuickAddModal';

// Hàm helper để lấy ảnh đầu tiên từ color
const getFirstImage = (color) => {
    if (!color?.images) return '';
    if (Array.isArray(color.images)) {
        return color.images[0] || '';
    }
    return color.images;
};

// Hàm helper để lấy ảnh khi hover
const getHoverImage = (product) => {
    const firstColor = product?.colors?.[0];
    const secondColor = product?.colors?.[1];

    // Nếu color đầu có nhiều ảnh, trả về ảnh thứ 2
    if (firstColor?.images && Array.isArray(firstColor.images) && firstColor.images.length > 1) {
        return firstColor.images[1];
    }

    // Nếu có color thứ 2, trả về ảnh đầu tiên của color đó
    if (secondColor) {
        return getFirstImage(secondColor);
    }

    // Fallback về ảnh đầu tiên
    return getFirstImage(firstColor);
};

// Component Product Card với hiệu ứng hover
const ProductCard = ({ sale, product, discountPrice, formatCurrency, onOpenModal }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { dataUser } = useStore();
    const defaultImage = useMemo(() => getFirstImage(product?.colors?.[0]), [product?.colors]);
    const hoverImage = useMemo(() => getHoverImage(product), [product]);
    
    // Chỉ đổi ảnh nếu hoverImage tồn tại và khác với defaultImage
    const shouldChangeImage = hoverImage && hoverImage !== defaultImage;
    const displayImage = isHovered && shouldChangeImage ? hoverImage : defaultImage;

    const sumStock = product?.totalStock ?? (product?.variants?.reduce((acc, curr) => acc + curr.stock, 0) || 0);

    const handleOpenModal = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!dataUser?._id) {
            toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
            return;
        }

        if (sumStock === 0) {
            toast.error('Sản phẩm đã hết hàng');
            return;
        }

        // Mở modal với product data
        onOpenModal(product);
    };

    return (
        <div className="px-2" key={sale._id}>
            <Link 
                to={`/product/${product?._id || '#'}`}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group block"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Ảnh sản phẩm */}
                <div className="relative overflow-hidden">
                    <img
                        src={`${import.meta.env.VITE_URL_IMAGE}/uploads/products/${displayImage}`}
                        alt={product?.name || 'Product'}
                        className={`w-full h-40 object-cover transition-all duration-500 ${
                            isHovered ? 'scale-110' : 'scale-100'
                        }`}
                        onError={(e) => {
                            // Sử dụng SVG placeholder đơn giản thay vì base64 dài
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160"%3E%3Crect width="160" height="160" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                    />

                    {/* Badge giảm giá */}
                    <div className="absolute top-1.5 left-1.5 z-10">
                        <div className="bg-yellow-400 text-red-800 px-1.5 py-0.5 rounded-full text-xs font-bold flex items-center">
                            <span className="mr-0.5">🔥</span>-{sale.discount}%
                        </div>
                    </div>

                    {/* Badge Flash Sale */}
                    <div className="absolute top-1.5 right-1.5 z-10">
                        <div className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                            FLASH SALE
                        </div>
                    </div>

                    {/* Nút thêm vào giỏ */}
                    {sumStock > 0 && (
                        <div className="absolute bottom-2 right-2 z-10">
                            <button
                                onClick={handleOpenModal}
                                className="group/btn relative bg-sky-400 hover:bg-sky-500 text-white rounded-lg px-3 py-2 shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                <span className="hidden group-hover/btn:inline-block text-xs font-medium whitespace-nowrap">
                                    Thêm vào giỏ
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Thông tin sản phẩm */}
                <div className="p-3 text-gray-800">
                    {/* Tên sản phẩm */}
                    <h3 className="font-semibold text-sm mb-1.5 line-clamp-2 min-h-[2.5rem]">
                        {product?.name || 'N/A'}
                    </h3>

                    {/* Màu sắc có sẵn */}
                    {product?.colors && product.colors.length > 0 && (
                        <div className="flex items-center mb-1.5">
                            <span className="text-sm text-gray-500 mr-1.5">Màu:</span>
                            <div className="flex items-center space-x-1">
                                {product.colors.slice(0, 2).map((color, index) => (
                                    <span key={color?._id || index} className="text-sm text-gray-500">
                                        {color?.name || 'N/A'}
                                    </span>
                                ))}
                                {product.colors.length > 2 && (
                                    <span className="text-sm text-gray-500">+{product.colors.length - 2}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Giá */}
                    {product?.price && (
                        <div className="mb-2">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 line-through">
                                    {formatCurrency(product.price)}
                                </span>
                                <span className="text-lg font-bold text-red-600">
                                    {formatCurrency(discountPrice)}
                                </span>
                            </div>
                            <div className="text-sm text-green-600 font-medium">
                                Tiết kiệm {formatCurrency(product.price - discountPrice)}
                            </div>
                        </div>
                    )}

                    {/* Đánh giá và số lượng đã bán */}
                    <div className="flex items-center justify-between mt-2">
                        {/* Đánh giá - Căn trái */}
                        <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-md">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-semibold text-gray-800">
                                {product?.averageRating ? product.averageRating.toFixed(1) : '0.0'}
                            </span>
                        </div>

                        {/* Số lượng đã bán - Căn phải */}
                        <span className="text-sm text-gray-600">
                            Đã bán {product?.totalSold || 0}
                        </span>
                    </div>
                </div>
            </Link>
        </div>
    );
};

function FlashSale() {
    const [flashSale, setFlashSale] = useState([]);
    const [currentEndDate, setCurrentEndDate] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedDiscountPrice, setSelectedDiscountPrice] = useState(null);

    useEffect(() => {
        const fetchFlashSale = async () => {
            try {
                const res = await requestGetFlashSaleByDate();
                const sales = res?.metadata || [];
                setFlashSale(sales);
                
                // Server đã filter active flash sales, chỉ cần tìm ngày hết hạn gần nhất
                if (sales.length > 0) {
                    // Sắp xếp theo ngày hết hạn tăng dần và lấy ngày gần nhất
                    const sortedSales = [...sales].sort((a, b) => {
                        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
                    });
                    setCurrentEndDate(sortedSales[0].endDate);
                }
            } catch (error) {
                console.error('Lỗi khi tải flash sale:', error);
                setFlashSale([]);
            }
        };
        fetchFlashSale();
    }, []);

    // Hàm tìm ngày hết hạn gần nhất từ danh sách flashSale
    // Server đã filter active flash sales, chỉ cần sort và lấy ngày gần nhất
    const findNearestEndDate = (sales) => {
        if (sales.length === 0) return null;
        
        // Sắp xếp theo ngày hết hạn tăng dần
        const sortedSales = [...sales].sort((a, b) => {
            return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        });
        return sortedSales[0].endDate;
    };

    // Cập nhật currentEndDate khi flashSale thay đổi
    useEffect(() => {
        if (flashSale.length > 0) {
            const nearestDate = findNearestEndDate(flashSale);
            if (nearestDate && (!currentEndDate || new Date(nearestDate).getTime() !== new Date(currentEndDate).getTime())) {
                setCurrentEndDate(nearestDate);
            }
        }
    }, [flashSale]);

    // Countdown timer cho ngày hết hạn gần nhất
    useEffect(() => {
        if (!currentEndDate) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const endTime = new Date(currentEndDate).getTime();
                const distance = endTime - now;

                if (distance > 0) {
                setTimeLeft({
                        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                        seconds: Math.floor((distance % (1000 * 60)) / 1000),
                });
                } else {
                // Timer hết, refresh data từ server để lấy danh sách mới nhất
                const fetchFlashSale = async () => {
                    try {
                        const res = await requestGetFlashSaleByDate();
                        const sales = res?.metadata || [];
                        setFlashSale(sales);
                        if (sales.length > 0) {
                            const sortedSales = [...sales].sort((a, b) => {
                                return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
                            });
                            setCurrentEndDate(sortedSales[0].endDate);
                        } else {
                            setCurrentEndDate(null);
                        }
                    } catch (error) {
                        console.error('Lỗi khi refresh flash sale:', error);
                    }
                };
                fetchFlashSale();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [currentEndDate]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const handleOpenModal = (product, discountPrice) => {
        setSelectedProduct(product);
        setSelectedDiscountPrice(discountPrice);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
        setSelectedDiscountPrice(null);
    };

    // Sử dụng priceAfterDiscount từ server thay vì tính toán
    // Hàm này được giữ lại để tương thích ngược nhưng nên sử dụng product.priceAfterDiscount

    const sliderSettings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 5,
        slidesToScroll: 2,
        autoplay: true,
        autoplaySpeed: 4000,
        pauseOnHover: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 2,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                },
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                },
            },
        ],
    };

    return (
        <div className="bg-[#ed1d24] text-white py-6">
            <div className="w-[90%] mx-auto">
                {/* Phần header */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex items-center space-x-2">
                        <div className="text-yellow-300 text-xl">⚡</div>
                        <h2 className="text-lg md:text-xl font-bold">SẢN PHẨM SIÊU KHUYẾN MÃI</h2>
                    </div>
                    
                    {/* Bộ đếm ngược */}
                    {timeLeft && (
                        <div className="flex items-center space-x-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                            {timeLeft.days > 0 && (
                                <div className="bg-white text-red-600 px-3 py-1.5 rounded-lg font-bold text-sm min-w-[55px] text-center">
                                    {String(timeLeft.days).padStart(2, '0')} Ngày
                                </div>
                            )}
                            <div className="bg-white text-red-600 px-3 py-1.5 rounded-lg font-bold text-sm min-w-[55px] text-center">
                                {String(timeLeft.hours).padStart(2, '0')} Giờ
                            </div>
                            <div className="bg-white text-red-600 px-3 py-1.5 rounded-lg font-bold text-sm min-w-[55px] text-center">
                                {String(timeLeft.minutes).padStart(2, '0')} Phút
                            </div>
                            <div className="bg-white text-red-600 px-3 py-1.5 rounded-lg font-bold text-sm min-w-[55px] text-center">
                                {String(timeLeft.seconds).padStart(2, '0')} Giây
                            </div>
                        </div>
                    )}
                </div>

                {/* Slider sản phẩm */}
                <div className="mb-4">
                    <Slider {...sliderSettings}>
                        {flashSale
                            // Server đã filter active flash sales, chỉ cần check productId
                            .filter((sale) => sale.productId)
                            .map((sale) => {
                                const product = sale.productId;
                                if (!product) return null; // Bảo vệ thêm
                                // Sử dụng priceAfterDiscount từ server, fallback về tính toán nếu không có
                                const discountPrice = product.priceAfterDiscount ?? (product.price * (1 - (sale.discount || 0) / 100));

                                return (
                                    <ProductCard 
                                        key={sale._id}
                                        sale={sale}
                                        product={product}
                                        discountPrice={discountPrice}
                                        formatCurrency={formatCurrency}
                                        onOpenModal={(product) => handleOpenModal(product, discountPrice)}
                                    />
                                );
                        })}
                    </Slider>
                </div>
            </div>

            {/* Modal thêm vào giỏ hàng */}
            <ProductQuickAddModal
                product={selectedProduct}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                discountPrice={selectedDiscountPrice}
                formatCurrency={formatCurrency}
            />

            <style>{`
                .bg-red-700 .slick-dots {
                    bottom: -40px;
                }

                .bg-red-700 .slick-dots li button:before {
                    color: white;
                    font-size: 12px;
                    opacity: 0.5;
                }

                .bg-red-700 .slick-dots li.slick-active button:before {
                    color: white;
                    opacity: 1;
                }

                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}

export default FlashSale;

