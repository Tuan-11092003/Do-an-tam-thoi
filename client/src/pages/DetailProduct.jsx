import { useNavigate, useParams, Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useEffect, useState } from 'react';
import { requestGetProductById } from '../config/ProductRequest';
import { ShoppingCart, Heart, Share2, Star, Minus, Plus, Check, ChevronRight, Home } from 'lucide-react';
import { requestAddToCart, requestUpdateCartSelection, requestGetCart } from '../config/CartRequest';
import { toast } from 'react-toastify';
import { useStore } from '../hooks/useStore';
import CardBody from '../components/CardBody';
import { requestCreateFavourite } from '../config/FavouriteRequest';

function DetailProduct() {
    const { id: idParam } = useParams();
    // Đảm bảo id luôn là string hợp lệ
    const id = idParam ? String(idParam) : null;
    const [product, setProduct] = useState({});
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState('');
    const [colorImages, setColorImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [productRelated, setProductRelated] = useState([]);
    const [activeTab, setActiveTab] = useState('description'); // 'description', 'policy', 'reviews'

    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);

    const { fetchCart, dataUser } = useStore();

    const fetchProductById = async () => {
        // Kiểm tra id hợp lệ trước khi fetch
        if (!id || id === 'null' || id === 'undefined' || id.includes('[object')) {
            console.error('Invalid product ID:', id);
            setIsLoading(false);
            return;
        }
        
        try {
            setIsLoading(true);
            const res = await requestGetProductById(id);
            setProduct(res.metadata);
            setReviews(res.metadata.previewProduct);
            setProductRelated(res.metadata.productRelated);
            // Set default selections
            if (res.metadata.colors && res.metadata.colors.length > 0) {
                const firstColor = res.metadata.colors[0];
                setSelectedColor(firstColor);
                const images = Array.isArray(firstColor.images) 
                    ? firstColor.images 
                    : firstColor.images 
                    ? [firstColor.images] 
                    : [];
                setColorImages(images);
                setMainImage(images[0] || '');
                setCurrentImageIndex(0);
            }
            if (res.metadata.variants && res.metadata.variants.length > 0) {
                // Tìm size đầu tiên còn hàng (stock > 0)
                const availableSize = res.metadata.variants.find(variant => variant.stock > 0);
                // Nếu có size còn hàng, chọn size đó; nếu không, chọn size đầu tiên
                setSelectedSize(availableSize || res.metadata.variants[0]);
            }

            // Set review data from user
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProductById();
    }, [id]);

    // Scroll to top when component mounts or product ID changes
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant',
        });
    }, [id]);

    // Scroll to top after data is loaded to ensure page starts at top
    useEffect(() => {
        if (!isLoading) {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'instant',
            });
        }
    }, [isLoading]);

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        const images = Array.isArray(color.images) 
            ? color.images 
            : color.images 
            ? [color.images] 
            : [];
        setColorImages(images);
        setMainImage(images[0] || '');
        setCurrentImageIndex(0);
    };

    const handleImageSelect = (index) => {
        setCurrentImageIndex(index);
        setMainImage(colorImages[index]);
    };

    const handlePrevImage = () => {
        if (currentImageIndex > 0) {
            const newIndex = currentImageIndex - 1;
            setCurrentImageIndex(newIndex);
            setMainImage(colorImages[newIndex]);
        }
    };

    const handleNextImage = () => {
        if (currentImageIndex < colorImages.length - 1) {
            const newIndex = currentImageIndex + 1;
            setCurrentImageIndex(newIndex);
            setMainImage(colorImages[newIndex]);
        }
    };

    const handleSizeSelect = (size) => {
        // Nếu size hết hàng, tự động chuyển sang size kế tiếp còn hàng
        if (size && size.stock === 0) {
            if (product.variants && product.variants.length > 0) {
                const availableSize = product.variants.find(variant => variant.stock > 0);
                if (availableSize) {
                    setSelectedSize(availableSize);
                    setQuantity(1);
                    toast.info(`Size ${size.size} đã hết hàng, đã chuyển sang size ${availableSize.size}`);
                    return;
                }
            }
            toast.error('Size này đã hết hàng');
            return;
        }
        
        setSelectedSize(size);
        // Reset quantity về 1 nếu size mới có stock nhỏ hơn quantity hiện tại
        if (size && size.stock > 0 && quantity > size.stock) {
            setQuantity(1);
        }
    };

    const handleQuantityChange = (change) => {
        const newQuantity = quantity + change;
        if (newQuantity >= 1 && newQuantity <= (selectedSize?.stock || 1)) {
            setQuantity(newQuantity);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    // Use priceAfterDiscount from server instead of calculating

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <div className="flex items-center space-x-1">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                {hasHalfStar && (
                    <div className="relative">
                        <Star className="w-4 h-4 text-gray-300" />
                        <Star
                            className="w-4 h-4 text-yellow-400 fill-current absolute top-0 left-0"
                            style={{ clipPath: 'inset(0 50% 0 0)' }}
                        />
                    </div>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
                ))}
            </div>
        );
    };

    const handleAddToFavourite = async () => {
        try {
            const data = {
                productId: product._id,
            };
            await requestCreateFavourite(data);
            fetchProductById();
            toast.success('Thêm vào yêu thích thành công');
        } catch (error) {
            fetchProductById();
            toast.error(error.response.data.message);
        }
    };

    const handleAddToCart = async () => {
        // Kiểm tra size có còn hàng không
        if (!selectedSize || selectedSize.stock === 0) {
            toast.error('Size đã hết hàng, vui lòng chọn size khác');
            // Tự động chuyển sang size kế tiếp còn hàng
            if (product.variants && product.variants.length > 0) {
                const availableSize = product.variants.find(variant => variant.stock > 0);
                if (availableSize) {
                    setSelectedSize(availableSize);
                    toast.info(`Đã chuyển sang size ${availableSize.size}`);
                    return;
                }
            }
            return;
        }
        
        // Kiểm tra số lượng không vượt quá stock
        if (quantity > selectedSize.stock) {
            toast.error(`Số lượng vượt quá hàng có sẵn (${selectedSize.stock} sản phẩm)`);
            setQuantity(selectedSize.stock);
            return;
        }

        try {
            const data = {
                productId: product._id,
                quantity: quantity,
                size: selectedSize,
                color: selectedColor,
            };
            await requestAddToCart(data);

            fetchCart();
            toast.success('Thêm vào giỏ hàng thành công');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng');
        }
    };

    const navigate = useNavigate();

    const handleBuyNow = async () => {
        // Validate selections
        if (!selectedColor) {
            toast.error('Vui lòng chọn màu sắc');
            return;
        }
        if (!selectedSize) {
            toast.error('Vui lòng chọn kích thước');
            return;
        }
        
        // Kiểm tra size có còn hàng không
        if (selectedSize.stock === 0) {
            toast.error('Size đã hết hàng, vui lòng chọn size khác');
            // Tự động chuyển sang size kế tiếp còn hàng
            if (product.variants && product.variants.length > 0) {
                const availableSize = product.variants.find(variant => variant.stock > 0);
                if (availableSize) {
                    setSelectedSize(availableSize);
                    toast.info(`Đã chuyển sang size ${availableSize.size}`);
                    return;
                }
            }
            return;
        }
        
        // Kiểm tra số lượng không vượt quá stock
        if (quantity > selectedSize.stock) {
            toast.error(`Số lượng vượt quá hàng có sẵn (${selectedSize.stock} sản phẩm)`);
            setQuantity(selectedSize.stock);
            return;
        }

        try {
            // Thêm riêng sản phẩm này vào giỏ hàng trong DB với buyNow = true để đưa lên đầu
            const addCartRes = await requestAddToCart({
                productId: product._id,
                quantity,
                size: selectedSize,
                color: selectedColor,
                buyNow: true,
            });

            // Lấy itemId từ response (backend đã trả về addedItemId)
            const addedItemId = addCartRes.metadata?.addedItemId;
            
            console.log('DetailProduct - addCartRes:', addCartRes);
            console.log('DetailProduct - addCartRes.metadata:', addCartRes.metadata);
            console.log('DetailProduct - addedItemId:', addedItemId);

            // Nếu không có addedItemId từ response, thử lấy từ cart.products
            let finalAddedItemId = addedItemId;
            if (!finalAddedItemId && addCartRes.metadata?.cart?.products) {
                const products = addCartRes.metadata.cart.products;
                const lastProduct = products[products.length - 1];
                if (lastProduct && lastProduct._id) {
                    finalAddedItemId = lastProduct._id.toString();
                    console.log('DetailProduct - Using last product _id:', finalAddedItemId);
                }
            }

            if (finalAddedItemId) {
                // Lưu itemId vào localStorage TRƯỚC để đảm bảo đứng đầu khi fetch cart
                const itemIdStr = String(finalAddedItemId);
                const recentlyAdded = JSON.parse(localStorage.getItem('recentlyAddedToCart') || '[]');
                
                // Xóa itemId khỏi danh sách nếu đã có (để tránh trùng lặp)
                const filtered = recentlyAdded.filter(id => String(id) !== itemIdStr);
                // Thêm vào đầu danh sách (unshift) - đảm bảo "Mua ngay" luôn đứng đầu
                filtered.unshift(finalAddedItemId);
                localStorage.setItem('recentlyAddedToCart', JSON.stringify(filtered));
                
                // Chỉ tick sản phẩm vừa thêm, bỏ tick tất cả sản phẩm khác
                await requestUpdateCartSelection({ selectedItemIds: [finalAddedItemId] });
            } else {
                console.error('DetailProduct - addedItemId is null or undefined!');
                // Nếu vẫn không có, lấy lại cart và tìm sản phẩm vừa thêm
                const cartRes = await requestGetCart();
                const items = cartRes.metadata?.items || [];
                const newItem = items.find(
                    (item) =>
                        item.productId === String(product._id) &&
                        item.colorId === String(selectedColor._id) &&
                        item.sizeId === String(selectedSize._id)
                );
                if (newItem && newItem._id) {
                    finalAddedItemId = String(newItem._id);
                    // Lưu vào localStorage trước
                    const itemIdStr = String(finalAddedItemId);
                    const recentlyAdded = JSON.parse(localStorage.getItem('recentlyAddedToCart') || '[]');
                    const filtered = recentlyAdded.filter(id => String(id) !== itemIdStr);
                    filtered.unshift(finalAddedItemId);
                    localStorage.setItem('recentlyAddedToCart', JSON.stringify(filtered));
                    
                    await requestUpdateCartSelection({ selectedItemIds: [finalAddedItemId] });
                }
            }

            // Cập nhật lại store giỏ hàng phía client
            await fetchCart();

            // Dispatch custom event để Cart page cập nhật ngay
            if (finalAddedItemId) {
                window.dispatchEvent(new CustomEvent('productAddedToCart', { 
                    detail: { itemId: finalAddedItemId, productId: product._id, buyNow: true } 
                }));
            }

            // Đợi một chút để đảm bảo DB đã được cập nhật
            await new Promise((resolve) => setTimeout(resolve, 200));

            // Điều hướng sang trang Cart, truyền addedItemId qua state để chỉ tick sản phẩm đó
            navigate('/cart', { 
                state: { 
                    fromBuyNow: true, 
                    addedItemId: finalAddedItemId ? String(finalAddedItemId) : null 
                } 
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể mua ngay, vui lòng thử lại');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!product || !product._id) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Sản phẩm không tồn tại</h2>
                        <p className="text-gray-600">Vui lòng kiểm tra lại đường dẫn</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

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
                        <li>
                            {product.category ? (
                                <Link 
                                    to={`/category?category=${typeof product.category === 'object' ? product.category._id : product.category}`}
                                    className="hover:text-red-600 transition-colors"
                                >
                                    {typeof product.category === 'object' && product.category.categoryName 
                                        ? product.category.categoryName 
                                        : 'Danh mục'}
                                </Link>
                            ) : (
                                <span>Danh mục</span>
                            )}
                        </li>
                        <li>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </li>
                        <li className="text-gray-900 font-medium truncate max-w-md">
                            {product.name || 'Sản phẩm'}
                        </li>
                    </ol>
                </nav>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                        {/* Product Images */}
                        <div className="space-y-4">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                                {mainImage && (
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}/uploads/products/${mainImage}`}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                {/* Navigation arrows for multiple images */}
                                {colorImages.length > 1 && (
                                    <>
                                        {currentImageIndex > 0 && (
                                            <button
                                                onClick={handlePrevImage}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                                                aria-label="Previous image"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                        )}
                                        {currentImageIndex < colorImages.length - 1 && (
                                            <button
                                                onClick={handleNextImage}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                                                aria-label="Next image"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        )}
                                        {/* Image counter */}
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                                            {currentImageIndex + 1} / {colorImages.length}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Thumbnail gallery for current color images */}
                            {colorImages.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {colorImages.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleImageSelect(index)}
                                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                                currentImageIndex === index
                                                    ? 'border-red-500 ring-2 ring-red-200'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}/uploads/products/${img}`}
                                                alt={`${product.name} - ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Color variants thumbnails */}
                            {product.colors && product.colors.length > 1 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Chọn màu:</h4>
                                    <div className="grid grid-cols-4 gap-2">
                                        {product.colors.map((color) => {
                                            const colorImage = Array.isArray(color.images) 
                                                ? color.images[0] 
                                                : color.images;
                                            return (
                                                <button
                                                    key={color._id}
                                                    onClick={() => handleColorSelect(color)}
                                                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                                        selectedColor?._id === color._id
                                                            ? 'border-red-500 ring-2 ring-red-200'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <img
                                                        src={`${import.meta.env.VITE_API_URL}/uploads/products/${colorImage}`}
                                                        alt={color.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            <div>
                                {/* Product Name */}
                                <h1 className="text-xl font-bold text-gray-900 mb-3">{product.name}</h1>
                                
                                {/* Rating and Sales Info */}
                                <div className="flex items-center space-x-4 mb-4 flex-wrap gap-2">
                                    <div className="flex items-center space-x-1">
                                        <span className="text-base font-semibold text-gray-900">
                                            {reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : '0.0'}
                                        </span>
                                        <div className="flex items-center">
                                            {(() => {
                                                const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
                                                const fullStars = Math.floor(averageRating);
                                                const hasHalfStar = averageRating % 1 >= 0.5;
                                                const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
                                                
                                                return (
                                                    <>
                                                        {[...Array(fullStars)].map((_, i) => (
                                                            <Star key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />
                                                        ))}
                                                        {hasHalfStar && (
                                                            <div className="relative">
                                                                <Star className="w-4 h-4 text-gray-300" />
                                                                <Star
                                                                    className="w-4 h-4 text-yellow-400 fill-current absolute top-0 left-0"
                                                                    style={{ clipPath: 'inset(0 50% 0 0)' }}
                                                                />
                                                            </div>
                                                        )}
                                                        {[...Array(emptyStars)].map((_, i) => (
                                                            <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
                                                        ))}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    {/* Divider between stars and reviews */}
                                    <div className="h-4 w-px bg-gray-300"></div>
                                    <span className="text-sm text-gray-600">
                                        {reviews.length} Đánh Giá
                                    </span>
                                    {/* Divider between reviews and sold */}
                                    <div className="h-4 w-px bg-gray-300"></div>
                                    <div className="text-sm text-gray-600">
                                        Đã Bán {product.totalSold || 0}
                                    </div>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <div className="flex items-center space-x-4">
                                    <span className="text-2xl font-bold text-red-600">
                                        {formatPrice(product.priceAfterDiscount ?? product.price)}
                                    </span>
                                    {product.discount > 0 && (
                                        <>
                                            <span className="text-lg text-gray-500 line-through">
                                                {formatPrice(product.price)}
                                            </span>
                                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                                -{product.discount}%
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Color Selection */}
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-3">Màu sắc</h3>
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
                                                <span className="text-xs font-medium">{color.name}</span>
                                                {selectedColor?._id === color._id && <Check className="w-3 h-3" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size Selection */}
                            {product.variants && product.variants.length > 0 && (
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-3">Kích thước</h3>
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
                                                <span className="text-xs font-medium">{variant.size}</span>
                                                {variant.stock === 0 && (
                                                    <span className="text-xs block text-red-500">Hết hàng</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-3">Số lượng</h3>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center border border-gray-300 rounded-lg">
                                        <button
                                            onClick={() => handleQuantityChange(-1)}
                                            disabled={quantity <= 1}
                                            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="px-3 py-2 text-sm font-medium">{quantity}</span>
                                        <button
                                            onClick={() => handleQuantityChange(1)}
                                            disabled={quantity >= (selectedSize?.stock || 1)}
                                            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <span className="text-xs text-gray-600">
                                        {selectedSize?.stock || 0} sản phẩm có sẵn
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-4">
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleAddToCart}
                                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        <span>Thêm vào giỏ hàng</span>
                                    </button>
                                    <button
                                        onClick={handleAddToFavourite}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <Heart
                                            className="w-4 h-4 "
                                            color={product?.favourite?.includes(dataUser._id) ? 'red' : 'gray'}
                                        />
                                    </button>
                                </div>

                                <button
                                    onClick={handleBuyNow}
                                    className="w-full bg-black text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm"
                                >
                                    Mua ngay
                                </button>
                            </div>

                            {/* Product Features */}
                            <div className="border-t pt-4">
                                <h3 className="text-base font-semibold text-gray-900 mb-3">Đặc điểm nổi bật</h3>
                                <ul className="space-y-1 text-xs text-gray-600">
                                    <li className="flex items-center space-x-2">
                                        <Check className="w-3 h-3 text-green-500" />
                                        <span>Chất liệu cao cấp, bền đẹp</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <Check className="w-3 h-3 text-green-500" />
                                        <span>Thiết kế thời trang, dễ phối đồ</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <Check className="w-3 h-3 text-green-500" />
                                        <span>Đế giày êm ái, chống trượt</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <Check className="w-3 h-3 text-green-500" />
                                        <span>Bảo hành 6 tháng</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="border-t bg-white">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`px-6 py-4 text-sm font-semibold transition-all relative ${
                                    activeTab === 'description'
                                        ? 'text-blue-600 bg-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                MÔ TẢ
                                {activeTab === 'description' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('policy')}
                                className={`px-6 py-4 text-sm font-semibold transition-all relative ${
                                    activeTab === 'policy'
                                        ? 'text-blue-600 bg-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                CHÍNH SÁCH ĐỔI TRẢ
                                {activeTab === 'policy' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`px-6 py-4 text-sm font-semibold transition-all relative flex items-center gap-2 ${
                                    activeTab === 'reviews'
                                        ? 'text-blue-600 bg-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                BÌNH LUẬN
                                {activeTab === 'reviews' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                                )}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 bg-white">
                            {/* Description Tab */}
                            {activeTab === 'description' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả sản phẩm</h2>
                                        <div
                                            className="prose max-w-none text-gray-700 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Policy Tab */}
                            {activeTab === 'policy' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Chính sách đổi trả</h2>
                                    <div className="space-y-4 text-gray-700">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Điều kiện đổi trả</h3>
                                            <ul className="list-disc list-inside space-y-1 ml-4">
                                                <li>Sản phẩm còn nguyên tem, nhãn mác, chưa qua sử dụng</li>
                                                <li>Sản phẩm còn đầy đủ phụ kiện, hộp đựng (nếu có)</li>
                                                <li>Thời gian đổi trả: Trong vòng 7 ngày kể từ ngày nhận hàng</li>
                                                <li>Chỉ áp dụng đổi trả khi sản phẩm bị lỗi từ nhà sản xuất</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Quy trình đổi trả</h3>
                                            <ul className="list-disc list-inside space-y-1 ml-4">
                                                <li>Liên hệ hotline: 1900 1234 hoặc email: support@example.com</li>
                                                <li>Cung cấp mã đơn hàng và hình ảnh sản phẩm cần đổi trả</li>
                                                <li>Nhân viên sẽ xác nhận và hướng dẫn các bước tiếp theo</li>
                                                <li>Gửi sản phẩm về địa chỉ được chỉ định (miễn phí vận chuyển)</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Lưu ý</h3>
                                            <ul className="list-disc list-inside space-y-1 ml-4">
                                                <li>Không áp dụng đổi trả với sản phẩm đã sử dụng, có dấu hiệu hao mòn</li>
                                                <li>Sản phẩm khuyến mãi, giảm giá trên 50% không được đổi trả</li>
                                                <li>Thời gian xử lý đổi trả: 3-5 ngày làm việc</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reviews Tab */}
                            {activeTab === 'reviews' && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900">Đánh giá sản phẩm</h2>
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                            {reviews.length} đánh giá
                                        </span>
                                    </div>

                                    {reviews.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-gray-500 text-lg">Chưa có đánh giá nào cho sản phẩm này</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {reviews.map((review) => (
                                                <div key={review._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                                                <span className="text-white font-semibold text-sm">
                                                                    {review?.userId?.fullName
                                                                        ? review?.userId?.fullName.charAt(0).toUpperCase()
                                                                        : 'U'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 text-sm">
                                                                    {review?.userId?.fullName || 'Người dùng ẩn danh'}
                                                                </h4>
                                                                <div className="flex items-center space-x-2">
                                                                    {renderStars(review.rating)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(review.createdAt)}
                                                        </span>
                                                    </div>

                                                    {/* Review Comment - Chỉ hiển thị nếu có comment */}
                                                    {review.comment && review.comment.trim() && (
                                                        <div className="mb-4">
                                                            <p className="text-gray-700 text-sm leading-relaxed">
                                                                {review.comment}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Review Images */}
                                                    {review.images && review.images.length > 0 && (
                                                        <div className="flex space-x-2 mb-3">
                                                            {review.images.map((image, index) => (
                                                                <div key={index} className="relative">
                                                                    <img
                                                                        src={`${
                                                                            import.meta.env.VITE_API_URL
                                                                        }/uploads/previewProducts/${image}`}
                                                                        alt={`Review ${index + 1}`}
                                                                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Show More Button */}
                                            {reviews.length > 3 && (
                                                <div className="text-center pt-4">
                                                    <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                                                        Xem thêm đánh giá
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Related Products Section */}
                    <div className="bg-gray-50 p-8 rounded-2xl">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">Sản Phẩm Liên Quan</h2>
                            <div className="w-20 h-1 bg-gradient-to-r from-red-500 to-pink-500 mx-auto rounded-full"></div>
                            <p className="text-gray-600 mt-3">Khám phá thêm những sản phẩm tương tự</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
                            {productRelated.map((item) => (
                                <div
                                    key={item._id}
                                    className="transform hover:scale-105 transition-all duration-300 hover:shadow-lg"
                                >
                                    <CardBody product={item} />
                                </div>
                            ))}
                        </div>

                        {productRelated.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">📦</div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có sản phẩm liên quan</h3>
                                <p className="text-gray-500">Hãy khám phá các sản phẩm khác trong cửa hàng</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default DetailProduct;
