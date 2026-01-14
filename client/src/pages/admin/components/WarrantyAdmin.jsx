import { useEffect, useState, useRef } from 'react';
import { requestGetWarrantyByAdmin, requestUpdateWarrantyStatus } from '../../../config/WarrantyRequest';
import {
    Card,
    Table,
    Tag,
    Image,
    Button,
    Empty,
    Spin,
    Modal,
    Descriptions,
    Select,
    message,
    Space,
    Tooltip,
    Avatar,
    Badge,
    Tabs,
} from 'antd';
import {
    Shield,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Package,
    Calendar,
    User,
    FileText,
    Eye,
    Edit,
    Check,
    X,
    RefreshCw,
} from 'lucide-react';

const { Option } = Select;

function WarrantyAdmin() {
    const [warranty, setWarranty] = useState([]);
    const [filteredWarranty, setFilteredWarranty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedWarranty, setSelectedWarranty] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const recentlyUpdatedWarrantyIdRef = useRef(null);

    const fetchWarranty = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            const res = await requestGetWarrantyByAdmin();
            let warrantyList = res.metadata || [];
            setWarranty(warrantyList);
            
            // Filter warranty based on selected status
            let filteredList = statusFilter === 'all' 
                ? warrantyList 
                : warrantyList.filter((item) => item.status === statusFilter);
            
            // Nếu có warranty vừa cập nhật, đưa nó lên đầu danh sách
            if (recentlyUpdatedWarrantyIdRef.current) {
                const updatedWarrantyId = recentlyUpdatedWarrantyIdRef.current;
                const updatedWarranty = filteredList.find(item => item._id === updatedWarrantyId);
                if (updatedWarranty) {
                    filteredList = [
                        updatedWarranty,
                        ...filteredList.filter(item => item._id !== updatedWarrantyId)
                    ];
                    // Reset sau khi đã sắp xếp
                    recentlyUpdatedWarrantyIdRef.current = null;
                }
            }
            
            setFilteredWarranty(filteredList);
        } catch (error) {
            console.error('Error fetching warranty:', error);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchWarranty();
    }, [statusFilter]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'orange';
            case 'approved':
                return 'blue';
            case 'completed':
                return 'green';
            case 'rejected':
                return 'red';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4" />;
            case 'approved':
                return <CheckCircle className="w-4 h-4" />;
            case 'completed':
                return <Package className="w-4 h-4" />;
            case 'rejected':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Shield className="w-4 h-4" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Đang chờ xử lý';
            case 'approved':
                return 'Đã chấp nhận';
            case 'completed':
                return 'Hoàn thành';
            case 'rejected':
                return 'Từ chối';
            default:
                return 'Không xác định';
        }
    };

    // Hàm kiểm tra xem một trạng thái có bị vô hiệu hóa không dựa trên trạng thái hiện tại
    const isStatusDisabled = (optionStatus, currentStatus) => {
        // Nếu đơn hàng đã bị từ chối hoặc hoàn thành, tất cả các trạng thái đều bị vô hiệu hóa
        if (currentStatus === 'rejected' || currentStatus === 'completed') {
            return true;
        }

        // Định nghĩa thứ tự của các trạng thái (theo luồng chính)
        const statusOrder = {
            pending: 1,
            approved: 2,
            completed: 3,
        };

        const currentOrder = statusOrder[currentStatus] || 0;
        const optionOrder = statusOrder[optionStatus] || 0;

        // rejected chỉ có thể chọn khi đơn hàng đang ở trạng thái "pending"
        // Từ "Đã chấp nhận" trở đi thì không thể từ chối nữa
        if (optionStatus === 'rejected') {
            return currentStatus !== 'pending';
        }

        // Vô hiệu hóa các trạng thái có thứ tự nhỏ hơn trạng thái hiện tại
        // Ví dụ: nếu đang ở 'approved' (2), thì 'pending' (1) sẽ bị vô hiệu hóa
        return optionOrder < currentOrder;
    };

    const getReasonText = (reason) => {
        switch (reason) {
            case 'defect':
                return 'Sản phẩm bị lỗi';
            case 'wrong_size':
                return 'Sai size';
            case 'wrong_color':
                return 'Sai màu sắc';
            case 'damaged':
                return 'Hư hại trong vận chuyển';
            case 'not_as_described':
                return 'Không đúng mô tả';
            case 'other':
                return 'Khác';
            default:
                return reason || 'Chưa có lý do';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const openDetailModal = (warrantyItem) => {
        setSelectedWarranty(warrantyItem);
        setDetailModalVisible(true);
    };

    const closeDetailModal = () => {
        setDetailModalVisible(false);
        setSelectedWarranty(null);
    };

    const updateWarrantyStatus = async (warrantyId, newStatus) => {
        // Lưu trạng thái cũ để rollback nếu cần
        const oldWarranty = warranty.find(item => item._id === warrantyId);
        const oldStatus = oldWarranty?.status;
        
        try {
            setUpdating(true);
            
            // Lưu warrantyId vào ref để đưa lên đầu khi admin vào tab tương ứng
            const validStatusTabs = ['pending', 'approved', 'completed', 'rejected'];
            if (validStatusTabs.includes(newStatus)) {
                recentlyUpdatedWarrantyIdRef.current = warrantyId;
            }
            
            // Cập nhật local state ngay lập tức để UI phản hồi ngay
            setWarranty((prevWarranty) =>
                prevWarranty.map((item) => (item._id === warrantyId ? { ...item, status: newStatus } : item)),
            );
            
            // Cập nhật filteredWarranty
            // Nếu warranty có trong danh sách hiện tại (tab 'all' hoặc tab khớp với status cũ), đưa lên đầu
            // Nếu không, chỉ cập nhật status (warranty sẽ biến mất khỏi tab hiện tại nếu tab không khớp)
            setFilteredWarranty((prevFilteredWarranty) => {
                const updatedWarranty = prevFilteredWarranty.find(item => item._id === warrantyId);
                if (updatedWarranty) {
                    // Warranty có trong danh sách, cập nhật status và đưa lên đầu
                    const updatedWarrantyWithNewStatus = { ...updatedWarranty, status: newStatus };
                    // Chỉ đưa lên đầu nếu tab hiện tại là 'all' hoặc khớp với trạng thái mới
                    if (statusFilter === 'all' || statusFilter === newStatus) {
                        return [
                            updatedWarrantyWithNewStatus,
                            ...prevFilteredWarranty.filter(item => item._id !== warrantyId)
                        ];
                    } else {
                        // Tab không khớp, chỉ cập nhật status (warranty sẽ biến mất)
                        return prevFilteredWarranty.map((item) => 
                            item._id === warrantyId ? { ...item, status: newStatus } : item
                        );
                    }
                } else {
                    // Warranty không có trong danh sách, chỉ cập nhật (không ảnh hưởng gì)
                    return prevFilteredWarranty;
                }
            });
            
            // Cập nhật selectedWarranty nếu đang mở modal
            if (selectedWarranty && selectedWarranty._id === warrantyId) {
                setSelectedWarranty({ ...selectedWarranty, status: newStatus });
            }
            
            // Hiển thị thông báo ngay lập tức (trước khi gọi API)
            message.success('Cập nhật trạng thái thành công!');
            
            // Chỉ đóng modal nếu đang mở
            if (detailModalVisible) {
                closeDetailModal();
            }
            
            // Gọi API cập nhật ở background (không chặn UI)
            try {
                await requestUpdateWarrantyStatus(warrantyId, newStatus);
                
                // Fetch lại dữ liệu từ server ở background để đồng bộ
                fetchWarranty(false).catch((error) => {
                    console.error('Error refreshing warranty data:', error);
                });
            } catch (apiError) {
                console.error('Error updating warranty status:', apiError);
                
                // Rollback: khôi phục trạng thái cũ
                if (oldStatus) {
                    setWarranty((prevWarranty) =>
                        prevWarranty.map((item) => (item._id === warrantyId ? { ...item, status: oldStatus } : item)),
                    );
                    if (selectedWarranty && selectedWarranty._id === warrantyId) {
                        setSelectedWarranty({ ...selectedWarranty, status: oldStatus });
                    }
                }
                
                message.error('Có lỗi xảy ra khi cập nhật trạng thái!');
                
                // Fetch lại dữ liệu từ server để đảm bảo dữ liệu đúng
                fetchWarranty(false).catch((err) => {
                    console.error('Error refreshing warranty data:', err);
                });
            }
        } catch (error) {
            console.error('Error updating warranty status:', error);
            message.error('Có lỗi xảy ra khi cập nhật trạng thái!');
            
            // Nếu có lỗi, fetch lại để đảm bảo dữ liệu đúng
            fetchWarranty(false).catch((err) => {
                console.error('Error refreshing warranty data:', err);
            });
        } finally {
            setUpdating(false);
        }
    };

    const getStatusCount = () => {
        const counts = warranty.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
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
                    {warranty.length > 0 && (
                        <Badge count={warranty.length} style={{ marginLeft: 8 }} />
                    )}
                </span>
            ),
        },
        {
            key: 'pending',
            label: (
                <span>
                    Đang chờ xử lý
                    {statusCounts.pending > 0 && (
                        <Badge count={statusCounts.pending} style={{ marginLeft: 8 }} />
                    )}
                </span>
            ),
        },
        {
            key: 'approved',
            label: (
                <span>
                    Đã chấp nhận
                    {statusCounts.approved > 0 && (
                        <Badge count={statusCounts.approved} style={{ marginLeft: 8 }} />
                    )}
                </span>
            ),
        },
        {
            key: 'completed',
            label: (
                <span>
                    Hoàn thành
                    {statusCounts.completed > 0 && (
                        <Badge count={statusCounts.completed} style={{ marginLeft: 8 }} />
                    )}
                </span>
            ),
        },
    ];

    const columns = [
        {
            title: 'Mã yêu cầu',
            dataIndex: '_id',
            key: '_id',
            render: (id) => <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">#{id.slice(-8)}</span>,
            width: 120,
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'productId',
            key: 'productId',
            render: (product) => (
                <div className="flex items-center space-x-3">
                    <Image
                        width={50}
                        height={50}
                        src={`${import.meta.env.VITE_URL_IMAGE}/uploads/products/${
                            (() => {
                                const color = product.colors?.[0];
                                if (!color?.images) return '';
                                if (Array.isArray(color.images)) {
                                    return color.images[0] || '';
                                }
                                return color.images;
                            })()
                        }`}
                        alt={product.name}
                        className="rounded-lg object-cover"
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8E+UDNmyJUu2ZMmSLVmSBUuWLFmyZMmSJVmyZMuSJUu2bMmSJVuyZMmWLVmyZMvSbMmSLdmyJUuyZEmWJUu2ZMmSJUt2ZEuWLNmyJUuWbNmSJUuWLFmy9U="
                    />
                    <div>
                        <div className="font-medium text-gray-900 max-w-xs truncate">{product.name}</div>
                        <div className="text-sm text-gray-500">ID: #{product._id.slice(-8)}</div>
                    </div>
                </div>
            ),
            width: 250,
        },
        {
            title: 'Khách hàng',
            dataIndex: 'userId',
            key: 'userId',
            render: (userId) => (
                <div className="flex items-center space-x-2">
                    <Avatar size="small" icon={<User className="w-4 h-4" />} />
                    <span className="text-sm font-mono">{userId.email}</span>
                </div>
            ),
            width: 120,
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            render: (reason) => (
                <Tag color="blue" className="text-xs">
                    {getReasonText(reason)}
                </Tag>
            ),
            width: 150,
        },
        {
            title: 'Ngày yêu cầu',
            dataIndex: 'receivedDate',
            key: 'receivedDate',
            render: (date) => (
                <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(date)}</span>
                </div>
            ),
            width: 180,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag
                    color={getStatusColor(status)}
                    icon={getStatusIcon(status)}
                    className="flex items-center space-x-1"
                >
                    {getStatusText(status)}
                </Tag>
            ),
            width: 150,
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (text, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => openDetailModal(record)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title={record.status === 'rejected' || record.status === 'completed' ? 'Trạng thái cuối cùng, không thể thay đổi' : 'Thay đổi trạng thái'}>
                        <Select
                            value={record.status}
                            className="w-40"
                            onChange={(value) => updateWarrantyStatus(record._id, value)}
                            size="small"
                            disabled={record.status === 'rejected' || record.status === 'completed'}
                        >
                            <Option value="pending" disabled={isStatusDisabled('pending', record.status)}>
                                <Space>
                                    <Clock className="w-3 h-3" />
                                    Đang chờ xử lý
                                </Space>
                            </Option>
                            <Option value="approved" disabled={isStatusDisabled('approved', record.status)}>
                                <Space>
                                    <CheckCircle className="w-3 h-3" />
                                    Đã chấp nhận
                                </Space>
                            </Option>
                            <Option value="completed" disabled={isStatusDisabled('completed', record.status)}>
                                <Space>
                                    <Package className="w-3 h-3" />
                                    Hoàn thành
                                </Space>
                            </Option>
                            <Option value="rejected" disabled={isStatusDisabled('rejected', record.status)}>
                                <Space>
                                    <XCircle className="w-3 h-3" />
                                    Từ chối
                                </Space>
                            </Option>
                        </Select>
                    </Tooltip>
                </Space>
            ),
            width: 250,
        },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Card className="shadow-sm mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <h2 className="text-2xl font-bold text-gray-900">Quản lý bảo hành</h2>
                    </div>
                </div>
            </Card>

            <Card className="shadow-sm">
                <Tabs
                    activeKey={statusFilter}
                    onChange={setStatusFilter}
                    items={tabItems}
                    className="warranty-tabs"
                />
            </Card>

            {filteredWarranty.length === 0 ? (
                <Card className="mt-4">
                    <Empty 
                        description={
                            statusFilter === 'all' 
                                ? "Chưa có yêu cầu bảo hành nào" 
                                : `Chưa có yêu cầu bảo hành với trạng thái "${tabItems.find(t => t.key === statusFilter)?.label}"`
                        } 
                        className="py-16" 
                    />
                </Card>
            ) : (
                <Card className="overflow-hidden mt-4">
                    <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        dataSource={filteredWarranty}
                        rowKey="_id"
                        pagination={{
                            total: filteredWarranty.length,
                            pageSize: 10,
                            showSizeChanger: false,
                            showQuickJumper: false,
                            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} yêu cầu`,
                        }}
                            scroll={{ x: 'max-content' }}
                        className="bg-white rounded-lg"
                    />
                    </div>
                </Card>
            )}

            {/* Detail Modal */}
            <Modal
                title={
                    <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span>Chi tiết yêu cầu bảo hành</span>
                    </div>
                }
                open={detailModalVisible}
                onCancel={closeDetailModal}
                width={800}
                style={{ top: 20 }}
                styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '24px' } }}
                footer={
                    selectedWarranty?.status === 'pending' ? (
                        <div className="flex justify-end space-x-2">
                            <Button onClick={closeDetailModal}>Đóng</Button>
                            <Button
                                danger
                                icon={<X className="w-4 h-4" />}
                                onClick={() => updateWarrantyStatus(selectedWarranty._id, 'rejected')}
                                loading={updating}
                            >
                                Từ chối
                            </Button>
                            <Button
                                type="primary"
                                icon={<Check className="w-4 h-4" />}
                                onClick={() => updateWarrantyStatus(selectedWarranty._id, 'approved')}
                                loading={updating}
                                className="bg-green-500 hover:bg-green-600 border-green-500"
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
                                <Option value="pending" disabled={isStatusDisabled('pending', selectedWarranty?.status)}>
                                    Đang chờ xử lý
                                </Option>
                                <Option value="approved" disabled={isStatusDisabled('approved', selectedWarranty?.status)}>
                                    Đã chấp nhận
                                </Option>
                                <Option value="completed" disabled={isStatusDisabled('completed', selectedWarranty?.status)}>
                                    Hoàn thành
                                </Option>
                                <Option value="rejected" disabled={isStatusDisabled('rejected', selectedWarranty?.status)}>
                                    Từ chối
                                </Option>
                            </Select>
                            <Button onClick={closeDetailModal}>Đóng</Button>
                        </div>
                    )
                }
            >
                {selectedWarranty && (
                    <div className="space-y-6">
                        {/* Product and Customer Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card title="Thông tin sản phẩm" size="small">
                                <div className="flex items-center space-x-4 mb-4">
                                    <Image
                                        width={80}
                                        height={80}
                                        src={`${import.meta.env.VITE_URL_IMAGE}/uploads/products/${
                                            (() => {
                                                const color = selectedWarranty.productId?.colors?.[0];
                                                if (!color?.images) return '';
                                                if (Array.isArray(color.images)) {
                                                    return color.images[0] || '';
                                                }
                                                return color.images;
                                            })()
                                        }`}
                                        alt={selectedWarranty.productId.name}
                                        className="rounded-lg object-cover"
                                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8E+UDNmyJUu2ZMmSLVmSBUuWLFmyZMmSJVmyZMuSJUu2bMmSJVuyZMmWLVmyZMvSbMmSLdmyJUuyZEmWJUu2ZMmSJUt2ZEuWLNmyJUuWbNmSJUuWLFmy9U="
                                    />
                                    <div>
                                        <h4 className="font-semibold">{selectedWarranty.productId.name}</h4>
                                        <p className="text-sm text-gray-500">
                                            ID: #{selectedWarranty.productId._id.slice(-8)}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Thông tin yêu cầu" size="small">
                                <Descriptions column={1} size="small">
                                    <Descriptions.Item label="Mã yêu cầu">
                                        #{selectedWarranty._id.slice(-8)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Khách hàng">
                                        {selectedWarranty.userId.email}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày yêu cầu">
                                        {formatDate(selectedWarranty.receivedDate)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Hết hạn">
                                        {formatDate(selectedWarranty.returnDate)}
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </div>

                        {/* Request Details */}
                        <Card title="Chi tiết yêu cầu" size="small">
                            <Descriptions column={1}>
                                <Descriptions.Item label="Lý do">
                                    <Tag color="blue">{getReasonText(selectedWarranty.reason)}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái hiện tại">
                                    <Tag
                                        color={getStatusColor(selectedWarranty.status)}
                                        icon={getStatusIcon(selectedWarranty.status)}
                                    >
                                        {getStatusText(selectedWarranty.status)}
                                    </Tag>
                                </Descriptions.Item>
                                {selectedWarranty.description && (
                                    <Descriptions.Item label="Mô tả chi tiết">
                                        <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                                            {selectedWarranty.description}
                                        </div>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </Card>

                        {/* Images */}
                        {selectedWarranty.images && selectedWarranty.images.length > 0 && (
                            <Card title="Hình ảnh minh chứng" size="small">
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                    {selectedWarranty.images.map((image, index) => (
                                        <Image
                                            key={index}
                                            width={120}
                                            height={120}
                                            src={`${import.meta.env.VITE_URL_IMAGE}/uploads/warranty/${image}`}
                                            alt={`Evidence ${index + 1}`}
                                            className="rounded-lg object-cover"
                                        />
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default WarrantyAdmin;
