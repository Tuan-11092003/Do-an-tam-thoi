import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { requestGetAllNews } from '../config/NewsRequest';

// Custom Arrow Components
function CustomPrevArrow(props) {
    const { className, style, onClick } = props;
    return (
        <div
            className={className}
            style={{ ...style, display: 'block' }}
            onClick={onClick}
        />
    );
}

function CustomNextArrow(props) {
    const { className, style, onClick } = props;
    return (
        <div
            className={className}
            style={{ ...style, display: 'block' }}
            onClick={onClick}
        />
    );
}

function NewsHome() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await requestGetAllNews();
                const newsData = res.metadata || [];
                // Lấy tất cả tin tức
                setNews(newsData);
            } catch (error) {
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const decodeHTML = (html) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    const extractTextFromHTML = (htmlContent, maxLength = 100) => {
        if (!htmlContent) return '';
        // Loại bỏ HTML tags
        let textContent = htmlContent.replace(/<[^>]*>/g, '');
        // Decode HTML entities
        textContent = decodeHTML(textContent);
        if (textContent.length <= maxLength) {
            return textContent;
        }
        return textContent.substring(0, maxLength) + '...';
    };

    const getTitleForRedSection = (title) => {
        // Decode HTML entities trước
        const decodedTitle = decodeHTML(title);
        // Lấy chữ cái đầu tiên của mỗi từ và viết hoa
        const words = decodedTitle.split(' ');
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toUpperCase()).join(' ');
    };

    if (loading) {
        return null;
    }

    if (news.length === 0) {
        return null;
    }

    const sliderSettings = {
        dots: false,
        infinite: news.length > 4,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: false,
        pauseOnHover: true,
        arrows: true,
        prevArrow: <CustomPrevArrow />,
        nextArrow: <CustomNextArrow />,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
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
        <div className="w-full bg-gray-50 py-12">
            <div className="w-[90%] mx-auto">
                {/* Section Header */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">TIN TỨC</h2>
                    <p className="text-gray-600">Cập nhật những thông tin mới nhất từ chúng tôi</p>
                </div>

                {/* News Cards Carousel */}
                <div className="news-carousel relative">
                    <Slider {...sliderSettings}>
                        {news.map((item) => (
                            <div key={item._id} className="px-3">
                                <Link
                                    to={`/news/${item._id}`}
                                    className="block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer group"
                                >
                                    {/* Red Header Section */}
                                    <div className="h-32 bg-gradient-to-r from-[#ed1d24] to-[#c41e3a] text-white p-4 flex items-center justify-center relative group-hover:from-[#c41e3a] group-hover:to-[#ed1d24] transition-all duration-300">
                                        <div className="text-center">
                                            <h3 className="text-xl font-bold leading-tight">
                                                {getTitleForRedSection(item.title)}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* White Content Section */}
                                    <div className="p-5">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[56px] group-hover:text-red-600 transition-colors duration-300">
                                            {decodeHTML(item.title)}
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-3 min-h-[60px]">
                                            {extractTextFromHTML(item.content)}
                                        </p>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(item.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="text-red-600 group-hover:text-red-700 font-medium text-sm inline-flex items-center gap-1 transition-colors duration-300">
                                            Xem thêm <span>&gt;&gt;</span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </Slider>
                    <style>{`
                        .news-carousel .slick-prev,
                        .news-carousel .slick-next {
                            width: 40px;
                            height: 40px;
                            z-index: 10;
                            background: white;
                            border-radius: 50%;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                            display: flex !important;
                            align-items: center;
                            justify-content: center;
                        }

                        .news-carousel .slick-prev {
                            left: -20px;
                        }

                        .news-carousel .slick-next {
                            right: -20px;
                        }

                        .news-carousel .slick-prev:before,
                        .news-carousel .slick-next:before {
                            font-size: 20px;
                            color: #ed1d24;
                            opacity: 1;
                        }

                        .news-carousel .slick-prev:hover,
                        .news-carousel .slick-next:hover {
                            background: #ed1d24;
                            box-shadow: 0 4px 12px rgba(237, 29, 36, 0.3);
                        }

                        .news-carousel .slick-prev:hover:before,
                        .news-carousel .slick-next:hover:before {
                            color: white;
                        }

                        .news-carousel .slick-prev:focus,
                        .news-carousel .slick-next:focus {
                            background: white;
                        }

                        .news-carousel .slick-prev:focus:before,
                        .news-carousel .slick-next:focus:before {
                            color: #ed1d24;
                        }

                        @media (max-width: 768px) {
                            .news-carousel .slick-prev {
                                left: -10px;
                            }

                            .news-carousel .slick-next {
                                right: -10px;
                            }
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
}

export default NewsHome;

