import { useEffect, useState, useRef } from 'react';
import {
    Table,
    Tag,
    Button,
    Modal,
    Descriptions,
    Image,
    Input,
    Select,
    Space,
    Card,
    Divider,
    Typography,
    Badge,
    Tooltip,
    message,
    Tabs,
} from 'antd';
import {
    Eye,
    Edit,
    Search,
    Filter,
    Package,
    User,
    Calendar,
    DollarSign,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    ShoppingBag,
    CreditCard,
    Wallet,
} from 'lucide-react';
import dayjs from 'dayjs';
import { requestGetAllOrder, requestUpdateOrderStatus } from '../../../config/PaymentsRequest';

const { Title, Text } = Typography;
const { Search: AntSearch } = Input;
const { Option } = Select;

function OrderAdmin() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const recentlyUpdatedOrderIdRef = useRef(null);

    useEffect(() => {
        fetchOrders();
    }, [searchText, statusFilter]); // Fetch lại khi searchText hoặc statusFilter thay đổi

    const fetchOrders = async () => {
        try {
            setLoading(true);
            // Fetch tất cả đơn hàng (không filter) để tính số lượng cho tabs
            const allOrdersRes = await requestGetAllOrder(searchText, 'all');
            setOrders(allOrdersRes.metadata || []);
            
            // Fetch đơn hàng đã filter để hiển thị trong bảng
            const filteredRes = await requestGetAllOrder(searchText, statusFilter);
            let filteredOrdersList = filteredRes.metadata || [];
            
            // Nếu có đơn hàng vừa cập nhật, đưa nó lên đầu danh sách
            if (recentlyUpdatedOrderIdRef.current) {
                const updatedOrderId = recentlyUpdatedOrderIdRef.current;
                const updatedOrder = filteredOrdersList.find(order => order._id === updatedOrderId);
                if (updatedOrder) {
                    filteredOrdersList = [
                        updatedOrder,
                        ...filteredOrdersList.filter(order => order._id !== updatedOrderId)
                    ];
                    // Reset sau khi đã sắp xếp
                    recentlyUpdatedOrderIdRef.current = null;
                }
            }
            
            setFilteredOrders(filteredOrdersList);
        } catch (error) {
            message.error('Lỗi khi tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            pending: 'orange',
            confirmed: 'blue',
            shipped: 'purple',
            delivered: 'green',
            cancelled: 'red',
        };
        return statusColors[status] || 'default';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: <Clock className="w-4 h-4" />,
            confirmed: <CheckCircle className="w-4 h-4" />,
            shipped: <Truck className="w-4 h-4" />,
            delivered: <Package className="w-4 h-4" />,
            cancelled: <XCircle className="w-4 h-4" />,
        };
        return icons[status] || <Clock className="w-4 h-4" />;
    };

    const getStatusText = (status) => {
        const statusTexts = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            shipped: 'Đang giao hàng',
            delivered: 'Đã giao hàng',
            cancelled: 'Đã hủy',
        };
        return statusTexts[status] || status;
    };

    // Hàm kiểm tra xem một trạng thái có bị vô hiệu hóa không dựa trên trạng thái hiện tại
    const isStatusDisabled = (optionStatus, currentStatus) => {
        // Nếu đơn hàng đã bị hủy, tất cả các trạng thái đều bị vô hiệu hóa
        if (currentStatus === 'cancelled') {
            return true;
        }

        // Nếu đơn hàng đã giao hàng, chỉ có thể giữ nguyên trạng thái delivered
        if (currentStatus === 'delivered') {
            return optionStatus !== 'delivered';
        }

        // Định nghĩa thứ tự của các trạng thái
        const statusOrder = {
            pending: 1,
            confirmed: 2,
            shipped: 3,
            delivered: 4,
        };

        const currentOrder = statusOrder[currentStatus] || 0;
        const optionOrder = statusOrder[optionStatus] || 0;

        // Vô hiệu hóa các trạng thái có thứ tự nhỏ hơn trạng thái hiện tại
        // Ví dụ: nếu đang ở 'shipped' (3), thì 'pending' (1) và 'confirmed' (2) sẽ bị vô hiệu hóa
        return optionOrder < currentOrder;
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await requestUpdateOrderStatus(orderId, newStatus);

            // Cập nhật cả orders và filteredOrders để UI được cập nhật ngay lập tức
            setOrders((prevOrders) =>
                prevOrders.map((order) => (order._id === orderId ? { ...order, status: newStatus } : order)),
            );
            
            // Lưu orderId vào ref để đưa lên đầu khi admin vào tab tương ứng
            const validStatusTabs = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
            if (validStatusTabs.includes(newStatus)) {
                recentlyUpdatedOrderIdRef.current = orderId;
            }
            
            // Cập nhật filteredOrders
            // Nếu đơn hàng có trong danh sách hiện tại (tab 'all' hoặc tab khớp với status cũ), đưa lên đầu
            // Nếu không, chỉ cập nhật status (đơn hàng sẽ biến mất khỏi tab hiện tại nếu tab không khớp)
            setFilteredOrders((prevFilteredOrders) => {
                const updatedOrder = prevFilteredOrders.find(order => order._id === orderId);
                if (updatedOrder) {
                    // Đơn hàng có trong danh sách, cập nhật status và đưa lên đầu
                    const updatedOrderWithNewStatus = { ...updatedOrder, status: newStatus };
                    // Chỉ đưa lên đầu nếu tab hiện tại là 'all' hoặc khớp với trạng thái mới
                    if (statusFilter === 'all' || statusFilter === newStatus) {
                        return [
                            updatedOrderWithNewStatus,
                            ...prevFilteredOrders.filter(order => order._id !== orderId)
                        ];
                    } else {
                        // Tab không khớp, chỉ cập nhật status (đơn hàng sẽ biến mất)
                        return prevFilteredOrders.map((order) => 
                            order._id === orderId ? { ...order, status: newStatus } : order
                        );
                    }
                } else {
                    // Đơn hàng không có trong danh sách, chỉ cập nhật (không ảnh hưởng gì)
                    return prevFilteredOrders;
                }
            });
            
            // Cập nhật selectedOrder nếu đang mở modal
            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
            
            message.success('Cập nhật trạng thái đơn hàng thành công');
        } catch (error) {
            console.error('Error updating order status:', error);
            message.error('Lỗi khi cập nhật trạng thái đơn hàng');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const getPaymentMethodBadge = (paymentMethod) => {
        const paymentMethods = {
            momo: {
                label: 'MoMo',
                color: '#A50064', // Màu đặc trưng của MoMo
                bgColor: '#FFF0F5',
                icon: <CreditCard className="w-3 h-3" />,
            },
            vnpay: {
                label: 'VNPay',
                color: '#134FA0', // Màu đặc trưng của VNPay
                bgColor: '#E6F2FF',
                icon: <CreditCard className="w-3 h-3" />,
            },
            cod: {
                label: 'COD',
                color: '#FF6B00', // Màu cam cho COD
                bgColor: '#FFF4E6',
                icon: <Wallet className="w-3 h-3" />,
            },
        };

        const method = paymentMethods[paymentMethod] || {
            label: paymentMethod || 'N/A',
            color: '#666',
            bgColor: '#F5F5F5',
            icon: <CreditCard className="w-3 h-3" />,
        };

        return (
            <Tag
                style={{
                    backgroundColor: method.bgColor,
                    color: method.color,
                    border: `1px solid ${method.color}`,
                    fontWeight: '600',
                }}
                className="flex items-center gap-1"
            >
                {method.icon}
                {method.label}
            </Tag>
        );
    };

    const showOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsModalVisible(true);
    };

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: '_id',
            key: '_id',
            width: 200,
            render: (id) => (
                <Text code className="text-blue-600">
                    {id.slice(-8)}
                </Text>
            ),
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'items',
            key: 'items',
            width: 250,
            render: (items) => {
                if (!items || items.length === 0) {
                    return <span className="text-gray-400 text-sm">Không có sản phẩm</span>;
                }
                const firstItem = items[0];
                const imageUrl = Array.isArray(firstItem.image) 
                    ? firstItem.image[0] || '' 
                    : firstItem.image || '';
                return (
                    <div className="flex items-center space-x-3">
                        <Image
                            width={50}
                            height={50}
                            src={`${import.meta.env.VITE_URL_IMAGE}/uploads/products/${imageUrl}`}
                            alt={firstItem.name}
                            className="rounded-lg object-cover"
                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8E+UDNmyJUu2ZMmSLVmSBUuWLFmyZMmSJVmyZMuSJUu2bMmSJVuyZMmWLVmyZMvSbMmSLdmyJUuyZEmWJUu2ZMmSJUt2ZEuWLNmyJUuWbNmSJUuWLFmy9U="
                        />
                        <div>
                            <div className="font-medium text-gray-900 max-w-xs truncate">{firstItem.name}</div>
                            <div className="text-sm text-gray-500">
                                {items.length > 1 ? `+${items.length - 1} sản phẩm khác` : `Màu: ${firstItem.color} | Size: ${firstItem.size}`}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Khách hàng',
            dataIndex: 'user',
            key: 'user',
            width: 200,
            render: (user) => (
                <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                        <div className="font-medium">{user?.fullName}</div>
                        <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                </div>
            ),
        },

        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            width: 120,
            align: 'right',
            render: (price, record) => (
                <div>
                    <div className="font-semibold text-green-600">{formatPrice(record.finalPrice || price)}</div>
                    {record.coupon && (
                        <Tag color="red" size="small">
                            Giảm {record.coupon.discount}%
                        </Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Phương thức thanh toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            width: 150,
            render: (paymentMethod) => getPaymentMethodBadge(paymentMethod),
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            render: (date) => (
                <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{dayjs(date).format('DD/MM/YYYY')}</span>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status) => (
                <Tag className="flex items-center" color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="primary"
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => showOrderDetails(record)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title={record.status === 'cancelled' ? 'Đơn hàng đã bị hủy, không thể thay đổi trạng thái' : 'Thay đổi trạng thái đơn hàng'}>
                        <Select
                            value={record.status}
                            className="w-32"
                            onChange={(value) => updateOrderStatus(record._id, value)}
                            size="small"
                            disabled={record.status === 'cancelled'}
                        >
                            <Option value="pending" disabled={isStatusDisabled('pending', record.status)}>
                                <Space>
                                    <Clock className="w-3 h-3" />
                                    Chờ xác nhận
                                </Space>
                            </Option>
                            <Option value="confirmed" disabled={isStatusDisabled('confirmed', record.status)}>
                                <Space>
                                    <CheckCircle className="w-3 h-3" />
                                    Đã xác nhận
                                </Space>
                            </Option>
                            <Option value="shipped" disabled={isStatusDisabled('shipped', record.status)}>
                                <Space>
                                    <Truck className="w-3 h-3" />
                                    Đang giao hàng
                                </Space>
                            </Option>
                            <Option value="delivered" disabled={isStatusDisabled('delivered', record.status)}>
                                <Space>
                                    <Package className="w-3 h-3" />
                                    Đã giao hàng
                                </Space>
                            </Option>
                        </Select>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // Calculate status counts
    const getStatusCount = () => {
        const counts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});
        return counts;
    };

    const statusCounts = getStatusCount();

    // Tab items with counts
    const tabItems = [
        {
            key: 'all',
            label: (
                <span>
                    Tất cả
                    {orders.length > 0 && (
                        <Badge count={orders.length} style={{ marginLeft: 8 }} />
                    )}
                </span>
            ),
        },
        {
            key: 'pending',
            label: (
                <span>
                    Chờ xác nhận
                    {statusCounts.pending > 0 && (
                        <Badge count={statusCounts.pending} style={{ marginLeft: 8 }} />
                    )}
                </span>
            ),
        },
        {
            key: 'confirmed',
            label: (
                <span>
                    Đã xác nhận
                    {statusCounts.confirmed > 0 && (
                        <Badge count={statusCounts.confirmed} style={{ marginLeft: 8 }} />
                    )}
                </span>
            ),
        },
        {
            key: 'shipped',
            label: (
                <span>
                    Đang giao hàng
                    {statusCounts.shipped > 0 && (
                        <Badge count={statusCounts.shipped} style={{ marginLeft: 8 }} />
                    )}
                </span>
            ),
        },
        {
            key: 'delivered',
            label: (
                <span>
                    Đã giao hàng
                    {statusCounts.delivered > 0 && (
                        <Badge count={statusCounts.delivered} style={{ marginLeft: 8 }} />
                    )}
                </span>
            ),
        },
        {
            key: 'cancelled',
            label: (
                <span>
                    Đã hủy
                    {statusCounts.cancelled > 0 && (
                        <Badge count={statusCounts.cancelled} style={{ marginLeft: 8 }} />
                    )}
                </span>
            ),
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Card className="shadow-sm mb-4">
                <div className="mb-4">
                    <Title level={2} className="flex items-center space-x-2 mb-4">
                        <Package className="w-8 h-8 text-blue-600" />
                        <span>Quản lý đơn hàng</span>
                    </Title>

                    <div className="mb-4">
                        <AntSearch
                            placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng, email..."
                            allowClear
                            className="w-full"
                            prefix={<Search className="w-4 h-4 text-gray-400" />}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            <Card className="shadow-sm">
                <Tabs
                    activeKey={statusFilter}
                    onChange={setStatusFilter}
                    items={tabItems}
                    className="order-tabs"
                />
            </Card>

            <Card className="overflow-hidden mt-4">
                <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        dataSource={filteredOrders}
                        loading={loading}
                        rowKey="_id"
                        pagination={{
                            total: filteredOrders.length,
                            pageSize: 10,
                            showSizeChanger: false,
                            showQuickJumper: false,
                            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
                        }}
                        scroll={{ x: 'max-content' }}
                        className="bg-white rounded-lg"
                    />
                </div>
            </Card>

            {/* Order Details Modal */}
            <Modal
                title={
                    <div className="flex items-center space-x-2">
                        <Eye className="w-5 h-5 text-blue-600" />
                        <span>Chi tiết đơn hàng #{selectedOrder?._id.slice(-8)}</span>
                    </div>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={800}
                className="order-details-modal"
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        {/* Order Info */}
                        <Card title="Thông tin đơn hàng" size="small">
                            <Descriptions column={2}>
                                <Descriptions.Item label="Mã đơn hàng">
                                    <Text code>{selectedOrder._id}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngày đặt">
                                    {dayjs(selectedOrder.createdAt).format('DD/MM/YYYY HH:mm')}
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">
                                    <Tag
                                        color={getStatusColor(selectedOrder.status)}
                                        icon={getStatusIcon(selectedOrder.status)}
                                    >
                                        {getStatusText(selectedOrder.status)}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Phương thức thanh toán">
                                    <Tag color="blue">{selectedOrder.paymentMethod?.toUpperCase()}</Tag>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* Customer Info */}
                        <Card title="Thông tin khách hàng" size="small">
                            <Descriptions column={2}>
                                <Descriptions.Item label="Họ tên">{selectedOrder.user?.fullName}</Descriptions.Item>
                                <Descriptions.Item label="Email">{selectedOrder.user?.email}</Descriptions.Item>
                                <Descriptions.Item label="Số điện thoại">
                                    {selectedOrder.user?.phone || 'Chưa cập nhật'}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* Order Items */}
                        <Card title="Sản phẩm đặt hàng" size="small">
                            <div className="space-y-4">
                                {selectedOrder.items?.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}/uploads/products/${
                                                    Array.isArray(item.image) 
                                                        ? item.image[0] || '' 
                                                        : item.image || ''
                                                }`}
                                                alt={item.name}
                                                className="w-full h-full object-cover rounded-lg"
                                                onError={(e) => {
                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="10"%3ENo image%3C/text%3E%3C/svg%3E';
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-sm text-gray-500">
                                                Màu: {item.color} | Size: {item.size}
                                            </div>
                                            <div className="text-sm">Số lượng: {item.quantity} sản phẩm</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold">{formatPrice(item.subtotal)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Order Summary */}
                        <Card title="Tổng kết đơn hàng" size="small">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Tổng tiền hàng:</span>
                                    <span>{formatPrice(selectedOrder.totalPrice)}</span>
                                </div>
                                {selectedOrder.coupon && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Giảm giá ({selectedOrder.coupon.code}):</span>
                                        <span>-{formatPrice(selectedOrder.coupon.discountAmount)}</span>
                                    </div>
                                )}
                                <Divider className="my-2" />
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Thành tiền:</span>
                                    <span className="text-green-600">{formatPrice(selectedOrder.finalPrice)}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default OrderAdmin;
