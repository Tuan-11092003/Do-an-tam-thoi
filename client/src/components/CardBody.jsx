import { ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { requestCreateFavourite } from '../config/FavouriteRequest';
import { toast } from 'react-toastify';
import { useStore } from '../hooks/useStore';
import { useState } from 'react';

function CardBody({ product, onOpenModal }) {
    // Use totalStock from server instead of calculating on client
    const sumStock = product?.totalStock ?? (product?.variants?.reduce((acc, curr) => acc + curr.stock, 0) || 0);
    const hasDiscount = product?.discount > 0;
    // Use priceAfterDiscount from server instead of calculating on client
    const finalPrice = product?.priceAfterDiscount ?? product?.price;
    const [isHovered, setIsHovered] = useState(false);

    const { dataUser } = useStore();

    // Format currency function (same as FlashSale)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    // Helper function to get first image from color (supports both array and string for backward compatibility)
    const getFirstImage = (color) => {
        if (!color?.images) return '';
        if (Array.isArray(color.images)) {
            return color.images[0] || '';
        }
        return color.images;
    };

    // Helper function to get hover image (second image of first color, or first image of second color)
    const getHoverImage = () => {
        const firstColor = product?.colors?.[0];
        const secondColor = product?.colors?.[1];

        // If first color has multiple images, return second image
        if (firstColor?.images && Array.isArray(firstColor.images) && firstColor.images.length > 1) {
            return firstColor.images[1];
        }

        // If there's a second color, return its first image
        if (secondColor) {
            return getFirstImage(secondColor);
        }

        // Fallback to first image
        return getFirstImage(firstColor);
    };

    const defaultImage = getFirstImage(product?.colors?.[0]);
    const hoverImage = getHoverImage();
    const displayImage = isHovered && hoverImage ? hoverImage : defaultImage;

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

        // Tính giá sau giảm (nếu có discount)
        const discountPrice = product?.priceAfterDiscount ?? product?.price;
        
        // Mở modal với product data
        if (onOpenModal) {
            onOpenModal(product, discountPrice);
        }
    };

    return (
        <Link 
            to={`/product/${product?._id}`}
            className="w-full relative group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 block cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Product Image Container */}
            <div className="relative overflow-hidden">
                <img
                    src={`${import.meta.env.VITE_URL_IMAGE}/uploads/products/${displayImage}`}
                    alt={product?.name}
                    className={`w-full h-full object-cover transition-all duration-500 ${
                        isHovered ? 'scale-110' : 'scale-100'
                    }`}
                />

                {/* Discount Badge */}
                {hasDiscount && (
                    <div className="absolute top-3 left-3 z-10">
                        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                            -{product?.discount}%
                        </div>
                    </div>
                )}

                {/* Featured Badge */}
                {product?.isFeatured && (
                    <div className="absolute top-3 right-3 z-10">
                        <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                            HOT
                        </div>
                    </div>
                )}

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

            {/* Product Info */}
            <div className="p-5">
                {/* Product Name */}
                <h3 className="font-semibold text-gray-900 text-base mb-3 line-clamp-2 leading-relaxed transition-colors duration-200 group-hover:text-red-600">
                    {product?.name}
                </h3>

                {/* Price Section */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        {hasDiscount && (
                            <span className="text-sm text-gray-500 line-through">
                                {formatCurrency(product?.price)}
                            </span>
                        )}
                        <span className="text-lg font-bold text-red-600">
                            {formatCurrency(finalPrice)}
                        </span>
                    </div>

                    {/* Rating and Sold Status */}
                    <div className="flex items-center justify-between">
                        {/* Rating - Left aligned */}
                        <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-md">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-semibold text-gray-800">
                                {product?.averageRating ? product.averageRating.toFixed(1) : '0.0'}
                            </span>
                        </div>

                        {/* Sold Count - Right aligned */}
                        <span className="text-sm text-gray-600">
                            Đã bán {product?.totalSold || 0}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default CardBody;
