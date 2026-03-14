import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Empty, Tag, Tooltip } from 'antd';
import { toast, ToastContainer } from 'react-toastify';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    SearchOutlined,
    ReloadOutlined,
    FolderOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import {
    requestCreateCategory,
    requestGetAllCategory,
    requestUpdateCategory,
    requestDeleteCategory,
} from '../../../services/category/categoryService';

function CategoryAdmin() {
    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await requestGetAllCategory(searchText);
            setData(res.metadata);
        } catch (error) {
            toast.error('Không thể tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchText]);

    const handleAdd = () => {
        setEditing(null);
        form.resetFields();
        setOpen(true);
    };

    const handleEdit = (record) => {
        setEditing(record);
        form.setFieldsValue(record);
        setOpen(true);
    };

    const handleDelete = async (_id) => {
        try {
            setLoading(true);
            await requestDeleteCategory(_id);
            toast.success('Đã xoá danh mục thành công');
            fetchData();
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi xoá danh mục');
            setLoading(false);
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (editing) {
                await requestUpdateCategory({ id: editing._id, categoryName: values.categoryName });
                toast.success('Đã cập nhật danh mục thành công');
            } else {
                await requestCreateCategory({ categoryName: values.categoryName });
                toast.success('Đã thêm danh mục mới thành công');
            }

            fetchData();
            setOpen(false);
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi lưu danh mục');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setOpen(false);
        form.resetFields();
    };

    const columns = [
        {
            title: '#',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) => (
                <span className="text-gray-400 font-medium">{index + 1}</span>
            ),
        },
        {
            title: 'Tên danh mục',
            dataIndex: 'categoryName',
            key: 'categoryName',
            render: (text) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                        <FolderOutlined />
                    </div>
                    <span className="font-semibold text-gray-800">{text}</span>
                </div>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            render: (date) => (
                <span className="text-gray-500 text-sm">
                    {new Date(date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    })}
                </span>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 200,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            className="border-blue-200 text-blue-600 hover:!bg-blue-50 hover:!border-blue-300"
                        >
                            Sửa
                        </Button>
                    </Tooltip>
                    <Popconfirm
                        title="Xoá danh mục này?"
                        description="Hành động này không thể hoàn tác."
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xoá"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        icon={<ExclamationCircleOutlined style={{ color: '#ef4444' }} />}
                    >
                        <Tooltip title="Xoá">
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                className="border-red-200 text-red-600 hover:!bg-red-50 hover:!border-red-300"
                            >
                                Xoá
                            </Button>
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <ToastContainer />
            <style>{`
                .category-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                    padding: 14px 16px;
                }
                .category-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9;
                    padding: 12px 16px;
                }
                .category-table .ant-table-tbody > tr:hover > td {
                    background: #f8fafc !important;
                }
                .category-table .ant-table-container {
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
            `}</style>

            {/* Header */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                            <AppstoreOutlined className="text-xl" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý danh mục</h1>
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                    {data.length} danh mục
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Quản lý tất cả danh mục sản phẩm
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Input
                            placeholder="Tìm kiếm danh mục..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-56 rounded-lg"
                            allowClear
                        />
                        <Tooltip title="Tải lại">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchData}
                                loading={loading}
                                className="rounded-lg"
                            />
                        </Tooltip>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            className="rounded-lg bg-blue-600 hover:!bg-blue-700 shadow-sm"
                        >
                            Thêm danh mục
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="_id"
                    loading={loading}
                    className="category-table"
                    pagination={{
                        total: data.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} danh mục`,
                        className: 'px-4 py-3',
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <span className="text-gray-500">
                                        {searchText ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào'}
                                    </span>
                                }
                            />
                        ),
                    }}
                />
            </div>

            {/* Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        {editing ? (
                            <>
                                <EditOutlined className="text-blue-500" />
                                <span>Chỉnh sửa danh mục</span>
                            </>
                        ) : (
                            <>
                                <PlusOutlined className="text-green-500" />
                                <span>Thêm danh mục mới</span>
                            </>
                        )}
                    </div>
                }
                open={open}
                onOk={handleOk}
                onCancel={handleCancel}
                okText={editing ? 'Cập nhật' : 'Thêm mới'}
                cancelText="Huỷ"
                confirmLoading={loading}
                centered
                maskClosable={false}
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="categoryName"
                        label="Tên danh mục"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên danh mục' },
                            { min: 2, message: 'Tên danh mục phải có ít nhất 2 ký tự' },
                            { max: 100, message: 'Tên danh mục không được quá 100 ký tự' },
                        ]}
                    >
                        <Input placeholder="Nhập tên danh mục" className="rounded-lg" autoFocus />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default CategoryAdmin;
