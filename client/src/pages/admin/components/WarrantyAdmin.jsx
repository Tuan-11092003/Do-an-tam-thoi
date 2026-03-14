import { useEffect, useState, useRef } from 'react';
import { requestGetWarrantyByAdmin, requestUpdateWarrantyStatus } from '../../../services/warranty/warrantyService';
import {
    Table,
    Button,
    Modal,
    Select,
    Input,
    Space,
    Tooltip,
    message,
    Tabs,
    Empty,
    Image,
    Divider,
} from 'antd';
import {
    Shield,
    Clock,
    CheckCircle,
    XCircle,
    Package,
    Calendar,
    User,
    Eye,
    Check,
    X,
    RefreshCw,
    Search,
    Hash,
    Mail,
    FileText,
    ImageIcon,
    AlertTriangle,
} from 'lucide-react';
import { formatDateTime as formatDate } from '../../../utils/formatDate';
import { getImageUrl } from '../../../utils/imageUrl';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

function WarrantyAdmin() {
    const [warranty, setWarranty] = useState([]);
    const [filteredWarranty, setFilteredWarranty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedWarranty, setSelectedWarranty] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchText, setSearchText] = useState('');
    const recentlyUpdatedWarrantyIdRef = useRef(null);

    const fetchWarranty = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const res = await requestGetWarrantyByAdmin();
            let warrantyList = res.metadata || [];
            setWarranty(warrantyList);

            let filteredList = statusFilter === 'all' ? warrantyList : warrantyList.filter((item) => item.status === statusFilter);

            if (searchText.trim()) {
                const keyword = searchText.toLowerCase().trim();
                filteredList = filteredList.filter(
                    (item) =>
                        item.productId?.name?.toLowerCase().includes(keyword) ||
                        item.userId?.email?.toLowerCase().includes(keyword) ||
                        item._id?.toLowerCase().includes(keyword),
                );
            }

            if (recentlyUpdatedWarrantyIdRef.current) {
                const updatedId = recentlyUpdatedWarrantyIdRef.current;
                const updated = filteredList.find((item) => item._id === updatedId);
                if (updated) {
                    filteredList = [updated, ...filteredList.filter((item) => item._id !== updatedId)];
                    recentlyUpdatedWarrantyIdRef.current = null;
                }
            }

            setFilteredWarranty(filteredList);
        } catch (error) {
            message.error('Lỗi khi tải danh sách bảo hành');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarranty();
    }, [statusFilter, searchText]);

    const statusConfig = {
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Đang chờ xử lý', icon: <Clock className="w-3.5 h-3.5" />, dotColor: 'bg-amber-400' },
        approved: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Đã chấp nhận', icon: <CheckCircle className="w-3.5 h-3.5" />, dotColor: 'bg-blue-400' },
        completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Hoàn thành', icon: <Package className="w-3.5 h-3.5" />, dotColor: 'bg-emerald-400' },
        rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Từ chối', icon: <XCircle className="w-3.5 h-3.5" />, dotColor: 'bg-red-400' },
    };

    const getStatusText = (status) => statusConfig[status]?.label || 'Không xác định';

    const isStatusDisabled = (optionStatus, currentStatus) => {
        if (currentStatus === 'rejected' || currentStatus === 'completed') return true;
        const statusOrder = { pending: 1, approved: 2, completed: 3 };
        if (optionStatus === 'rejected') return currentStatus !== 'pending';
        return (statusOrder[optionStatus] || 0) < (statusOrder[currentStatus] || 0);
    };

    const getReasonText = (reason) => {
        const reasons = {
            defect: 'Sản phẩm bị lỗi',
            wrong_size: 'Sai size',
            wrong_color: 'Sai màu sắc',
            damaged: 'Hư hại trong vận chuyển',
            not_as_described: 'Không đúng mô tả',
            other: 'Khác',
        };
        return reasons[reason] || reason || 'Chưa có lý do';
    };

    const getProductImage = (product) => {
        const color = product?.colors?.[0];
        if (!color?.images) return '';
        return Array.isArray(color.images) ? color.images[0] || '' : color.images;
    };

    const openDetailModal = (item) => {
        setSelectedWarranty(item);
        setDetailModalVisible(true);
    };

    const closeDetailModal = () => {
        setDetailModalVisible(false);
        setSelectedWarranty(null);
    };

    const updateWarrantyStatus = async (warrantyId, newStatus) => {
        const oldWarranty = warranty.find((item) => item._id === warrantyId);
        const oldStatus = oldWarranty?.status;

        try {
            setUpdating(true);
            recentlyUpdatedWarrantyIdRef.current = warrantyId;

            setWarranty((prev) => prev.map((item) => (item._id === warrantyId ? { ...item, status: newStatus } : item)));

            setFilteredWarranty((prev) => {
                const updated = prev.find((item) => item._id === warrantyId);
                if (updated) {
                    const withNewStatus = { ...updated, status: newStatus };
                    if (statusFilter === 'all' || statusFilter === newStatus) {
                        return [withNewStatus, ...prev.filter((item) => item._id !== warrantyId)];
                    }
                    return prev.map((item) => (item._id === warrantyId ? { ...item, status: newStatus } : item));
                }
                return prev;
            });

            if (selectedWarranty && selectedWarranty._id === warrantyId) {
                setSelectedWarranty({ ...selectedWarranty, status: newStatus });
            }

            message.success('Cập nhật trạng thái thành công');
            if (detailModalVisible) closeDetailModal();

            try {
                await requestUpdateWarrantyStatus(warrantyId, newStatus);
                fetchWarranty(false).catch(() => {});
            } catch {
                if (oldStatus) {
                    setWarranty((prev) => prev.map((item) => (item._id === warrantyId ? { ...item, status: oldStatus } : item)));
                    if (selectedWarranty && selectedWarranty._id === warrantyId) {
                        setSelectedWarranty({ ...selectedWarranty, status: oldStatus });
                    }
                }
                message.error('Lỗi khi cập nhật trạng thái');
                fetchWarranty(false).catch(() => {});
            }
        } catch {
            message.error('Lỗi khi cập nhật trạng thái');
            fetchWarranty(false).catch(() => {});
        } finally {
            setUpdating(false);
        }
    };

    const statusCounts = warranty.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {});

    const tabItems = [
        { key: 'all', count: warranty.length, label: 'Tất cả', dotColor: 'bg-gray-400' },
        { key: 'pending', count: statusCounts.pending || 0, label: 'Đang chờ', dotColor: 'bg-amber-400' },
        { key: 'approved', count: statusCounts.approved || 0, label: 'Đã chấp nhận', dotColor: 'bg-blue-400' },
        { key: 'completed', count: statusCounts.completed || 0, label: 'Hoàn thành', dotColor: 'bg-emerald-400' },
        { key: 'rejected', count: statusCounts.rejected || 0, label: 'Từ chối', dotColor: 'bg-red-400' },
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

    const columns = [
        {
            title: 'Mã yêu cầu',
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
            dataIndex: 'productId',
            key: 'product',
            render: (product) => {
                if (!product) return <span className="text-gray-400 text-sm">Không có sản phẩm</span>;
                const imgUrl = getProductImage(product);
                return (
                    <div className="flex items-center gap-3">
                        <img
                            src={getImageUrl(imgUrl, 'products')}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                            onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="8"%3ENo img%3C/text%3E%3C/svg%3E';
                            }}
                        />
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate max-w-[200px]">{product.name}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Khách hàng',
            dataIndex: 'userId',
            key: 'user',
            width: 180,
            render: (user) => (
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                        <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm text-gray-700 truncate">{user?.email}</span>
                </div>
            ),
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            width: 160,
            render: (reason) => (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    {getReasonText(reason)}
                </span>
            ),
        },
        {
            title: 'Ngày yêu cầu',
            dataIndex: 'receivedDate',
            key: 'date',
            width: 120,
            render: (date) => <span className="text-sm text-gray-500">{formatDate(date)}</span>,
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
            key: 'action',
            width: 210,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => openDetailModal(record)}
                            size="small"
                            className="border-blue-200 text-blue-600 hover:!bg-blue-50 hover:!border-blue-300"
                        />
                    </Tooltip>
                    <Select
                        value={record.status}
                        className="w-[140px]"
                        onChange={(value) => updateWarrantyStatus(record._id, value)}
                        size="small"
                        disabled={record.status === 'rejected' || record.status === 'completed'}
                    >
                        <Option value="pending" disabled={isStatusDisabled('pending', record.status)}>
                            <Space><Clock className="w-3 h-3" />Đang chờ</Space>
                        </Option>
                        <Option value="approved" disabled={isStatusDisabled('approved', record.status)}>
                            <Space><CheckCircle className="w-3 h-3" />Đã chấp nhận</Space>
                        </Option>
                        <Option value="completed" disabled={isStatusDisabled('completed', record.status)}>
                            <Space><Package className="w-3 h-3" />Hoàn thành</Space>
                        </Option>
                        <Option value="rejected" disabled={isStatusDisabled('rejected', record.status)}>
                            <Space><XCircle className="w-3 h-3" />Từ chối</Space>
                        </Option>
                    </Select>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <style>{`
                .warranty-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                    padding: 14px 16px;
                }
                .warranty-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9;
                    padding: 12px 16px;
                }
                .warranty-table .ant-table-tbody > tr:hover > td {
                    background: #f8fafc !important;
                }
                .warranty-table .ant-table-container {
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
                .warranty-tabs .ant-tabs-tab {
                    padding: 10px 4px !important;
                }
                .warranty-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #2563eb !important;
                    font-weight: 600;
                }
                .warranty-tabs .ant-tabs-ink-bar {
                    background: #2563eb !important;
                }
            `}</style>

            {/* Header */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý bảo hành</h1>
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                    {warranty.length} yêu cầu
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">Theo dõi và xử lý các yêu cầu bảo hành</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Input
                            placeholder="Tìm kiếm..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-56 rounded-lg"
                            allowClear
                        />
                        <Tooltip title="Tải lại">
                            <Button icon={<ReloadOutlined />} onClick={() => fetchWarranty()} loading={loading} className="rounded-lg" />
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* Tabs + Table */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 pt-4">
                    <Tabs activeKey={statusFilter} onChange={setStatusFilter} items={tabItems} className="warranty-tabs" />
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredWarranty}
                    loading={loading}
                    rowKey="_id"
                    className="warranty-table"
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        total: filteredWarranty.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} yêu cầu`,
                        className: 'px-4 py-3',
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={<span className="text-gray-500">{searchText ? 'Không tìm thấy yêu cầu nào' : 'Chưa có yêu cầu bảo hành nào'}</span>}
                            />
                        ),
                    }}
                />
            </div>

            {/* Detail Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <Shield className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Chi tiết yêu cầu bảo hành</span>
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                            #{selectedWarranty?._id.slice(-8).toUpperCase()}
                        </span>
                    </div>
                }
                open={detailModalVisible}
                onCancel={closeDetailModal}
                width={680}
                centered
                footer={
                    selectedWarranty?.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                            <Button onClick={closeDetailModal} className="rounded-lg">Đóng</Button>
                            <Button
                                danger
                                icon={<X className="w-4 h-4" />}
                                onClick={() => updateWarrantyStatus(selectedWarranty._id, 'rejected')}
                                loading={updating}
                                className="rounded-lg"
                            >
                                Từ chối
                            </Button>
                            <Button
                                type="primary"
                                icon={<Check className="w-4 h-4" />}
                                onClick={() => updateWarrantyStatus(selectedWarranty._id, 'approved')}
                                loading={updating}
                                className="rounded-lg bg-emerald-600 hover:!bg-emerald-700 border-emerald-600"
                            >
                                Chấp nhận
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <Select
                                value={selectedWarranty?.status}
                                onChange={(newStatus) => updateWarrantyStatus(selectedWarranty._id, newStatus)}
                                className="w-48"
                                disabled={updating || selectedWarranty?.status === 'rejected' || selectedWarranty?.status === 'completed'}
                            >
                                <Option value="pending" disabled={isStatusDisabled('pending', selectedWarranty?.status)}>Đang chờ xử lý</Option>
                                <Option value="approved" disabled={isStatusDisabled('approved', selectedWarranty?.status)}>Đã chấp nhận</Option>
                                <Option value="completed" disabled={isStatusDisabled('completed', selectedWarranty?.status)}>Hoàn thành</Option>
                                <Option value="rejected" disabled={isStatusDisabled('rejected', selectedWarranty?.status)}>Từ chối</Option>
                            </Select>
                            <Button onClick={closeDetailModal} className="rounded-lg">Đóng</Button>
                        </div>
                    )
                }
            >
                {selectedWarranty && (
                    <div className="space-y-5 mt-4">
                        {/* Status + Date */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const cfg = statusConfig[selectedWarranty.status] || {};
                                    return (
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.text}`}>
                                            {cfg.icon}
                                            {cfg.label}
                                        </span>
                                    );
                                })()}
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                                    <AlertTriangle className="w-3 h-3" />
                                    {getReasonText(selectedWarranty.reason)}
                                </span>
                            </div>
                            <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {formatDate(selectedWarranty.receivedDate)}
                            </span>
                        </div>

                        {/* Product Info */}
                        <div className="rounded-xl border border-gray-200 p-4">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                Sản phẩm
                            </h4>
                            <div className="flex items-center gap-4">
                                <img
                                    src={getImageUrl(getProductImage(selectedWarranty.productId), 'products')}
                                    alt={selectedWarranty.productId?.name}
                                    className="w-16 h-16 object-cover rounded-xl border border-gray-100"
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="9"%3ENo img%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                                <div>
                                    <p className="font-semibold text-gray-800">{selectedWarranty.productId?.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">ID: #{selectedWarranty.productId?._id?.slice(-8)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="rounded-xl border border-gray-200 p-4">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                Khách hàng
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                    <span>{selectedWarranty.userId?.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <span>Hạn BH: {formatDate(selectedWarranty.returnDate)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {selectedWarranty.description && (
                            <div className="rounded-xl border border-gray-200 p-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    Mô tả chi tiết
                                </h4>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg leading-relaxed">
                                    {selectedWarranty.description}
                                </p>
                            </div>
                        )}

                        {/* Images */}
                        {selectedWarranty.images && selectedWarranty.images.length > 0 && (
                            <div className="rounded-xl border border-gray-200 p-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-gray-500" />
                                    Hình ảnh minh chứng ({selectedWarranty.images.length})
                                </h4>
                                <div className="grid grid-cols-4 gap-3">
                                    {selectedWarranty.images.map((image, index) => (
                                        <Image
                                            key={index}
                                            width="100%"
                                            height={100}
                                            src={getImageUrl(image, 'warranty')}
                                            alt={`Minh chứng ${index + 1}`}
                                            className="rounded-lg object-cover"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default WarrantyAdmin;
