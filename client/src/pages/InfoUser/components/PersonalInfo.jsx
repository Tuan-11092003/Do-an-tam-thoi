import { useState, useEffect } from 'react';
import { Form, Input, Button, Avatar, Upload, message, Card, Divider, Spin, Row, Col, Tooltip } from 'antd';
import {
    UserOutlined,
    PhoneOutlined,
    HomeOutlined,
    MailOutlined,
    UploadOutlined,
    EditOutlined,
    SaveOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import { useStore } from '../../../hooks/useStore';
import { requestUpdateUser, requestUploadAvatar } from '../../../config/UserRequest';

function PersonalInfo() {
    const { dataUser, fetchAuth } = useStore();
    const [editing, setEditing] = useState(false);
    const [form] = Form.useForm();
    const [avatar, setAvatar] = useState(dataUser?.avatar || null);
    const [loading, setLoading] = useState(false);

    // Initialize form with user data
    useEffect(() => {
        if (dataUser) {
            form.setFieldsValue({
                fullName: dataUser.fullName,
                email: dataUser.email,
                phone: dataUser.phone || '',
                address: dataUser.address || '',
            });
        }
    }, [dataUser, form]);

    const handleEdit = () => {
        setEditing(true);
    };

    const handleCancel = () => {
        setEditing(false);
        form.resetFields();
    };

    const handleSave = async (values) => {
        setLoading(true);

        try {
            await requestUpdateUser(values);
            message.success('Thông tin cá nhân đã được cập nhật thành công!');
            setEditing(false);
            // Refresh user data để cập nhật vào store
            if (fetchAuth) {
                await fetchAuth();
            }
            setLoading(false);
        } catch (error) {
            message.error('Thông tin cá nhân đã được cập nhật thất bại!');
            setLoading(false);
        }
    };

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Bạn chỉ có thể tải lên tệp hình ảnh!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Kích thước hình ảnh phải nhỏ hơn 2MB!');
        }
        return isImage && isLt2M;
    };

    const handleChange = async (info) => {
        try {
            const formData = new FormData();
            formData.append('avatar', info.file.originFileObj);
            const res = await requestUploadAvatar(formData);
            setAvatar(res.metadata);
            window.location.reload();
        } catch (error) {
            message.error('Tải lên thất bại!');
        }
    };

    return (
        <div className="w-full">
            {/* White Card */}
            <Card
                className="overflow-hidden shadow-xl border-0"
                style={{ borderRadius: '12px' }}
            >
                <div className="px-6 pb-6 pt-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative">
                            <Avatar
                                size={140}
                                src={dataUser?.avatar ? `${import.meta.env.VITE_API_URL}/uploads/avatars/${dataUser.avatar}` : undefined}
                                icon={<UserOutlined />}
                                className="border-4 border-gray-200 shadow-2xl"
                                style={{ backgroundColor: '#f0f0f0' }}
                            />
                            {editing && (
                                <div className="absolute bottom-0 right-0">
                                    <Upload
                                        name="avatar"
                                        showUploadList={false}
                                        beforeUpload={beforeUpload}
                                        onChange={handleChange}
                                        className="avatar-uploader"
                                    >
                                        <Button
                                            type="primary"
                                            shape="circle"
                                            icon={<UploadOutlined />}
                                            className="bg-red-600 hover:bg-red-700 border-0 shadow-lg"
                                        />
                                    </Upload>
                                </div>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Thông tin cá nhân</h2>
                        <p className="text-gray-500 text-base">Quản lý thông tin cá nhân của bạn</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end mb-6 gap-2">
                        {!editing ? (
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={handleEdit}
                                className="bg-red-600 hover:bg-red-700 border-0 shadow-md"
                                size="large"
                            >
                                Chỉnh sửa
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    icon={<CloseOutlined />}
                                    onClick={handleCancel}
                                    danger
                                    size="large"
                                    className="shadow-md"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={form.submit}
                                    loading={loading}
                                    className="bg-red-600 hover:bg-red-700 border-0 shadow-md"
                                    size="large"
                                >
                                    Lưu thay đổi
                                </Button>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSave}
                            disabled={!editing}
                            className="w-full"
                        >
                            {/* Contact Information Section */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <div className="w-1 h-6 bg-red-600 mr-3 rounded"></div>
                                    Thông tin liên hệ
                                </h3>
                                <Row gutter={[24, 16]}>
                                    <Col span={24} md={12}>
                                        <Form.Item
                                            name="fullName"
                                            label={
                                                <span className="text-gray-700 font-medium">
                                                    Họ và tên <span className="text-red-500">*</span>
                                                </span>
                                            }
                                            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                                        >
                                            <Input 
                                                prefix={<UserOutlined className="text-gray-400" />} 
                                                placeholder="Họ và tên"
                                                size="large"
                                                className="rounded-lg"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24} md={12}>
                                        <Form.Item
                                            name="email"
                                            label={
                                                <span className="text-gray-700 font-medium">
                                                    Email <span className="text-red-500">*</span>
                                                </span>
                                            }
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập email' },
                                                { type: 'email', message: 'Email không hợp lệ' },
                                            ]}
                                        >
                                            <Input 
                                                prefix={<MailOutlined className="text-gray-400" />} 
                                                placeholder="Email"
                                                size="large"
                                                className="rounded-lg"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={[24, 16]}>
                                    <Col span={24} md={12}>
                                        <Form.Item
                                            name="phone"
                                            label={
                                                <span className="text-gray-700 font-medium">
                                                    Số điện thoại <span className="text-red-500">*</span>
                                                </span>
                                            }
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập số điện thoại' },
                                                { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ' },
                                            ]}
                                        >
                                            <Input 
                                                prefix={<PhoneOutlined className="text-gray-400" />} 
                                                placeholder="Số điện thoại"
                                                size="large"
                                                className="rounded-lg"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* Address Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <div className="w-1 h-6 bg-red-600 mr-3 rounded"></div>
                                    Địa chỉ giao hàng
                                </h3>
                                <Form.Item 
                                    name="address"
                                >
                                    <Input.TextArea 
                                        placeholder="Nhập địa chỉ nhận hàng" 
                                        rows={4}
                                        className="rounded-lg"
                                        style={{ resize: 'none' }}
                                    />
                                </Form.Item>
                            </div>
                        </Form>
                    )}
                </div>
            </Card>
        </div>
    );
}

export default PersonalInfo;
