import { useEffect, useState } from 'react';
import CardBody from '../product/CardBody';
import { requestGetAllCategory } from '../../services/category/categoryService';
import { requestGetProductByCategory } from '../../services/product/productService';
import { Package, Sparkles } from 'lucide-react';
import ProductQuickAddModal from '../product/ProductQuickAddModal';

function CategoryList() {
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState();
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedDiscountPrice, setSelectedDiscountPrice] = useState(null);

    // 🟢 Lấy danh sách category 1 lần
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await requestGetAllCategory();
                const data = res?.metadata || [];
                setCategories(data);
                if (data.length > 0) {
                    setActiveCategory(data[0]._id);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (!activeCategory) return;
        const fetchProducts = async () => {
            try {
                const res = await requestGetProductByCategory(activeCategory);
                setProducts(res?.metadata || []);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };
        fetchProducts();
    }, [activeCategory]);

    // Format currency function
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

    return (
        <div className="w-full bg-gradient-to-b from-gray-50 to-white py-12">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Category Navigation */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
                    {/* Left Title */}
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-sky-400 to-sky-500 rounded-xl shadow-lg">
                            <Package className="text-white" size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                Danh mục sản phẩm
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Khám phá bộ sưu tập đa dạng của chúng tôi</p>
                        </div>
                    </div>

                    {/* Right Category Buttons */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {categories.map((category) => (
                            <button
                                key={category._id}
                                onClick={() => setActiveCategory(category._id)}
                                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                                    activeCategory === category._id
                                        ? 'bg-gradient-to-r from-sky-400 to-sky-500 text-white shadow-lg shadow-sky-400/30 scale-105'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-sky-300 hover:shadow-md'
                                }`}
                            >
                                {category.categoryName.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {products.map((item) => (
                        <CardBody 
                            key={item._id} 
                            product={item} 
                            onOpenModal={handleOpenModal}
                        />
                    ))}
                </div>

                {/* Empty State */}
                {products.length === 0 && (
                    <div className="text-center py-16">
                        <Sparkles className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 text-lg">Chưa có sản phẩm nào trong danh mục này</p>
                    </div>
                )}
            </div>

            {/* Modal thêm vào giỏ hàng */}
            <ProductQuickAddModal
                product={selectedProduct}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                discountPrice={selectedDiscountPrice}
                formatCurrency={formatCurrency}
            />
        </div>
    );
}

export default CategoryList;

