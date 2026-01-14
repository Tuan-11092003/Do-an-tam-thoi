import { useEffect, useState } from 'react';
import { requestGetOrderHistory, requestCancelOrder } from '../../../config/PaymentsRequest';
import {
    Card,
    Table,
    Tag,
    Image,
    Collapse,
    Descriptions,
    Empty,
    Spin,
    Modal,
    Rate,
    Input,
    Button,
    Upload,
    message,
    Form,
    Popconfirm,
} from 'antd';
import {
    ShoppingBag,
    CreditCard,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    Package,
    Calendar,
    User,
    Phone,
    Mail,
    Ticket,
    Star,
    Camera,
    MessageSquare,
    X,
    ChevronRight,
    ArrowRight,
} from 'lucide-react';
import { requestCreatePreviewProduct } from '../../../config/PreviewProduct';

const { Panel } = Collapse;
const { TextArea } = Input;

function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingOrderId, setCancellingOrderId] = useState(null);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [reviewForm] = Form.useForm();
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchOrderHistory = async () => {
            try {
                const res = await requestGetOrderHistory();
                setOrders(res.metadata);
            } catch (error) {
                console.error('Error fetching order history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrderHistory();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'orange';
            case 'confirmed':
                return 'blue';
            case 'shipped':
                return 'cyan';
            case 'delivered':
                return 'green';
            case 'cancelled':
                return 'red';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4" />;
            case 'confirmed':
                return <CheckCircle className="w-4 h-4" />;
            case 'shipped':
                return <Truck className="w-4 h-4" />;
            case 'delivered':
                return <Package className="w-4 h-4" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Đang xử lý';
            case 'confirmed':
                return 'Đã xác nhận';
            case 'shipped':
                return 'Đang giao';
            case 'delivered':
                return 'Đã giao';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return 'Không xác định';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `lúc ${hours}:${minutes} ${day} tháng ${month}, ${year}`;
    };

    const openReviewModal = (order, product) => {
        setSelectedOrder(order);
        setSelectedProduct(product);
        setReviewModalVisible(true);
        reviewForm.resetFields();
    };

    const closeReviewModal = () => {
        setReviewModalVisible(false);
        setSelectedOrder(null);
        setSelectedProduct(null);
        reviewForm.resetFields();
    };

    const submitReview = async (values) => {
        if (submittingReview) return; // Ngăn submit nhiều lần
        
        try {
            setSubmittingReview(true);
            const formData = new FormData();
            formData.append('productId', selectedProduct.idProduct);
            formData.append('orderId', selectedOrder._id); // Gửi orderId để phân biệt theo đơn hàng
            formData.append('rating', values.rating);
            // Comment không bắt buộc, chỉ thêm nếu có
            if (values.comment && values.comment.trim()) {
                formData.append('comment', values.comment.trim());
            }
            // Images không bắt buộc, chỉ thêm nếu có
            if (values.images?.fileList && values.images.fileList.length > 0) {
                values.images.fileList.forEach((file) => {
                    formData.append('images', file.originFileObj);
                });
            }
            const reviewResponse = await requestCreatePreviewProduct(formData);

            message.success('Đánh giá của bạn đã được gửi thành công!');
            closeReviewModal();

            // Cập nhật state local để đánh dấu sản phẩm đã được đánh giá
            if (selectedOrder && selectedProduct && reviewResponse?.metadata) {
                setOrders((prevOrders) =>
                    prevOrders.map((order) => {
                        if (order._id === selectedOrder._id) {
                            const updatedItems = order.items.map((item) => {
                                if (item.idProduct === selectedProduct.idProduct) {
                                    return {
                                        ...item,
                                        previewProduct: reviewResponse.metadata, // Đánh dấu đã đánh giá
                                    };
                                }
                                return item;
                            });
                            return { ...order, items: updatedItems };
                        }
                        return order;
                    })
                );
            }

            // Refresh orders to update review status (optional, để đảm bảo đồng bộ với server)
            const fetchOrderHistory = async () => {
                try {
                    const res = await requestGetOrderHistory();
                    setOrders(res.metadata);
                } catch (error) {
                    console.error('Error fetching order history:', error);
                }
            };
            fetchOrderHistory();
        } catch (error) {
            console.error('Error submitting review:', error);
            message.error('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        try {
            setCancellingOrderId(orderId);
            await requestCancelOrder(orderId);
            message.success('Đã hủy đơn hàng thành công');
            
            // Cập nhật state local thay vì fetch lại toàn bộ để tránh re-render
            setOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order._id === orderId
                        ? { ...order, status: 'cancelled' }
                        : order
                )
            );
            
            // Đóng expanded order nếu đang mở
            setExpandedOrders((prev) => {
                const newSet = new Set(prev);
                newSet.delete(orderId);
                return newSet;
            });
        } catch (error) {
            console.error('Error canceling order:', error);
            message.error(error.response?.data?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại!');
        } finally {
            setCancellingOrderId(null);
        }
    };

    const canCancelOrder = (status) => {
        // Chỉ cho phép hủy khi đơn hàng ở trạng thái pending (chưa xác nhận)
        return status === 'pending';
    };

    const itemColumns = [
        {
            title: 'Sản phẩm',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div className="flex items-center space-x-3">
                    <Image
                        width={60}
                        height={60}
                        src={`${import.meta.env.VITE_API_URL}/uploads/products/${
                            Array.isArray(record.image) 
                                ? record.image[0] || '' 
                                : record.image || ''
                        }`}
                        alt={text}
                        className="rounded-lg object-cover"
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8E+UDNmyJUu2ZMmSLVmSBUuWLFmyZMmSJVmyZMuSJUu2bMmSJVuyZMmWLVmyZMvSbMmSLdmyJUuyZEmWJUu2ZMmSJUt2ZEuWLNmyJUuWbNmSJUuWLFmy9U="
                    />
                    <div>
                        <div className="font-medium text-gray-900 max-w-xs truncate">{text}</div>
                        <div className="text-sm text-gray-500">
                            Màu: {record.color} | Size: {record.size}
                        </div>
                        {record.discount > 0 && (
                            <Tag color="red" className="text-xs">
                                Giảm {record.discount}%
                            </Tag>
                        )}
                    </div>
                </div>
            ),
            width: 300,
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            render: (price, record) => (
                <div className="text-right">
                    {record.discount > 0 ? (
                        <>
                            <div className="text-sm text-gray-400 line-through">{formatCurrency(price)}</div>
                            <div className="font-semibold text-red-500">
                                {formatCurrency(record.priceAfterDiscount)}
                            </div>
                        </>
                    ) : (
                        <div className="font-semibold">{formatCurrency(price)}</div>
                    )}
                </div>
            ),
            width: 120,
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity) => <div className="text-center font-medium">{quantity}</div>,
            width: 80,
        },
        {
            title: 'Thành tiền',
            dataIndex: 'subtotal',
            key: 'subtotal',
            render: (subtotal) => (
                <div className="text-right font-semibold text-blue-600">{formatCurrency(subtotal)}</div>
            ),
            width: 120,
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (text, record) => {
                // Tìm order từ context để check status
                const currentOrder = orders.find((order) => order.items.some((item) => item._id === record._id));
                console.log(record);

                if (!record?.previewProduct?._id) {
                    // Kiểm tra xem sản phẩm này có đang được đánh giá không
                    const isCurrentlyReviewing = submittingReview && 
                        selectedProduct?.idProduct === record.idProduct;
                    
                    return (
                        <Button
                            type="primary"
                            size="small"
                            icon={<Star className="w-4 h-4" />}
                            onClick={() => openReviewModal(currentOrder, record)}
                            disabled={isCurrentlyReviewing || submittingReview}
                            loading={isCurrentlyReviewing}
                            className="bg-yellow-500 hover:bg-yellow-600 border-yellow-500 hover:border-yellow-600"
                        >
                            {isCurrentlyReviewing ? 'Đang gửi...' : 'Đánh giá'}
                        </Button>
                    );
                } else {
                    return <span className="text-gray-400 text-sm">Đã đánh giá</span>;
                }
            },
            width: 100,
        },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    if (orders.length === 0) {
        return <Empty description="Bạn chưa có đơn hàng nào" className="py-16" />;
    }

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'confirmed':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'shipped':
                return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case 'delivered':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <ShoppingBag className="w-6 h-6 text-red-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Lịch sử đơn hàng</h2>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {orders.length} đơn hàng
                    </span>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-3">
                {orders.map((order) => (
                    <Card
                        key={order._id}
                        className="hover:shadow-md transition-shadow cursor-pointer bg-gray-50"
                        onClick={() => {
                            const newExpanded = new Set(expandedOrders);
                            if (newExpanded.has(order._id)) {
                                newExpanded.delete(order._id);
                            } else {
                                newExpanded.add(order._id);
                            }
                            setExpandedOrders(newExpanded);
                        }}
                    >
                        <div className="flex items-center justify-between">
                            {/* Left side - Order info */}
                            <div className="flex items-center space-x-4 flex-1">
                                <ChevronRight 
                                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                                        expandedOrders.has(order._id) ? 'rotate-90' : ''
                                    }`} 
                                />
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-semibold text-gray-900">
                                            Đơn hàng #{order._id.slice(-8)}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(order.createdAt)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right side - Status and Price */}
                            <div className="flex items-center space-x-4">
                                {/* Status Badge */}
                                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${getStatusBadgeStyle(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    <span className="text-sm font-medium">{getStatusText(order.status)}</span>
                                </div>

                                {/* Cancel Button */}
                                {canCancelOrder(order.status) && (
                                    <Popconfirm
                                        title="Hủy đơn hàng này?"
                                        description="Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác."
                                        onConfirm={(e) => {
                                            e.stopPropagation();
                                            handleCancelOrder(order._id);
                                        }}
                                        okText="Xác nhận hủy"
                                        cancelText="Không"
                                        okButtonProps={{ 
                                            danger: true,
                                            loading: cancellingOrderId === order._id
                                        }}
                                    >
                                        <Button
                                            danger
                                            size="small"
                                            icon={<X className="w-4 h-4" />}
                                            loading={cancellingOrderId === order._id}
                                            disabled={cancellingOrderId === order._id}
                                            className="flex items-center bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Hủy đơn
                                        </Button>
                                    </Popconfirm>
                                )}

                                {/* Price */}
                                <div className="text-right min-w-[120px]">
                                    <div className="font-bold text-lg text-blue-600">
                                        {formatCurrency(order.finalPrice)}
                                    </div>
                                    {order.totalPrice !== order.finalPrice && (
                                        <div className="text-sm text-gray-400 line-through">
                                            {formatCurrency(order.totalPrice)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Details */}
                        {expandedOrders.has(order._id) && (
                        <div className="mt-6 pt-6 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-6">
                            {/* Thông tin khách hàng và đơn hàng */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card
                                    title={
                                        <div className="flex items-center space-x-2">
                                            <User className="w-5 h-5" />
                                            <span>Thông tin khách hàng</span>
                                        </div>
                                    }
                                    size="small"
                                >
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item
                                            label={
                                                <span className="flex items-center space-x-1">
                                                    <User className="w-4 h-4" />
                                                    <span>Tên</span>
                                                </span>
                                            }
                                        >
                                            {order.user.fullName}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                            label={
                                                <span className="flex items-center space-x-1">
                                                    <Mail className="w-4 h-4" />
                                                    <span>Email</span>
                                                </span>
                                            }
                                        >
                                            {order.user.email}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                            label={
                                                <span className="flex items-center space-x-1">
                                                    <Phone className="w-4 h-4" />
                                                    <span>Điện thoại</span>
                                                </span>
                                            }
                                        >
                                            {order.user.phone}
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>

                                <Card
                                    title={
                                        <div className="flex items-center space-x-2">
                                            <CreditCard className="w-5 h-5" />
                                            <span>Thông tin thanh toán</span>
                                        </div>
                                    }
                                    size="small"
                                >
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="Phương thức">
                                            <Tag color={order.paymentMethod === 'cod' ? 'orange' : 'blue'}>
                                                {order.paymentMethod === 'cod'
                                                    ? 'Thanh toán khi nhận hàng'
                                                    : 'Chuyển khoản'}
                                            </Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Tổng tiền hàng">
                                            {formatCurrency(order.totalPrice)}
                                        </Descriptions.Item>
                                        {order.coupon && (
                                            <Descriptions.Item
                                                label={
                                                    <span className="flex items-center space-x-1">
                                                        <Ticket className="w-4 h-4" />
                                                        <span>Mã giảm giá</span>
                                                    </span>
                                                }
                                            >
                                                <div>
                                                    <Tag color="red">{order.coupon.code}</Tag>
                                                    <span className="text-red-500">
                                                        -{formatCurrency(order.coupon.discountAmount)} (
                                                        {order.coupon.discount}%)
                                                    </span>
                                                </div>
                                            </Descriptions.Item>
                                        )}
                                        <Descriptions.Item label="Thành tiền">
                                            <span className="text-lg font-bold text-blue-600">
                                                {formatCurrency(order.finalPrice)}
                                            </span>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>
                            </div>

                            {/* Chi tiết sản phẩm */}
                            <Card
                                title={
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Package className="w-5 h-5" />
                                            <span>Chi tiết sản phẩm</span>
                                        </div>
                                        <Tag color="blue">{order.items.length} sản phẩm</Tag>
                                    </div>
                                }
                                className="overflow-hidden"
                            >
                                <Table
                                    columns={itemColumns}
                                    dataSource={order.items}
                                    pagination={false}
                                    rowKey="_id"
                                    size="small"
                                />
                            </Card>
                        </div>
                        </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* Review Modal */}
            <Modal
                title={
                    <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span>Đánh giá sản phẩm</span>
                    </div>
                }
                open={reviewModalVisible}
                onCancel={closeReviewModal}
                footer={null}
                width={600}
                className="review-modal"
            >
                {selectedProduct && (
                    <div className="space-y-6">
                        {/* Product Info */}
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <Image
                                width={80}
                                height={80}
                                src={`${import.meta.env.VITE_API_URL}/uploads/products/${
                                    Array.isArray(selectedProduct.image) 
                                        ? selectedProduct.image[0] || '' 
                                        : selectedProduct.image || ''
                                }`}
                                alt={selectedProduct.name}
                                className="rounded-lg object-cover"
                                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8E+UDNmyJUu2ZMmSLVmSBUuWLFmyZMmSJVmyZMuSJUu2bMmSJVuyZMmWLVmyZMvSbMmSLdmyJUuyZEmWJUu2ZMmSJUt2ZEuWLNmyJUuWbNmSJUuWLFmy9U="
                            />
                            <div className="flex-1">
                                <h4 className="font-semibold text-lg text-gray-900">{selectedProduct.name}</h4>
                                <div className="text-sm text-gray-500">
                                    Màu: {selectedProduct.color} | Size: {selectedProduct.size}
                                </div>
                                <div className="font-medium text-blue-600 mt-1">
                                    {formatCurrency(selectedProduct.priceAfterDiscount || selectedProduct.price)}
                                </div>
                            </div>
                        </div>

                        {/* Review Form */}
                        <Form form={reviewForm} layout="vertical" onFinish={submitReview} className="space-y-4">
                            {/* Rating */}
                            <Form.Item
                                label={
                                    <span className="flex items-center space-x-2">
                                        <Star className="w-4 h-4" />
                                        <span>Đánh giá chất lượng</span>
                                    </span>
                                }
                                name="rating"
                                rules={[{ required: true, message: 'Vui lòng chọn số sao đánh giá!' }]}
                            >
                                <Rate allowHalf className="text-2xl" />
                            </Form.Item>

                            {/* Comment */}
                            <Form.Item
                                label={
                                    <span className="flex items-center space-x-2">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Nhận xét của bạn (tùy chọn)</span>
                                    </span>
                                }
                                name="comment"
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                                    maxLength={500}
                                    showCount
                                />
                            </Form.Item>

                            {/* Upload Images */}
                            <Form.Item
                                label={
                                    <span className="flex items-center space-x-2">
                                        <Camera className="w-4 h-4" />
                                        <span>Thêm hình ảnh (tùy chọn)</span>
                                    </span>
                                }
                                name="images"
                            >
                                <Upload
                                    listType="picture-card"
                                    multiple
                                    accept="image/*"
                                    beforeUpload={() => false} // Prevent auto upload
                                    maxCount={5}
                                >
                                    <div className="flex flex-col items-center justify-center p-4">
                                        <Camera className="w-6 h-6 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-500">Thêm ảnh</span>
                                    </div>
                                </Upload>
                            </Form.Item>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <Button onClick={closeReviewModal} size="large">
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    icon={<Star className="w-4 h-4" />}
                                    disabled={submittingReview}
                                    loading={submittingReview}
                                    className="bg-yellow-500 hover:bg-yellow-600 border-yellow-500 hover:border-yellow-600"
                                >
                                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </Button>
                            </div>
                        </Form>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default OrderHistory;
