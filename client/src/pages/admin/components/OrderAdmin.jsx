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
    Divider,
    Typography,
    Badge,
    Tooltip,
    message,
    Tabs,
    Empty,
} from 'antd';
import {
    Eye,
    Search,
    Package,
    User,
    Calendar,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    ShoppingBag,
    CreditCard,
    Wallet,
    RefreshCw,
    Hash,
    MapPin,
    Phone,
    Mail,
} from 'lucide-react';
import dayjs from 'dayjs';
import { requestGetAllOrder, requestUpdateOrderStatus } from '../../../services/payment/paymentService';
import { formatPrice } from '../../../utils/formatPrice';

const { Text } = Typography;
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
    }, [searchText, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const allOrdersRes = await requestGetAllOrder(searchText, 'all');
            setOrders(allOrdersRes.metadata || []);

            const filteredRes = await requestGetAllOrder(searchText, statusFilter);
            let filteredOrdersList = filteredRes.metadata || [];

            if (recentlyUpdatedOrderIdRef.current) {
                const updatedOrderId = recentlyUpdatedOrderIdRef.current;
                const updatedOrder = filteredOrdersList.find((order) => order._id === updatedOrderId);
                if (updatedOrder) {
                    filteredOrdersList = [updatedOrder, ...filteredOrdersList.filter((order) => order._id !== updatedOrderId)];
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

    const statusConfig = {
        pending: { color: 'orange', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Chờ xác nhận', icon: <Clock className="w-3.5 h-3.5" /> },
        confirmed: { color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Đã xác nhận', icon: <CheckCircle className="w-3.5 h-3.5" /> },
        shipped: { color: 'purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Đang giao hàng', icon: <Truck className="w-3.5 h-3.5" /> },
        delivered: { color: 'green', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Đã giao hàng', icon: <Package className="w-3.5 h-3.5" /> },
        cancelled: { color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Đã hủy', icon: <XCircle className="w-3.5 h-3.5" /> },
    };

    const getStatusColor = (status) => statusConfig[status]?.color || 'default';
    const getStatusText = (status) => statusConfig[status]?.label || status;
    const getStatusIcon = (status) => statusConfig[status]?.icon || <Clock className="w-3.5 h-3.5" />;

    const isStatusDisabled = (optionStatus, currentStatus) => {
        if (currentStatus === 'cancelled') return true;
        if (currentStatus === 'delivered') return optionStatus !== 'delivered';
        const statusOrder = { pending: 1, confirmed: 2, shipped: 3, delivered: 4 };
        return (statusOrder[optionStatus] || 0) < (statusOrder[currentStatus] || 0);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await requestUpdateOrderStatus(orderId, newStatus);
            setOrders((prev) => prev.map((order) => (order._id === orderId ? { ...order, status: newStatus } : order)));

            const validStatusTabs = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
            if (validStatusTabs.includes(newStatus)) recentlyUpdatedOrderIdRef.current = orderId;

            setFilteredOrders((prev) => {
                const updatedOrder = prev.find((order) => order._id === orderId);
                if (updatedOrder) {
                    const updated = { ...updatedOrder, status: newStatus };
                    if (statusFilter === 'all' || statusFilter === newStatus) {
                        return [updated, ...prev.filter((order) => order._id !== orderId)];
                    }
                    return prev.map((order) => (order._id === orderId ? { ...order, status: newStatus } : order));
                }
                return prev;
            });

            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }

            message.success('Cập nhật trạng thái thành công');
        } catch (error) {
            message.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const getPaymentMethodBadge = (paymentMethod) => {
        const methods = {
            momo: { label: 'MoMo', color: '#A50064', bg: '#FFF0F5', icon: <CreditCard className="w-3 h-3" /> },
            vnpay: { label: 'VNPay', color: '#134FA0', bg: '#E6F2FF', icon: <CreditCard className="w-3 h-3" /> },
            cod: { label: 'COD', color: '#FF6B00', bg: '#FFF4E6', icon: <Wallet className="w-3 h-3" /> },
        };
        const m = methods[paymentMethod] || { label: paymentMethod || 'N/A', color: '#666', bg: '#F5F5F5', icon: <CreditCard className="w-3 h-3" /> };
        return (
            <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: m.bg, color: m.color, border: `1px solid ${m.color}20` }}
            >
                {m.icon} {m.label}
            </span>
        );
    };

    const showOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsModalVisible(true);
    };

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: '_id',
            key: '_id',
            width: 120,
            render: (id) => (
                <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                    <Hash className="w-3 h-3" />
                    {id.slice(-8).toUpperCase()}
                </span>
            ),
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'items',
            key: 'items',
            render: (items) => {
                if (!items || items.length === 0) return <span className="text-gray-400 text-sm">Không có sản phẩm</span>;
                const firstItem = items[0];
                const imageUrl = Array.isArray(firstItem.image) ? firstItem.image[0] || '' : firstItem.image || '';
                return (
                    <div className="flex items-center gap-3">
                        <img
                            src={`${import.meta.env.VITE_URL_IMAGE}/uploads/products/${imageUrl}`}
                            alt={firstItem.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                        />
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate max-w-[220px]">{firstItem.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {items.length > 1 ? `+${items.length - 1} sản phẩm khác` : `${firstItem.color} · Size ${firstItem.size}`}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Khách hàng',
            dataIndex: 'user',
            key: 'user',
            width: 180,
            render: (user) => (
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                        <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{user?.fullName}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                </div>
            ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            width: 140,
            align: 'right',
            render: (price, record) => (
                <div>
                    <p className="font-bold text-gray-900">{formatPrice(record.finalPrice || price)}</p>
                    {record.coupon && (
                        <Tag color="red" className="rounded-full border-0 text-[10px] mt-0.5">
                            -{record.coupon.discount}%
                        </Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Thanh toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            width: 110,
            align: 'center',
            render: (method) => getPaymentMethodBadge(method),
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 110,
            render: (date) => (
                <span className="text-sm text-gray-500">{dayjs(date).format('DD/MM/YYYY')}</span>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status) => {
                const cfg = statusConfig[status] || {};
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        {cfg.icon}
                        {cfg.label}
                    </span>
                );
            },
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 200,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => showOrderDetails(record)}
                            size="small"
                            className="border-blue-200 text-blue-600 hover:!bg-blue-50 hover:!border-blue-300"
                        />
                    </Tooltip>
                    <Select
                        value={record.status}
                        className="w-[140px]"
                        onChange={(value) => updateOrderStatus(record._id, value)}
                        size="small"
                        disabled={record.status === 'cancelled' || record.status === 'delivered'}
                    >
                        <Option value="pending" disabled={isStatusDisabled('pending', record.status)}>
                            <Space><Clock className="w-3 h-3" />Chờ xác nhận</Space>
                        </Option>
                        <Option value="confirmed" disabled={isStatusDisabled('confirmed', record.status)}>
                            <Space><CheckCircle className="w-3 h-3" />Đã xác nhận</Space>
                        </Option>
                        <Option value="shipped" disabled={isStatusDisabled('shipped', record.status)}>
                            <Space><Truck className="w-3 h-3" />Đang giao</Space>
                        </Option>
                        <Option value="delivered" disabled={isStatusDisabled('delivered', record.status)}>
                            <Space><Package className="w-3 h-3" />Đã giao</Space>
                        </Option>
                    </Select>
                </Space>
            ),
        },
    ];

    const statusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {});

    const tabItems = [
        { key: 'all', count: orders.length, label: 'Tất cả', dotColor: 'bg-gray-400' },
        { key: 'pending', count: statusCounts.pending || 0, label: 'Chờ xác nhận', dotColor: 'bg-amber-400' },
        { key: 'confirmed', count: statusCounts.confirmed || 0, label: 'Đã xác nhận', dotColor: 'bg-blue-400' },
        { key: 'shipped', count: statusCounts.shipped || 0, label: 'Đang giao', dotColor: 'bg-purple-400' },
        { key: 'delivered', count: statusCounts.delivered || 0, label: 'Đã giao', dotColor: 'bg-emerald-400' },
        { key: 'cancelled', count: statusCounts.cancelled || 0, label: 'Đã hủy', dotColor: 'bg-red-400' },
    ].map((item) => ({
        key: item.key,
        label: (
            <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${item.dotColor}`} />
                {item.label}
                {item.count > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                        {item.count}
                    </span>
                )}
            </span>
        ),
    }));

    return (
        <div className="space-y-6">
            <style>{`
                .order-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                    padding: 14px 16px;
                }
                .order-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9;
                    padding: 12px 16px;
                }
                .order-table .ant-table-tbody > tr:hover > td {
                    background: #f8fafc !important;
                }
                .order-table .ant-table-container {
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
                .order-tabs .ant-tabs-tab {
                    padding: 10px 4px !important;
                }
                .order-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #2563eb !important;
                    font-weight: 600;
                }
                .order-tabs .ant-tabs-ink-bar {
                    background: #2563eb !important;
                }
            `}</style>

            {/* Header */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý đơn hàng</h1>
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                    {orders.length} đơn hàng
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">Theo dõi và quản lý tất cả đơn hàng</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Input
                            placeholder="Tìm kiếm đơn hàng..."
                            prefix={<Search className="w-4 h-4 text-gray-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-64 rounded-lg"
                            allowClear
                        />
                        <Tooltip title="Tải lại">
                            <Button
                                icon={<RefreshCw className="w-4 h-4" />}
                                onClick={fetchOrders}
                                loading={loading}
                                className="rounded-lg"
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* Tabs + Table */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 pt-4">
                    <Tabs
                        activeKey={statusFilter}
                        onChange={setStatusFilter}
                        items={tabItems}
                        className="order-tabs"
                    />
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredOrders}
                    loading={loading}
                    rowKey="_id"
                    className="order-table"
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        total: filteredOrders.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
                        className: 'px-4 py-3',
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={<span className="text-gray-500">{searchText ? 'Không tìm thấy đơn hàng nào' : 'Chưa có đơn hàng nào'}</span>}
                            />
                        ),
                    }}
                />
            </div>

            {/* Order Details Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Eye className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Chi tiết đơn hàng</span>
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                            #{selectedOrder?._id.slice(-8).toUpperCase()}
                        </span>
                    </div>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={680}
                centered
            >
                {selectedOrder && (
                    <div className="space-y-5 mt-4">
                        {/* Status + Date */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const cfg = statusConfig[selectedOrder.status] || {};
                                    return (
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.text}`}>
                                            {cfg.icon}
                                            {cfg.label}
                                        </span>
                                    );
                                })()}
                                {getPaymentMethodBadge(selectedOrder.paymentMethod)}
                            </div>
                            <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {dayjs(selectedOrder.createdAt).format('DD/MM/YYYY HH:mm')}
                            </span>
                        </div>

                        {/* Customer Info */}
                        <div className="rounded-xl border border-gray-200 p-4">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                Thông tin khách hàng
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                    <span>{selectedOrder.user?.fullName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="truncate">{selectedOrder.user?.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                    <span>{selectedOrder.user?.phone || 'Chưa cập nhật'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="rounded-xl border border-gray-200 p-4">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                Sản phẩm ({selectedOrder.items?.length || 0})
                            </h4>
                            <div className="space-y-3">
                                {selectedOrder.items?.map((item, index) => {
                                    const imgUrl = Array.isArray(item.image) ? item.image[0] || '' : item.image || '';
                                    return (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}/uploads/products/${imgUrl}`}
                                                alt={item.name}
                                                className="w-14 h-14 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                                                onError={(e) => {
                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="56" height="56"%3E%3Crect width="56" height="56" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="9"%3ENo img%3C/text%3E%3C/svg%3E';
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{item.color} · Size {item.size} · SL: {item.quantity}</p>
                                            </div>
                                            <p className="font-semibold text-gray-900 text-sm flex-shrink-0">{formatPrice(item.subtotal)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="rounded-xl border border-gray-200 p-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Tổng tiền hàng</span>
                                    <span>{formatPrice(selectedOrder.totalPrice)}</span>
                                </div>
                                {selectedOrder.coupon && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Giảm giá ({selectedOrder.coupon.code})</span>
                                        <span>-{formatPrice(selectedOrder.coupon.discountAmount)}</span>
                                    </div>
                                )}
                                <Divider className="!my-2" />
                                <div className="flex justify-between text-base font-bold">
                                    <span className="text-gray-800">Thành tiền</span>
                                    <span className="text-emerald-600">{formatPrice(selectedOrder.finalPrice)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default OrderAdmin;
