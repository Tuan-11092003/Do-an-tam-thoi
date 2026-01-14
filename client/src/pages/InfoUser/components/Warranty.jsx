import { useEffect, useState } from 'react';
import { requestGetWarrantyByUserId, requestSubmitReturn } from '../../../config/WarrantyRequest';
import {
    Card,
    Table,
    Tag,
    Image,
    Button,
    Empty,
    Spin,
    Modal,
    Form,
    Input,
    Select,
    Upload,
    message,
    Progress,
    Tooltip,
    notification,
} from 'antd';
import {
    Shield,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Package,
    Calendar,
    RefreshCw,
    Camera,
    FileText,
} from 'lucide-react';

const { TextArea } = Input;
const { Option } = Select;

function Warranty() {
    const [warranty, setWarranty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [returnModalVisible, setReturnModalVisible] = useState(false);
    const [selectedWarranty, setSelectedWarranty] = useState(null);
    const [returnForm] = Form.useForm();

    const fetchWarranty = async () => {
        try {
            const res = await requestGetWarrantyByUserId();
            // Sắp xếp: sản phẩm đã giao (receivedDate mới nhất) lên đầu
            const sortedWarranty = (res.metadata || []).sort((a, b) => {
                const dateA = new Date(a.receivedDate);
                const dateB = new Date(b.receivedDate);
                return dateB - dateA; // Mới nhất lên đầu
            });
            setWarranty(sortedWarranty);
        } catch (error) {
            console.error('Error fetching warranty:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarranty();
    }, []);

    // Hiển thị notification khi có warranty được chấp nhận VÀ email đã gửi thành công
    // CHỈ hiển thị khi: status = 'approved' + có yêu cầu đổi trả + emailSent = true
    useEffect(() => {
        if (warranty.length > 0 && !loading) {
            // Chỉ lấy warranty có status 'approved', đã có yêu cầu đổi trả, VÀ email đã gửi thành công
            const approvedWarranties = warranty.filter(
                item => item.status === 'approved' && 
                       (item.reason || item.description) &&
                       item.emailSent === true // Chỉ hiển thị khi email đã gửi thành công
            );
            
            if (approvedWarranties.length > 0) {
                // Lấy danh sách warranty ID đã được thông báo từ localStorage
                const notifiedWarranties = JSON.parse(localStorage.getItem('warranty-approved-notified') || '[]');
                
                // Tìm warranty mới được chấp nhận và email đã gửi thành công (chưa được thông báo)
                const newApprovedWarranties = approvedWarranties.filter(
                    item => !notifiedWarranties.includes(item._id)
                );
                
                if (newApprovedWarranties.length > 0) {
                    const notificationKey = 'warranty-approved-notification';
                    const newApprovedIds = newApprovedWarranties.map(item => item._id);
                    
                    notification.info({
                        message: 'Yêu cầu đổi trả đã được chấp nhận',
                        description: 'Chúng tôi đã chấp nhận yêu cầu đổi trả hàng của bạn. Vui lòng kiểm tra email.',
                        placement: 'top',
                        duration: 0, // Không tự đóng
                        key: notificationKey,
                        btn: (
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                    // Đóng notification
                                    notification.destroy(notificationKey);
                                    // Lưu các warranty mới được chấp nhận vào danh sách đã thông báo
                                    const currentNotified = JSON.parse(localStorage.getItem('warranty-approved-notified') || '[]');
                                    const updatedNotified = [...new Set([...currentNotified, ...newApprovedIds])];
                                    localStorage.setItem('warranty-approved-notified', JSON.stringify(updatedNotified));
                                }}
                            >
                                Đã hiểu
                            </Button>
                        ),
                        style: {
                            width: 500,
                        },
                    });
                }
            }
        }
    }, [warranty, loading]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'available':
                return 'default';
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
            case 'available':
                return <Shield className="w-4 h-4" />;
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
            case 'available':
                return 'Có thể đổi trả';
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Use warranty progress from server instead of calculating on client
    const getWarrantyProgress = (warrantyItem) => {
        // Server đã tính sẵn, chỉ cần lấy từ response
        if (warrantyItem.warrantyProgress) {
            return warrantyItem.warrantyProgress;
        }
        // Fallback nếu server chưa có (backward compatibility)
        const received = new Date(warrantyItem.receivedDate);
        const returnExpiry = new Date(warrantyItem.returnDate);
        const now = new Date();
        const totalDuration = returnExpiry - received;
        const elapsed = now - received;
        const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
        return {
            progress: Math.round(progress),
            isExpired: now > returnExpiry,
            daysLeft: Math.max(0, Math.ceil((returnExpiry - now) / (1000 * 60 * 60 * 24))),
        };
    };

    const openReturnModal = (warrantyItem) => {
        setSelectedWarranty(warrantyItem);
        setReturnModalVisible(true);
        returnForm.resetFields();
    };

    const closeReturnModal = () => {
        setReturnModalVisible(false);
        setSelectedWarranty(null);
        returnForm.resetFields();
    };

    const submitReturnRequest = async (values) => {
        try {
            const formData = new FormData();
            formData.append('reason', values.reason);
            formData.append('warrantyId', selectedWarranty._id);
            formData.append('description', values.description);
            formData.append('status', 'pending');
            values.images?.fileList?.forEach((file) => {
                formData.append('images', file.originFileObj);
            });

            await requestSubmitReturn(formData);

            message.success('Yêu cầu đổi trả đã được gửi thành công!');
            closeReturnModal();

            // Refresh warranty list
            fetchWarranty();
        } catch (error) {
            console.error('Error submitting return request:', error);
            message.error('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại!');
        }
    };

    const columns = [
        {
            title: 'Sản phẩm',
            dataIndex: 'productId',
            key: 'productId',
            render: (product) => (
                <div className="flex items-center space-x-3">
                    <Image
                        width={60}
                        height={60}
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
            width: 300,
        },
        {
            title: 'Thời gian bảo hành',
            key: 'warranty_period',
            render: (text, record) => {
                const { progress, isExpired, daysLeft } = getWarrantyProgress(record);

                return (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Từ: {formatDate(record.receivedDate)}</span>
                            <span>Đến: {formatDate(record.returnDate)}</span>
                        </div>
                        <Progress
                            percent={progress}
                            size="small"
                            status={isExpired ? 'exception' : progress > 75 ? 'active' : 'normal'}
                            strokeColor={isExpired ? '#ff4d4f' : progress > 75 ? '#faad14' : '#52c41a'}
                        />
                        <div className="text-xs text-center">
                            {isExpired ? (
                                <span className="text-red-500 flex items-center justify-center space-x-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Đã hết hạn</span>
                                </span>
                            ) : (
                                <span className="text-blue-600">Còn {daysLeft} ngày</span>
                            )}
                        </div>
                    </div>
                );
            },
            width: 200,
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
            render: (text, record) => {
                const { isExpired } = getWarrantyProgress(record);

                if (isExpired) {
                    return <span className="text-gray-400 text-sm">Hết hạn</span>;
                }

                // Chỉ hiển thị nút "Đổi trả" khi status là 'available' (chưa có yêu cầu đổi trả)
                if (record.status === 'available') {
                    return (
                        <Tooltip title="Yêu cầu đổi trả sản phẩm">
                            <Button
                                type="primary"
                                size="small"
                                icon={<RefreshCw className="w-4 h-4" />}
                                onClick={() => openReturnModal(record)}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                Đổi trả
                            </Button>
                        </Tooltip>
                    );
                }

                // Các trạng thái khác (pending, approved, completed, rejected) đều đã xử lý
                return <span className="text-gray-400 text-sm">Đã xử lý</span>;
            },
            width: 120,
        },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    if (warranty.length === 0) {
        return <Empty description="Bạn chưa có sản phẩm nào trong bảo hành" className="py-16" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Bảo hành sản phẩm</h2>
                <Tag color="blue">{warranty.length} sản phẩm</Tag>
            </div>

            <Card className="overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={warranty}
                    rowKey="_id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`,
                    }}
                />
            </Card>

            {/* Return Request Modal */}
            <Modal
                title={
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 text-blue-500" />
                        <span>Yêu cầu đổi trả</span>
                    </div>
                }
                open={returnModalVisible}
                onCancel={closeReturnModal}
                footer={null}
                width={600}
                className="return-modal"
            >
                {selectedWarranty && (
                    <div className="space-y-6">
                        {/* Product Info */}
                        <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
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
                            <div className="flex-1">
                                <h4 className="font-semibold text-lg text-gray-900">
                                    {selectedWarranty.productId.name} - {selectedWarranty.productId.colors[0].name}
                                </h4>
                                <div className="text-sm text-gray-500">
                                    Mã bảo hành: #{selectedWarranty._id.slice(-8)}
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm">Hết hạn: {formatDate(selectedWarranty.returnDate)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Return Form */}
                        <Form form={returnForm} layout="vertical" onFinish={submitReturnRequest} className="space-y-4">
                            {/* Reason */}
                            <Form.Item
                                label={
                                    <span className="flex items-center space-x-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Lý do đổi trả</span>
                                    </span>
                                }
                                name="reason"
                                rules={[{ required: true, message: 'Vui lòng chọn lý do đổi trả!' }]}
                            >
                                <Select placeholder="Chọn lý do đổi trả">
                                    <Option value="defect">Sản phẩm bị lỗi</Option>
                                    <Option value="wrong_size">Sai size</Option>
                                    <Option value="wrong_color">Sai màu sắc</Option>
                                    <Option value="damaged">Hư hại trong vận chuyển</Option>
                                    <Option value="not_as_described">Không đúng mô tả</Option>
                                    <Option value="other">Khác</Option>
                                </Select>
                            </Form.Item>

                            {/* Description */}
                            <Form.Item
                                label={
                                    <span className="flex items-center space-x-2">
                                        <FileText className="w-4 h-4" />
                                        <span>Mô tả chi tiết</span>
                                    </span>
                                }
                                name="description"
                                rules={[
                                    { required: true, message: 'Vui lòng mô tả chi tiết vấn đề!' },
                                ]}
                                help="Vui lòng mô tả chi tiết để có thể xem xét đổi trả"
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Mô tả chi tiết vấn đề bạn gặp phải với sản phẩm..."
                                    maxLength={1000}
                                    showCount
                                />
                            </Form.Item>

                            {/* Upload Images */}
                            <Form.Item
                                label={
                                    <span className="flex items-center space-x-2">
                                        <Camera className="w-4 h-4" />
                                        <span>Hình ảnh minh chứng (bắt buộc)</span>
                                    </span>
                                }
                                name="images"
                                rules={[{ required: true, message: 'Vui lòng upload ít nhất 1 ảnh minh chứng!' }]}
                            >
                                <Upload
                                    listType="picture-card"
                                    multiple
                                    accept="image/*"
                                    beforeUpload={() => false}
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
                                <Button onClick={closeReturnModal} size="large">
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    icon={<RefreshCw className="w-4 h-4" />}
                                    className="bg-blue-500 hover:bg-blue-600"
                                >
                                    Gửi yêu cầu
                                </Button>
                            </div>
                        </Form>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default Warranty;
