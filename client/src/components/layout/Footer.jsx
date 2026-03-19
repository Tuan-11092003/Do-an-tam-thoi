import { Twitter, Facebook, Instagram } from 'lucide-react';
import logo from '../../assets/logo.png';

export default function Footer() {
    return (
        <footer className="bg-black text-gray-300 py-12">
            <div className="w-[80%] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                {/* Cột 1 */}
                <div>
                    <img 
                        className="h-10 object-contain mb-4" 
                        src={logo} 
                        alt="KCONS Logo"
                        style={{ width: 'auto', minWidth: '120px' }}
                    />
                    <p className="text-sm mb-6">
                        Cửa hàng giày uy tín - mang đến cho bạn những đôi giày chất lượng cao, phong cách thời trang và dịch vụ chăm sóc khách hàng tận tâm.
                    </p>
                    <div className="flex space-x-3">
                        <a href="#" className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700">
                            <Twitter size={18} />
                        </a>
                        <a href="#" className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700">
                            <Facebook size={18} />
                        </a>
                        <a href="#" className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700">
                            <Instagram size={18} />
                        </a>
                    </div>
                </div>

                {/* Cột 2 */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-lg">Thông tin liên hệ</h3>
                    <ul className="space-y-3 text-sm">
                        <li>📍 Cổ Nhuế, Bắc Từ Liêm, Hà Nội, Việt Nam</li>
                        <li>📞 +84 963607325</li>
                        <li>✉️ support@kcons.com</li>
                        <li>MST/ĐKKD/QĐTL: 1801377715 Đăng ký thay đổi lần thứ 8 ngày 10 tháng 12 năm 2025. Cấp tại CT</li>
                    </ul>
                </div>

                {/* Cột 3 */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-lg">Thương hiệu phổ biến</h3>
                    <ul className="space-y-2 text-sm">
                        <li>• Nike</li>
                        <li>• Adidas</li>
                        <li>• Vans</li>
                        <li>• Converse</li>
                        <li>• Puma</li>
                    </ul>
                </div>

                {/* Cột 4 */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-lg">Đăng ký nhận ưu đãi</h3>
                    <p className="text-sm mb-4">
                        Đừng bỏ lỡ các chương trình giảm giá và khuyến mãi hấp dẫn, hãy nhập email của bạn để nhận tin mới nhất về sản phẩm giày.
                    </p>
                </div>
            </div>
        </footer>
    );
}

