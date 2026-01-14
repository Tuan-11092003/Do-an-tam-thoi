import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Spin, Button, Card, Divider, Tag } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons';
import { requestGetNewsById } from '../config/NewsRequest';

function DetailNewsPage() {
    const { id } = useParams();
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNewsDetail = async () => {
            setLoading(true);
            try {
                const res = await requestGetNewsById(id);
                setNews(res.metadata);
            } catch (error) {
                console.error('Lỗi khi tải chi tiết tin tức:', error);
                setError('Không thể tải tin tức. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchNewsDetail();
        }
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('vi-VN', options);
    };

    const decodeHTML = (html) => {
        if (!html) return '';
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    const newsTypeLabels = {
        terms: 'Điều khoản',
        privacy: 'Bảo mật',
        shipping: 'Vận chuyển',
        payment: 'Thanh toán',
        other: 'Khác',
    };

    const newsTypeColors = {
        terms: 'red',
        privacy: 'blue',
        shipping: 'green',
        payment: 'orange',
        other: 'default',
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 flex justify-center items-center">
                    <Spin size="large" tip="Đang tải tin tức..." />
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !news) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="text-xl text-red-500 mb-4">{error || 'Không tìm thấy tin tức'}</div>
                    <Link to="/">
                        <Button type="primary" icon={<ArrowLeftOutlined />}>
                            Quay lại trang chủ
                        </Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 bg-gray-50 py-12 pt-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Link to="/" className="inline-block mb-6">
                        <Button icon={<ArrowLeftOutlined />}>Quay lại trang chủ</Button>
                    </Link>

                    <Card className="shadow-lg rounded-lg overflow-hidden">
                        {/* Tiêu đề và thông tin */}
                        <div className="px-6 mb-4">
                            <Tag color={newsTypeColors[news.type] || 'default'} className="mb-3">
                                {newsTypeLabels[news.type] || 'Khác'}
                            </Tag>
                            <h1 className="text-3xl font-bold mb-4 text-gray-900 leading-tight">
                                {decodeHTML(news.title)}
                            </h1>
                        </div>

                        <div className="px-6 flex items-center text-gray-500 mb-6">
                            <CalendarOutlined className="mr-2" />
                            <span>Đăng ngày: {formatDate(news.createdAt)}</span>
                            {news.updatedAt && news.updatedAt !== news.createdAt && (
                                <span className="ml-4">(Cập nhật: {formatDate(news.updatedAt)})</span>
                            )}
                        </div>

                        <Divider />

                        {/* Nội dung tin tức */}
                        <div
                            className="news-content prose prose-lg max-w-none px-6 pb-6"
                            dangerouslySetInnerHTML={{ __html: decodeHTML(news.content) }}
                        />
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default DetailNewsPage;

