import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Card, Typography, Tag, Avatar, Badge, Tooltip, Switch } from 'antd';
import { toast } from 'react-toastify';
import {
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    CrownOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import {
    requestGetAllUser,
    requestUpdateUserAdmin,
    requestDeleteUserAdmin,
} from '../../../config/UserRequest';
import { useStore } from '../../../hooks/useStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

function UserAdmin() {
    const { dataUser } = useStore();
    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            // Gửi search query lên server
            const res = await requestGetAllUser(searchText);
            setData(res.metadata || []);
            setLoading(false);
        } catch (error) {
            toast.error('Không thể tải danh sách người dùng');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchText]); // Fetch lại khi searchText thay đổi

    // Thêm mới (nếu cần)
    const handleAdd = () => {
        setEditing(null);
        form.resetFields();
        setOpen(true);
    };

    // Xem chi tiết
    const handleView = (record) => {
        setViewing(record);
        setViewModalOpen(true);
    };

    // Sửa
    const handleEdit = (record) => {
        setEditing(record);
        form.setFieldsValue({
            fullName: record.fullName,
            email: record.email,
            phone: record.phone || '',
            address: record.address || '',
            isAdmin: record.isAdmin || false,
            typeLogin: record.typeLogin || 'email',
        });
        setOpen(true);
    };

    // Xoá
    const handleDelete = async (_id) => {
        try {
            setLoading(true);
            await requestDeleteUserAdmin(_id);
            toast.success('Đã xoá người dùng thành công');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi xoá người dùng');
            setLoading(false);
        }
    };

    // Lưu (sửa)
    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            setLoading(true);

            if (editing) {
                const updateData = {
                    fullName: values.fullName,
                    email: values.email,
                    phone: values.phone,
                    address: values.address,
                    isAdmin: values.isAdmin,
                    typeLogin: values.typeLogin,
                };
                await requestUpdateUserAdmin(editing._id, updateData);
                toast.success('Đã cập nhật thông tin người dùng thành công');
            }

            fetchData();
            setOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi lưu thông tin');
        } finally {
            setLoading(false);
        }
    };

    // Đóng modal
    const handleCancel = () => {
        setOpen(false);
        form.resetFields();
    };

    // Server đã filter rồi, không cần filter lại ở client
    const filteredData = data;

    const columns = [
        {
            title: 'Người dùng',
            key: 'user',
            width: 280,
            render: (_, record) => (
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                        size={40}
                        src={
                            record.avatar
                                ? `${import.meta.env.VITE_URL_IMAGE}/uploads/avatars/${record.avatar}`
                                : null
                        }
                        icon={!record.avatar && <UserOutlined />}
                        className="bg-blue-100 text-blue-600 flex-shrink-0"
                        style={{ flexShrink: 0 }}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                        <Tooltip title={record.fullName}>
                            <span className="font-medium text-gray-800 truncate block">{record.fullName}</span>
                        </Tooltip>
                        <Tooltip title={record.email}>
                            <span className="text-xs text-gray-500 truncate block">{record.email}</span>
                        </Tooltip>
                    </div>
                </div>
            ),
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            width: 150,
            render: (text) => (
                <span className="text-gray-700">{text || <span className="text-gray-400">Chưa cập nhật</span>}</span>
            ),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            width: 200,
            render: (text) => (
                <span className="text-gray-700">
                    {text ? (
                        <Tooltip title={text}>
                            <span className="truncate block max-w-[180px]">{text}</span>
                        </Tooltip>
                    ) : (
                        <span className="text-gray-400">Chưa cập nhật</span>
                    )}
                </span>
            ),
        },
        {
            title: 'Loại đăng nhập',
            dataIndex: 'typeLogin',
            key: 'typeLogin',
            width: 120,
            render: (type) => (
                <Tag color={type === 'google' ? 'blue' : 'default'}>
                    {type === 'google' ? 'Google' : 'Email'}
                </Tag>
            ),
        },
        {
            title: 'Quyền',
            dataIndex: 'isAdmin',
            key: 'isAdmin',
            width: 150,
            render: (isAdmin, record) => {
                const isCurrentUser = dataUser?._id === record._id;
                const handleToggleRole = async (checked) => {
                    try {
                        setLoading(true);
                        await requestUpdateUserAdmin(record._id, {
                            fullName: record.fullName,
                            email: record.email,
                            phone: record.phone || '',
                            address: record.address || '',
                            isAdmin: checked,
                            typeLogin: record.typeLogin || 'email',
                        });
                        toast.success(`Đã ${checked ? 'cấp quyền Admin' : 'hủy quyền Admin'} cho ${record.fullName}`);
                        fetchData();
                    } catch (error) {
                        toast.error(error.response?.data?.message || 'Không thể cập nhật quyền');
                        setLoading(false);
                    }
                };

                return (
                    <div className="flex items-center gap-2">
                        <Popconfirm
                            title={isAdmin 
                                ? `Hủy quyền Admin cho ${record.fullName}?` 
                                : `Cấp quyền Admin cho ${record.fullName}?`
                            }
                            description={
                                isAdmin 
                                    ? "Người dùng này sẽ mất quyền Admin và chỉ có quyền User."
                                    : "Người dùng này sẽ có quyền Admin và có thể truy cập trang quản trị."
                            }
                            onConfirm={() => handleToggleRole(!isAdmin)}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            okButtonProps={{ danger: !isAdmin }}
                        >
                            <Switch
                                checked={isAdmin}
                                disabled={isCurrentUser}
                                checkedChildren="Admin"
                                unCheckedChildren="User"
                                className="bg-gray-300"
                            />
                        </Popconfirm>
                        <Tag color={isAdmin ? 'red' : 'green'} icon={isAdmin && <CrownOutlined />} className="ml-1">
                            {isAdmin ? 'Admin' : 'User'}
                        </Tag>
                        {isCurrentUser && (
                            <Tooltip title="Bạn không thể thay đổi quyền của chính mình">
                                <span className="text-xs text-gray-400">(Bạn)</span>
                            </Tooltip>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 120,
            render: (_, record) => (
                <Badge
                    status={record.isOnline ? 'success' : 'default'}
                    text={record.isOnline ? 'Đang online' : 'Offline'}
                />
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            render: (date) => (
                <span className="text-gray-600">{dayjs(date).format('DD/MM/YYYY HH:mm')}</span>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 200,
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => handleView(record)}
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                        />
                    </Tooltip>
                    <Tooltip title="Sửa">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-colors"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xoá người dùng này?"
                        description="Bạn chắc chắn muốn xoá người dùng này? Hành động này không thể hoàn tác."
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xoá"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa">
                            <Button
                                icon={<DeleteOutlined />}
                                danger
                                className="hover:bg-red-50 transition-colors"
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <div className="mb-6">
                <Title level={2} className="mb-2">
                    Quản lý người dùng
                </Title>
                <Text type="secondary">Quản lý thông tin, quyền hạn và trạng thái của người dùng</Text>
            </div>

            {/* Toolbar */}
            <Card className="mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1 w-full sm:w-auto">
                        <Input
                            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            className="w-full sm:w-[400px]"
                            size="large"
                        />
                    </div>
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchData}
                            loading={loading}
                            size="large"
                        >
                            Làm mới
                        </Button>
                    </Space>
                </div>
            </Card>

            {/* Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="_id"
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{
                        total: filteredData.length,
                        pageSize: 10,
                        showSizeChanger: false,
                        showQuickJumper: false,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người dùng`,
                    }}
                />
            </Card>

            {/* Modal Sửa */}
            <Modal
                title={editing ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'}
                open={open}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={loading}
                width={600}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="Nhập email" disabled={!!editing} />
                    </Form.Item>

                    <Form.Item name="phone" label="Số điện thoại">
                        <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
                    </Form.Item>

                    <Form.Item name="address" label="Địa chỉ">
                        <TextArea
                            placeholder="Nhập địa chỉ"
                            rows={3}
                            showCount
                            maxLength={200}
                        />
                    </Form.Item>

                    <Form.Item name="typeLogin" label="Loại đăng nhập">
                        <Input disabled placeholder="Email hoặc Google" />
                    </Form.Item>

                    <Form.Item
                        name="isAdmin"
                        label="Quyền hạn"
                        valuePropName="checked"
                        tooltip="Bật để cấp quyền Admin, tắt để cấp quyền User"
                    >
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.getFieldValue('isAdmin') || false}
                                onChange={(e) => form.setFieldsValue({ isAdmin: e.target.checked })}
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-600">
                                {form.getFieldValue('isAdmin') ? 'Admin' : 'User'}
                            </span>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Xem chi tiết */}
            <Modal
                title="Chi tiết người dùng"
                open={viewModalOpen}
                onCancel={() => setViewModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setViewModalOpen(false)}>
                        Đóng
                    </Button>,
                    <Button
                        key="edit"
                        type="primary"
                        onClick={() => {
                            setViewModalOpen(false);
                            if (viewing) handleEdit(viewing);
                        }}
                    >
                        Sửa thông tin
                    </Button>,
                ]}
                width={600}
            >
                {viewing && (
                    <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-center mb-6">
                            <Avatar
                                size={80}
                                src={
                                    viewing.avatar
                                        ? `${import.meta.env.VITE_URL_IMAGE}/uploads/avatars/${viewing.avatar}`
                                        : null
                                }
                                icon={!viewing.avatar && <UserOutlined />}
                                className="bg-blue-100 text-blue-600"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Text type="secondary" className="text-xs">
                                    Họ và tên
                                </Text>
                                <div className="font-medium text-gray-800 mt-1">{viewing.fullName}</div>
                            </div>
                            <div>
                                <Text type="secondary" className="text-xs">
                                    Email
                                </Text>
                                <div className="font-medium text-gray-800 mt-1">{viewing.email}</div>
                            </div>
                            <div>
                                <Text type="secondary" className="text-xs">
                                    Số điện thoại
                                </Text>
                                <div className="font-medium text-gray-800 mt-1">
                                    {viewing.phone || <span className="text-gray-400">Chưa cập nhật</span>}
                                </div>
                            </div>
                            <div>
                                <Text type="secondary" className="text-xs">
                                    Loại đăng nhập
                                </Text>
                                <div className="mt-1">
                                    <Tag color={viewing.typeLogin === 'google' ? 'blue' : 'default'}>
                                        {viewing.typeLogin === 'google' ? 'Google' : 'Email'}
                                    </Tag>
                                </div>
                            </div>
                            <div>
                                <Text type="secondary" className="text-xs">
                                    Quyền hạn
                                </Text>
                                <div className="mt-1">
                                    <Tag color={viewing.isAdmin ? 'red' : 'green'} icon={viewing.isAdmin && <CrownOutlined />}>
                                        {viewing.isAdmin ? 'Admin' : 'User'}
                                    </Tag>
                                </div>
                            </div>
                            <div>
                                <Text type="secondary" className="text-xs">
                                    Trạng thái
                                </Text>
                                <div className="mt-1">
                                    <Badge
                                        status={viewing.isOnline ? 'success' : 'default'}
                                        text={viewing.isOnline ? 'Đang online' : 'Offline'}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <Text type="secondary" className="text-xs">
                                Địa chỉ
                            </Text>
                            <div className="font-medium text-gray-800 mt-1">
                                {viewing.address || <span className="text-gray-400">Chưa cập nhật</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <Text type="secondary" className="text-xs">
                                    Ngày tạo
                                </Text>
                                <div className="font-medium text-gray-800 mt-1">
                                    {dayjs(viewing.createdAt).format('DD/MM/YYYY HH:mm')}
                                </div>
                            </div>
                            <div>
                                <Text type="secondary" className="text-xs">
                                    Cập nhật lần cuối
                                </Text>
                                <div className="font-medium text-gray-800 mt-1">
                                    {dayjs(viewing.updatedAt).format('DD/MM/YYYY HH:mm')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default UserAdmin;

