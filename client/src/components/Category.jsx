import { useEffect, useState } from 'react';
import CardBody from './CardBody';
import { requestGetAllCategory } from '../config/CategoryRequest';
import { requestGetProductByCategory } from '../config/ProductRequest';
import { Package, Sparkles } from 'lucide-react';

function Category() {
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState();
    const [products, setProducts] = useState([]);

    // 🟢 Lấy danh sách category 1 lần
    useEffect(() => {
        const fetchCategories = async () => {
            const res = await requestGetAllCategory();
            setCategories(res.metadata);

            // Nếu chưa có activeCategory thì set mặc định là cái đầu tiên
            if (res.metadata?.length > 0) {
                setActiveCategory(res.metadata[0]._id);
            }
        };
        fetchCategories();
    }, []); // <--- chỉ chạy 1 lần

    // 🟢 Mỗi khi activeCategory thay đổi thì lấy sản phẩm
    useEffect(() => {
        if (!activeCategory) return;
        const fetchProducts = async () => {
            const res = await requestGetProductByCategory(activeCategory);
            setProducts(res.metadata);
        };
        fetchProducts();
    }, [activeCategory]);

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
                        <CardBody key={item._id} product={item} />
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
        </div>
    );
}

export default Category;
