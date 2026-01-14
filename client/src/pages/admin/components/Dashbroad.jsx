import { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Avatar,
    Tag,
    Progress,
    Spin,
    Typography,
    Space,
    Button,
    Rate,
    Badge,
} from 'antd';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Users,
    Package,
    DollarSign,
    Star,
    Eye,
    Calendar,
    Award,
    Activity,
    AlertCircle,
    RefreshCw,
    Trophy,
    Medal,
    ExternalLink,
} from 'lucide-react';
import moment from 'moment';
import { requestGetDashboardAdmin } from '../../../config/UserRequest';

const { Title, Text } = Typography;

// Màu cho biểu đồ
const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'];

function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        overview: {},
        revenueByDay: [],
        orderStatus: [],
        topProducts: [],
        recentReviews: [],
        recentOrders: [],
        paymentMethods: [],
        revenueByCategory: [],
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await requestGetDashboardAdmin();

            if (response && response.metadata) {
                setDashboardData(response.metadata);
            } else {
                // Mock data for demo if API doesn't return data
                // Mock data for demo if API doesn't return data
                setDashboardData({
                    overview: {
                        totalProducts: 156,
                        totalUsers: 2834,
                        totalCategories: 12,
                        totalOrders: 1247,
                        totalRevenue: 45680000,
                        revenueGrowth: 12.5,
                    },
                    revenueByDay: [
                        { day: '8/10', dayName: 'T2', revenue: 1250000, orders: 3 },
                        { day: '9/10', dayName: 'T3', revenue: 2100000, orders: 5 },
                        { day: '10/10', dayName: 'T4', revenue: 1800000, orders: 4 },
                        { day: '11/10', dayName: 'T5', revenue: 2500000, orders: 7 },
                        { day: '12/10', dayName: 'T6', revenue: 3200000, orders: 8 },
                        { day: '13/10', dayName: 'T7', revenue: 2800000, orders: 6 },
                        { day: '14/10', dayName: 'CN', revenue: 1150000, orders: 3 },
                    ],
                    orderStatus: [
                        { status: 'pending', count: 45 },
                        { status: 'confirmed', count: 120 },
                        { status: 'shipped', count: 89 },
                        { status: 'delivered', count: 340 },
                        { status: 'cancelled', count: 23 },
                    ],
                    topProducts: [
                        { id: '1', name: 'Nike Air Force 1', totalSold: 245, revenue: 12250000, image: 'product1.jpg' },
                        { id: '2', name: 'Adidas Stan Smith', totalSold: 198, revenue: 9900000, image: 'product2.jpg' },
                        { id: '3', name: 'Vans Old Skool', totalSold: 167, revenue: 8350000, image: 'product3.jpg' },
                    ],
                    recentReviews: [
                        {
                            id: '1',
                            user: 'Nguyễn Văn A',
                            userAvatar: 'avatar1.jpg',
                            product: 'Nike Air Max 90',
                            rating: 5,
                            comment: 'Sản phẩm chất lượng tuyệt vời!',
                            createdAt: new Date(),
                        },
                    ],
                    recentOrders: [
                        {
                            id: 'ORD001',
                            user: 'Trần Thị B',
                            userEmail: 'tran@example.com',
                            totalPrice: 1250000,
                            status: 'confirmed',
                            paymentMethod: 'momo',
                            createdAt: new Date(),
                            itemsCount: 2,
                        },
                    ],
                    paymentMethods: [
                        { method: 'momo', count: 456, revenue: 18500000 },
                        { method: 'vnpay', count: 234, revenue: 12200000 },
                        { method: 'cod', count: 189, revenue: 8900000 },
                    ],
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Set mock data on error
            setDashboardData({
                overview: {
                    totalProducts: 0,
                    totalUsers: 0,
                    totalCategories: 0,
                    totalOrders: 0,
                    totalRevenue: 0,
                    revenueGrowth: 0,
                },
                revenueByDay: [],
                orderStatus: [],
                topProducts: [],
                recentReviews: [],
                    recentOrders: [],
                    paymentMethods: [],
                    revenueByCategory: [],
                });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'orange',
            confirmed: 'blue',
            shipped: 'cyan',
            delivered: 'green',
            cancelled: 'red',
        };
        return colors[status] || 'default';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'Chờ xử lý',
            confirmed: 'Đã xác nhận',
            shipped: 'Đang giao',
            delivered: 'Đã giao',
            cancelled: 'Đã hủy',
        };
        return texts[status] || status;
    };

    const getPaymentMethodText = (method) => {
        const texts = {
            momo: 'MoMo',
            vnpay: 'VNPay',
            cod: 'COD',
        };
        return texts[method] || method;
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Spin size="large" />
                    <div className="mt-4">
                        <Text>Đang tải dữ liệu dashboard...</Text>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1">
                            <div className="flex items-center mb-3">
                                <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl mr-4 shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform duration-300">
                                    <Activity className="text-white" size={28} />
                                </div>
                                <Title level={2} className="!mb-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Dashboard Quản Trị
                                </Title>
                            </div>
                            <div className="ml-16">
                                <Text type="secondary" className="text-base flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    Tổng quan hoạt động kinh doanh • Cập nhật lần cuối: {moment().format('DD/MM/YYYY HH:mm')}
                                </Text>
                            </div>
                        </div>
                        <Button
                            type="primary"
                            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
                            onClick={fetchDashboardData}
                            loading={loading}
                            className="flex items-center h-11 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-600 border-0"
                            size="large"
                        >
                            Làm mới
                        </Button>
                    </div>
                </div>
            </div>

            {/* Thống kê tổng quan */}
            <Row gutter={[20, 20]} className="mb-8">
                <Col xs={24} sm={12} lg={6}>
                    <Card 
                        className="text-center border-0 overflow-hidden relative group"
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
                            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        hoverable
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.15)';
                        }}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl shadow-blue-500/30 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <DollarSign className="text-white" size={28} />
                                </div>
                            </div>
                            <Statistic
                                title={<span className="text-gray-600 font-medium">Tổng Doanh Thu</span>}
                                value={dashboardData.overview.totalRevenue || 0}
                                formatter={(value) => formatCurrency(value)}
                                valueStyle={{ 
                                    color: '#1890ff', 
                                    fontWeight: 'bold', 
                                    fontSize: '1.75rem',
                                    textShadow: '0 2px 4px rgba(24, 144, 255, 0.2)'
                                }}
                            />
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card 
                        className="text-center border-0 overflow-hidden relative group"
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        hoverable
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.15)';
                        }}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-transparent rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl shadow-green-500/30 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <ShoppingCart className="text-white" size={28} />
                                </div>
                            </div>
                            <Statistic
                                title={<span className="text-gray-600 font-medium">Tổng Đơn Hàng</span>}
                                value={dashboardData.overview.totalOrders || 0}
                                valueStyle={{ 
                                    color: '#52c41a', 
                                    fontWeight: 'bold', 
                                    fontSize: '1.75rem',
                                    textShadow: '0 2px 4px rgba(82, 196, 26, 0.2)'
                                }}
                            />
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card 
                        className="text-center border-0 overflow-hidden relative group"
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)',
                            boxShadow: '0 4px 20px rgba(251, 146, 60, 0.15)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        hoverable
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(251, 146, 60, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(251, 146, 60, 0.15)';
                        }}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-transparent rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl shadow-orange-500/30 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <Users className="text-white" size={28} />
                                </div>
                            </div>
                            <Statistic
                                title={<span className="text-gray-600 font-medium">Khách Hàng</span>}
                                value={dashboardData.overview.totalUsers || 0}
                                valueStyle={{ 
                                    color: '#fa8c16', 
                                    fontWeight: 'bold', 
                                    fontSize: '1.75rem',
                                    textShadow: '0 2px 4px rgba(250, 140, 22, 0.2)'
                                }}
                            />
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card 
                        className="text-center border-0 overflow-hidden relative group"
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
                            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        hoverable
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.15)';
                        }}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-bl-full"></div>
                        <div className="relative">
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl shadow-purple-500/30 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <Package className="text-white" size={28} />
                                </div>
                            </div>
                            <Statistic
                                title={<span className="text-gray-600 font-medium">Sản Phẩm</span>}
                                value={dashboardData.overview.totalProducts || 0}
                                valueStyle={{ 
                                    color: '#722ed1', 
                                    fontWeight: 'bold', 
                                    fontSize: '1.75rem',
                                    textShadow: '0 2px 4px rgba(114, 46, 209, 0.2)'
                                }}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Top 10 sản phẩm bán chạy */}
            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={24}>
                    <Card
                        title={
                            <Space>
                                <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-md">
                                    <Trophy className="text-white" size={20} />
                                </div>
                                <Text strong className="text-lg">Top 10 Sản Phẩm Bán Chạy</Text>
                            </Space>
                        }
                        className="shadow-sm border-0"
                    >
                        <style>
                            {`
                                .top-products-scroll::-webkit-scrollbar {
                                    width: 6px;
                                }
                                .top-products-scroll::-webkit-scrollbar-track {
                                    background: #f1f5f9;
                                    border-radius: 10px;
                                }
                                .top-products-scroll::-webkit-scrollbar-thumb {
                                    background: #cbd5e0;
                                    border-radius: 10px;
                                }
                                .top-products-scroll::-webkit-scrollbar-thumb:hover {
                                    background: #94a3b8;
                                }
                            `}
                        </style>
                        <div 
                            className="space-y-3 max-h-[400px] overflow-y-auto pr-1 top-products-scroll"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#cbd5e0 #f1f5f9',
                            }}
                        >
                            {(dashboardData.topProducts || []).map((product, index) => {
                                const getRankBadgeStyle = () => {
                                    if (index === 0) {
                                        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/50';
                                    } else if (index === 1) {
                                        return 'bg-gradient-to-br from-gray-300 to-gray-400 shadow-lg shadow-gray-400/50';
                                    } else if (index === 2) {
                                        return 'bg-gradient-to-br from-orange-300 to-orange-500 shadow-lg shadow-orange-500/50';
                                    }
                                    return 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-md';
                                };

                                const getRankIcon = () => {
                                    if (index === 0) return <Trophy className="w-4 h-4" />;
                                    if (index === 1) return <Medal className="w-4 h-4" />;
                                    if (index === 2) return <Award className="w-4 h-4" />;
                                    return null;
                                };

                                // Tính phần trăm dựa trên sản phẩm bán chạy nhất
                                const maxSold = dashboardData.topProducts?.[0]?.totalSold || 1;
                                const progressPercent = (product.totalSold / maxSold) * 100;

                                return (
                                    <div
                                        key={product.id}
                                        className="group flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                                        onClick={() => window.open(`/product/${product.id}`, '_blank')}
                                    >
                                        <Space size="large" className="flex-1 min-w-0">
                                            <div className="relative flex-shrink-0">
                                                <Avatar
                                                    size={64}
                                                    src={product.image ? `${import.meta.env.VITE_API_URL}/uploads/products/${product.image}` : undefined}
                                                    icon={!product.image ? <Package /> : undefined}
                                                    className="border-2 border-gray-200 group-hover:border-blue-400 transition-colors shadow-md"
                                                    shape="square"
                                                />
                                                <div className={`absolute -top-2 -left-2 ${getRankBadgeStyle()} text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold`}>
                                                    {getRankIcon() || index + 1}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Text strong className="block text-base mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                    {product.name}
                                                </Text>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <div className="flex items-center gap-1">
                                                        <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />
                                                        <Text type="secondary" className="text-sm">
                                                            Đã bán:{' '}
                                                            <Text strong className="text-blue-600">
                                                                {product.totalSold}
                                                            </Text>{' '}
                                                            đôi
                                                        </Text>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-3.5 h-3.5 text-green-500" />
                                                        <Text strong className="text-green-600 text-sm">
                                                            {formatCurrency(product.revenue)}
                                                        </Text>
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <Progress
                                                        percent={progressPercent}
                                                        size="small"
                                                        showInfo={false}
                                                        className="w-full"
                                                        strokeColor={{
                                                            '0%': index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#fb923c' : '#3b82f6',
                                                            '100%': index === 0 ? '#f59e0b' : index === 1 ? '#6b7280' : index === 2 ? '#ea580c' : '#2563eb',
                                                        }}
                                                        trailColor="#e5e7eb"
                                                    />
                                                </div>
                                            </div>
                                        </Space>
                                        <div className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="w-5 h-5 text-blue-500" />
                                        </div>
                                    </div>
                                );
                            })}
                            {(!dashboardData.topProducts || dashboardData.topProducts.length === 0) && (
                                <div className="text-center py-12">
                                    <Package className="text-gray-300 mx-auto mb-3" size={64} />
                                    <Text type="secondary" className="text-base">Chưa có dữ liệu sản phẩm</Text>
                                    <Text type="secondary" className="text-xs block mt-1">Dữ liệu sẽ hiển thị khi có đơn hàng thành công</Text>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Phân tích doanh thu theo danh mục và trạng thái đơn hàng */}
            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <Space>
                                <Package className="text-blue-500" size={20} />
                                <Text strong>Phân Tích Doanh Thu Theo Danh Mục</Text>
                            </Space>
                        }
                        className="h-full shadow-sm border-0"
                    >
                        {dashboardData.revenueByCategory && dashboardData.revenueByCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart
                                    data={dashboardData.revenueByCategory}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <defs>
                                        <linearGradient id="colorBarCategory" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis 
                                        dataKey="categoryName" 
                                        tick={{ fontSize: 11 }} 
                                        axisLine={false} 
                                        tickLine={false}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                        tick={{ fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <Tooltip
                                        formatter={(value, name) => [
                                            name === 'revenue' ? formatCurrency(value) : value,
                                            name === 'revenue' ? 'Doanh thu' : name === 'orderCount' ? 'Số đơn hàng' : name === 'productCount' ? 'Số sản phẩm' : name,
                                        ]}
                                        labelFormatter={(label) => `Danh mục: ${label}`}
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e8e8e8',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        }}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="url(#colorBarCategory)"
                                        radius={[4, 4, 0, 0]}
                                        name="revenue"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-80">
                                <div className="text-gray-400 text-6xl mb-4">📊</div>
                                <Text type="secondary" className="text-center">
                                    Chưa có dữ liệu doanh thu theo danh mục
                                    <br />
                                    <Text type="secondary" className="text-xs">
                                        Dữ liệu sẽ hiển thị khi có đơn hàng thành công
                                    </Text>
                                </Text>
                            </div>
                        )}
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <Space>
                                <ShoppingCart className="text-green-500" size={20} />
                                <Text strong>Trạng Thái Đơn Hàng</Text>
                            </Space>
                        }
                        className="h-full shadow-sm border-0"
                        styles={{ body: { padding: '24px', overflow: 'visible' } }}
                    >
                        <ResponsiveContainer width="100%" height={360}>
                            <PieChart>
                                <Pie
                                    data={dashboardData.orderStatus || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={({ status, percent }) =>
                                        percent > 0 ? `${getStatusText(status)} (${(percent * 100).toFixed(0)}%)` : ''
                                    }
                                    outerRadius={65}
                                    innerRadius={30}
                                    fill="#8884d8"
                                    dataKey="count"
                                    style={{ fontSize: '12px' }}
                                >
                                    {(dashboardData.orderStatus || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e8e8e8',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            {/* Phương thức thanh toán */}
            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={24} lg={{ span: 12, offset: 6 }}>
                    <Card
                        title={
                            <Space>
                                <DollarSign className="text-blue-500" size={20} />
                                <Text strong>Phương Thức Thanh Toán</Text>
                            </Space>
                        }
                        className="shadow-sm border-0"
                    >
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={dashboardData.paymentMethods || []}>
                                <XAxis
                                    dataKey="method"
                                    tickFormatter={(value) => getPaymentMethodText(value)}
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                />
                                <YAxis
                                    tickFormatter={(value) => `${value / 1000000}M`}
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                />
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <Tooltip
                                    formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                                    labelFormatter={(label) => getPaymentMethodText(label)}
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e8e8e8',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }}
                                />
                                <Bar dataKey="revenue" fill="url(#colorBar)" radius={[8, 8, 0, 0]}>
                                    <defs>
                                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

        </div>
    );
}

export default Dashboard;
