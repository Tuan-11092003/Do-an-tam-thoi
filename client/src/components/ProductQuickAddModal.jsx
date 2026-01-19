import { useState, useEffect } from 'react';
import { X, Minus, Plus, Check } from 'lucide-react';
import { requestAddToCart } from '../config/CartRequest';
import { useStore } from '../hooks/useStore';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

// Hàm helper để lấy ảnh đầu tiên từ color
const getFirstImage = (color) => {
    if (!color?.images) return '';
    if (Array.isArray(color.images)) {
        return color.images[0] || '';
    }
    return color.images;
};

function ProductQuickAddModal({ product, isOpen, onClose, discountPrice, formatCurrency }) {
    const { fetchCart, dataUser } = useStore();
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState('');
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // Khởi tạo giá trị mặc định khi mở modal hoặc product thay đổi
    useEffect(() => {
        if (isOpen && product) {
            // Set màu đầu tiên
            if (product.colors && product.colors.length > 0) {
                const firstColor = product.colors[0];
                setSelectedColor(firstColor);
                const image = getFirstImage(firstColor);
                setMainImage(image);
            }

            // Set size đầu tiên còn hàng
            if (product.variants && product.variants.length > 0) {
                const availableSize = product.variants.find(variant => variant.stock > 0);
                setSelectedSize(availableSize || product.variants[0]);
            }

            setQuantity(1);
        }
    }, [isOpen, product]);

    // Cập nhật ảnh khi chọn màu
    useEffect(() => {
        if (selectedColor) {
            const image = getFirstImage(selectedColor);
            setMainImage(image);
        }
    }, [selectedColor]);

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        const image = getFirstImage(color);
        setMainImage(image);
    };

    const handleSizeSelect = (size) => {
        if (size && size.stock === 0) {
            toast.error('Size này đã hết hàng');
            return;
        }
        setSelectedSize(size);
        // Reset quantity nếu size mới có stock nhỏ hơn quantity hiện tại
        if (size && size.stock > 0 && quantity > size.stock) {
            setQuantity(1);
        }
    };

    const handleQuantityChange = (change) => {
        const newQuantity = quantity + change;
        const maxStock = selectedSize?.stock || 1;
        if (newQuantity >= 1 && newQuantity <= maxStock) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = async () => {
        if (!dataUser?._id) {
            toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
            onClose();
            return;
        }

        if (!selectedColor) {
            toast.error('Vui lòng chọn màu sắc');
            return;
        }

        if (!selectedSize) {
            toast.error('Vui lòng chọn kích thước');
            return;
        }

        if (selectedSize.stock === 0) {
            toast.error('Size đã hết hàng, vui lòng chọn size khác');
            return;
        }

        if (quantity > selectedSize.stock) {
            toast.error(`Số lượng vượt quá hàng có sẵn (${selectedSize.stock} sản phẩm)`);
            setQuantity(selectedSize.stock);
            return;
        }

        setIsAddingToCart(true);
        try {
            const response = await requestAddToCart({
                productId: product._id,
                quantity: quantity,
                size: selectedSize._id,
                color: selectedColor._id,
            });

            // Lấy itemId từ response
            const addedItemId = response?.metadata?.addedItemId;
            let finalAddedItemId = addedItemId;
            if (!finalAddedItemId && response?.metadata?.cart?.products) {
                const products = response.metadata.cart.products;
                const lastProduct = products[products.length - 1];
                if (lastProduct && lastProduct._id) {
                    finalAddedItemId = lastProduct._id.toString();
                }
            }

            fetchCart();

            // Lưu vào localStorage để sắp xếp trong giỏ hàng
            if (finalAddedItemId) {
                const itemIdStr = String(finalAddedItemId);
                const recentlyAdded = JSON.parse(localStorage.getItem('recentlyAddedToCart') || '[]');
                const recentlyAddedStr = recentlyAdded.map(id => String(id));

                if (!recentlyAddedStr.includes(itemIdStr)) {
                    recentlyAdded.unshift(finalAddedItemId);
                } else {
                    const filtered = recentlyAdded.filter(id => String(id) !== itemIdStr);
                    filtered.unshift(finalAddedItemId);
                    recentlyAdded.length = 0;
                    recentlyAdded.push(...filtered);
                }
                localStorage.setItem('recentlyAddedToCart', JSON.stringify(recentlyAdded));

                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('productAddedToCart', {
                    detail: { itemId: finalAddedItemId, productId: product._id }
                }));
            }

            toast.success('Đã thêm vào giỏ hàng');
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng');
        } finally {
            setIsAddingToCart(false);
        }
    };

    if (!isOpen || !product) return null;

    // Tính tổng stock
    const totalStock = product.totalStock ?? (product.variants?.reduce((acc, curr) => acc + curr.stock, 0) || 0);
    const isInStock = totalStock > 0;

    // Giá hiển thị (ưu tiên discountPrice từ props, sau đó priceAfterDiscount, cuối cùng tính toán)
    const displayPrice = discountPrice ?? (product.priceAfterDiscount ?? product.price);
    const originalPrice = product.price;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-y-auto">
                {/* Header với nút đóng */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                    <h2 className="text-lg font-semibold text-gray-900">Thêm vào giỏ hàng</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Ảnh sản phẩm */}
                        <div className="md:w-2/5 flex-shrink-0">
                            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                    src={`${import.meta.env.VITE_URL_IMAGE}/uploads/products/${mainImage}`}
                                    alt={product.name || 'Product'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Thông tin sản phẩm */}
                        <div className="md:w-3/5 space-y-4">
                            {/* Tên sản phẩm */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                    {product.name || 'N/A'}
                                </h3>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm text-gray-500">SKU: {product.sku || 'Đang cập nhật'}</span>
                                    {isInStock ? (
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                            Còn hàng
                                        </span>
                                    ) : (
                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                            Hết hàng
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Giá */}
                            <div>
                                <div className="flex items-center space-x-3 mb-1">
                                    <span className="text-2xl font-bold text-red-600">
                                        {formatCurrency(displayPrice)}
                                    </span>
                                    {originalPrice > displayPrice && (
                                        <>
                                            <span className="text-lg text-gray-500 line-through">
                                                {formatCurrency(originalPrice)}
                                            </span>
                                            {product.discount > 0 && (
                                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                                    -{product.discount}%
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Kiểu dáng */}
                            {product.style && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Kiểu dáng</h4>
                                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                                        {product.style}
                                    </button>
                                </div>
                            )}

                            {/* Chọn màu */}
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Màu sắc</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {product.colors.map((color) => (
                                            <button
                                                key={color._id}
                                                onClick={() => handleColorSelect(color)}
                                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all ${
                                                    selectedColor?._id === color._id
                                                        ? 'border-red-500 bg-red-50 text-red-700'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                                }`}
                                            >
                                                <span className="text-sm font-medium">{color.name}</span>
                                                {selectedColor?._id === color._id && <Check className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Chọn size */}
                            {product.variants && product.variants.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Kích thước</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variants.map((variant) => (
                                            <button
                                                key={variant._id}
                                                onClick={() => handleSizeSelect(variant)}
                                                disabled={variant.stock === 0}
                                                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                                                    selectedSize?._id === variant._id
                                                        ? 'border-red-500 bg-red-50 text-red-700'
                                                        : variant.stock === 0
                                                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                                }`}
                                            >
                                                <span className="text-sm font-medium">{variant.size}</span>
                                                {variant.stock === 0 && (
                                                    <span className="text-xs block text-red-500 mt-0.5">Hết hàng</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Số lượng */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Số lượng</h4>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => handleQuantityChange(-1)}
                                            disabled={quantity <= 1}
                                            className="px-4 py-2.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center border-r border-gray-300"
                                        >
                                            <Minus className="w-4 h-4 text-gray-700" />
                                        </button>
                                        <div className="w-16 px-3 py-2.5 text-center text-base font-semibold text-gray-900 bg-white border-x border-gray-300">
                                            {quantity}
                                        </div>
                                        <button
                                            onClick={() => handleQuantityChange(1)}
                                            disabled={quantity >= (selectedSize?.stock || 1)}
                                            className="px-4 py-2.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center border-l border-gray-300"
                                        >
                                            <Plus className="w-4 h-4 text-gray-700" />
                                        </button>
                                    </div>
                                    {selectedSize && (
                                        <span className="text-sm text-gray-500">
                                            Còn {selectedSize.stock} sản phẩm
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Nút thêm vào giỏ */}
                            <div className="pt-4 space-y-2">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isAddingToCart || !isInStock || !selectedColor || !selectedSize}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isAddingToCart ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Đang thêm...</span>
                                        </div>
                                    ) : (
                                        'Thêm vào giỏ'
                                    )}
                                </button>

                                {/* Link xem chi tiết */}
                                <Link
                                    to={`/product/${product._id}`}
                                    onClick={onClose}
                                    className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Xem chi tiết &gt;&gt;
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductQuickAddModal;

