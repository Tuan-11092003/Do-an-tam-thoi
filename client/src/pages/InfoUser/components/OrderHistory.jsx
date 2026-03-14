import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requestGetOrderHistory, requestCancelOrder } from '../../../services/payment/paymentService';
import {
    Table,
    Tag,
    Image,
    Collapse,
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
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    Package,
    Calendar,
    Star,
    Camera,
    MessageSquare,
    X,
    ChevronRight,
    ArrowRight,
} from 'lucide-react';
import { requestCreatePreviewProduct } from '../../../services/previewProduct/previewProductService';
import { formatPrice } from '../../../utils/formatPrice';
import { getImageUrl } from '../../../utils/imageUrl';

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

    // Định dạng ngày giờ theo format đặc biệt của trang lịch sử đơn hàng
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
                <Link
                    to={record.idProduct ? `/product/${record.idProduct}` : '#'}
                    className="flex items-center space-x-3 hover:opacity-90 transition-opacity cursor-pointer"
                >
                    <Image
                        width={60}
                        height={60}
                        src={getImageUrl(
                            Array.isArray(record.image) ? record.image[0] || '' : record.image || '',
                            'products'
                        )}
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
                </Link>
            ),
            width: 300,
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            align: 'right',
            render: (price, record) => (
                <div className="text-right">
                    {record.discount > 0 ? (
                        <>
                            <div className="text-sm text-gray-400 line-through">{formatPrice(price)}</div>
                            <div className="font-semibold text-red-500">
                                {formatPrice(record.priceAfterDiscount)}
                            </div>
                        </>
                    ) : (
                        <div className="font-semibold">{formatPrice(price)}</div>
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
            align: 'right',
            render: (subtotal) => (
                <div className="text-right font-semibold text-blue-600">{formatPrice(subtotal)}</div>
            ),
            width: 120,
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (text, record) => {
                // Tìm order từ context để check status
                const currentOrder = orders.find((order) => order.items.some((item) => item._id === record._id));

                // Chỉ cho phép đánh giá khi đơn hàng đã được giao (status = 'delivered')
                if (currentOrder?.status !== 'delivered') {
                    return <span className="text-gray-400 text-sm">Chưa giao hàng</span>;
                }

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
            <div className="flex flex-col justify-center items-center min-h-[320px] rounded-2xl border border-gray-200 bg-gray-50/50">
                <Spin size="large" />
                <p className="mt-4 text-sm text-gray-500">Đang tải đơn hàng...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white py-16 shadow-sm">
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span className="text-gray-500">Bạn chưa có đơn hàng nào</span>
                    }
                    className="py-8"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                    >
                        <ArrowRight className="h-4 w-4" />
                        Mua sắm ngay
                    </Link>
                </Empty>
            </div>
        );
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
        <div className="space-y-6">
            <style>{`
                .order-history-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 1px solid #e2e8f0;
                }
                .order-history-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9;
                }
                .order-history-table .ant-table-tbody > tr:hover > td {
                    background: #f8fafc !important;
                }
                .order-history-table .ant-table {
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
            `}</style>
            {/* Header */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-100 p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 text-red-500">
                        <ShoppingBag className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Lịch sử đơn hàng</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Theo dõi và quản lý các đơn hàng của bạn
                        </p>
                    </div>
                    <div className="ml-auto">
                        <span className="inline-flex items-center rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-100">
                            {orders.length} đơn hàng
                        </span>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {orders.map((order) => (
                    <div
                        key={order._id}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300"
                    >
                        <div
                            className="flex flex-wrap items-center justify-between gap-4 p-5 cursor-pointer sm:p-6"
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
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-transform duration-200 group-hover:bg-gray-200">
                                    <ChevronRight
                                        className={`h-5 w-5 transition-transform duration-200 ${
                                            expandedOrders.has(order._id) ? 'rotate-90' : ''
                                        }`}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-gray-900">
                                            Mã đơn hàng <span className="font-mono text-red-600">#{order._id.slice(-8)}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                        <Calendar className="h-4 w-4 flex-shrink-0" />
                                        <span>{formatDate(order.createdAt)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${getStatusBadgeStyle(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    {getStatusText(order.status)}
                                </span>

                                {canCancelOrder(order.status) && (
                                    <Popconfirm
                                        title="Hủy đơn hàng này?"
                                        description="Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác."
                                        onConfirm={(e) => {
                                            e?.stopPropagation?.();
                                            handleCancelOrder(order._id);
                                        }}
                                        okText="Xác nhận hủy"
                                        cancelText="Không"
                                        okButtonProps={{
                                            danger: true,
                                            loading: cancellingOrderId === order._id,
                                        }}
                                    >
                                        <Button
                                            danger
                                            size="small"
                                            icon={<X className="h-4 w-4" />}
                                            loading={cancellingOrderId === order._id}
                                            disabled={cancellingOrderId === order._id}
                                            className="flex items-center gap-1.5 rounded-lg border-red-200 bg-red-50 text-red-700 hover:!bg-red-100 hover:!border-red-300"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Hủy đơn
                                        </Button>
                                    </Popconfirm>
                                )}

                                <div className="text-right min-w-[100px]">
                                    <div className="text-lg font-bold text-blue-600">
                                        {formatPrice(order.finalPrice)}
                                    </div>
                                    {order.totalPrice !== order.finalPrice && (
                                        <div className="text-xs text-gray-400 line-through">
                                            {formatPrice(order.totalPrice)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Details */}
                        {expandedOrders.has(order._id) && (
                            <div
                                className="border-t border-gray-100 bg-gray-50/50 px-5 pb-5 sm:px-6 sm:pb-6 pt-4"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-5 w-5 text-gray-600" />
                                            <span className="font-semibold text-gray-900">Chi tiết sản phẩm</span>
                                        </div>
                                        <Tag className="rounded-full" color="blue">
                                            {order.items.length} sản phẩm
                                        </Tag>
                                    </div>
                                    <Table
                                        columns={itemColumns}
                                        dataSource={order.items}
                                        pagination={false}
                                        rowKey="_id"
                                        size="middle"
                                        className="order-history-table"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
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
                                src={getImageUrl(
                                    Array.isArray(selectedProduct.image) ? selectedProduct.image[0] || '' : selectedProduct.image || '',
                                    'products'
                                )}
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
                                    {formatPrice(selectedProduct.priceAfterDiscount || selectedProduct.price)}
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
