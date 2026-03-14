import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requestGetFavouriteByUserId } from '../../../services/favourite/favouriteService';
import CardBody from '../../../components/product/CardBody';
import ProductQuickAddModal from '../../../components/product/ProductQuickAddModal';
import { formatPrice } from '../../../utils/formatPrice';
import { Heart, ArrowRight } from 'lucide-react';
import { Empty, Spin } from 'antd';

function Favourite() {
    const [favourite, setFavourite] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedDiscountPrice, setSelectedDiscountPrice] = useState(null);

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

    useEffect(() => {
        const fetchFavourite = async () => {
            try {
                const res = await requestGetFavouriteByUserId();
                setFavourite(res?.metadata || []);
            } catch (error) {
                console.error('Error fetching favourite:', error);
                setFavourite([]);
            } finally {
                setLoading(false);
            }
        };
        fetchFavourite();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[320px] rounded-2xl border border-gray-200 bg-gray-50/50">
                <Spin size="large" />
                <p className="mt-4 text-sm text-gray-500">Đang tải sản phẩm yêu thích...</p>
            </div>
        );
    }

    if (favourite.length === 0) {
        return (
            <div className="space-y-6">
                <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 text-red-500">
                            <Heart className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sản phẩm yêu thích</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Các sản phẩm bạn đã thêm vào danh sách yêu thích
                            </p>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white py-16 shadow-sm">
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <span className="text-gray-500">Bạn chưa có sản phẩm yêu thích nào</span>
                        }
                        className="py-8"
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors shadow-sm"
                        >
                            <ArrowRight className="h-4 w-4" />
                            Khám phá sản phẩm
                        </Link>
                    </Empty>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-100 p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 text-red-500">
                        <Heart className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sản phẩm yêu thích</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Các sản phẩm bạn đã thêm vào danh sách yêu thích
                        </p>
                    </div>
                    <div className="ml-auto">
                        <span className="inline-flex items-center rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-100">
                            {favourite.length} sản phẩm
                        </span>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favourite.map((item) => (
                    <CardBody
                        product={item.productId}
                        key={item._id}
                        onOpenModal={handleOpenModal}
                    />
                ))}
            </div>

            {/* Modal thêm vào giỏ hàng */}
            <ProductQuickAddModal
                product={selectedProduct}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                discountPrice={selectedDiscountPrice}
                formatCurrency={formatPrice}
            />
        </div>
    );
}

export default Favourite;
