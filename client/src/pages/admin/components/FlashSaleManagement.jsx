import { useEffect, useState } from 'react';
import {
    Table,
    Card,
    Button,
    Modal,
    Form,
    Select,
    InputNumber,
    DatePicker,
    Space,
    Popconfirm,
    message,
    Tag,
    Typography,
    Row,
    Col,
    Statistic,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { 
    requestCreateFlashSale, 
    requestGetAllFlashSale, 
    requestDeleteFlashSale, 
    requestUpdateFlashSale 
} from '../../../config/flashSale';
import { requestGetAllProduct } from '../../../config/ProductRequest';

const { Title } = Typography;
const { RangePicker } = DatePicker;

function FlashSaleManagement() {
    const [flashSales, setFlashSales] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingFlashSale, setEditingFlashSale] = useState(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchDataProduct = async () => {
            const res = await requestGetAllProduct();
            setProducts(res.metadata);
        };
        fetchDataProduct();
    }, []);

    const fetchDataFlashSale = async () => {
        try {
            const res = await requestGetAllFlashSale();
            setFlashSales(res?.metadata || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchDataFlashSale();
    }, []);

    // Calculate status based on dates (similar to CouponManager)
    const getFlashSaleStatus = (startDate, endDate) => {
        const now = dayjs();
        const start = dayjs(startDate);
        const end = dayjs(endDate);

        if (now.isAfter(end)) {
            return { status: 'Đã kết thúc', color: 'default' };
        } else if (now.isAfter(start) && now.isBefore(end)) {
            return { status: 'Đang diễn ra', color: 'success' };
        } else {
            return { status: 'Sắp diễn ra', color: 'processing' };
        }
    };

    const getProductInfo = (productId) => {
        const productIdStr = productId?.toString();
        return products.find((p) => {
            const pIdStr = p._id?.toString();
            return pIdStr === productIdStr;
        }) || {};
    };

    // Calculate counts based on dates
    const activeCount = flashSales.filter((fs) => {
        const { status } = getFlashSaleStatus(fs.startDate, fs.endDate);
        return status === 'Đang diễn ra';
    }).length;
    const scheduledCount = flashSales.filter((fs) => {
        const { status } = getFlashSaleStatus(fs.startDate, fs.endDate);
        return status === 'Sắp diễn ra';
    }).length;
    const expiredCount = flashSales.filter((fs) => {
        const { status } = getFlashSaleStatus(fs.startDate, fs.endDate);
        return status === 'Đã kết thúc';
    }).length;

    const handleAdd = () => {
        setEditingFlashSale(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingFlashSale(record);
        // Handle productId - can be object (populated) or string
        const productIdValue = record.productId?._id || record.productId;
        form.setFieldsValue({
            productId: [productIdValue], // Convert single product to array
            discount: record.discount,
            dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await requestDeleteFlashSale(id);
            await fetchDataFlashSale();
            message.success('Xóa flash sale thành công!');
        } catch (err) {
            console.error(err);
            message.error('Xóa flash sale thất bại');
        }
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            if (editingFlashSale) {
                // Edit mode: only update single flash sale
                const productIdValue = values.productId[0]; // Take first selected product
                const updatedFlashSale = {
                    _id: editingFlashSale._id,
                    productId: productIdValue,
                    discount: values.discount,
                    startDate: values.dateRange[0].toISOString(),
                    endDate: values.dateRange[1].toISOString(),
                };
                await requestUpdateFlashSale(updatedFlashSale);

                message.success('Cập nhật flash sale thành công!');
            } else {
                // Add mode: Server will validate duplicates
                // Create flash sale for all selected products - server will validate
                const newFlashSales = values.productId.map((productId) => ({
                    productId: productId,
                    discount: values.discount,
                    startDate: values.dateRange[0].toISOString(),
                    endDate: values.dateRange[1].toISOString(),
                }));

                await requestCreateFlashSale(newFlashSales);

                message.success(`Thêm ${newFlashSales.length} flash sale thành công!`);
            }

            // Refresh data from server to get updated list with status calculated by server
            await fetchDataFlashSale();
            setIsModalVisible(false);
            form.resetFields();
        } catch (error) {
            console.error('Error:', error);
            
            // Display error message from server
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra!';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'productId',
            key: 'images',
            width: 80,
            render: (productId) => {
                if (!productId) {
                    return <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">No image</div>;
                }
                return (
                    <img
                        src={`${import.meta.env.VITE_URL_IMAGE}/uploads/products/${
                            (() => {
                                const color = productId?.colors?.[0];
                                if (!color?.images) return '';
                                if (Array.isArray(color.images)) {
                                    return color.images[0] || '';
                                }
                                return color.images;
                            })()
                        }`}
                        alt={productId?.name || ''}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="10"%3ENo image%3C/text%3E%3C/svg%3E';
                        }}
                    />
                );
            },
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'productId',
            key: 'productName',
            render: (productId) => {
                if (!productId) {
                    return <div className="text-gray-400 text-sm">Không có sản phẩm</div>;
                }
                return (
                    <div>
                        <div className="font-medium text-sm">{productId?.name || 'N/A'}</div>
                    </div>
                );
            },
        },
        {
            title: 'Giảm giá',
            dataIndex: 'discount',
            key: 'discount',
            render: (discount) => (
                <Tag color="volcano" className="font-medium text-xs">
                    -{discount}%
                </Tag>
            ),
        },
        {
            title: 'Thời gian',
            key: 'time',
            render: (_, record) => (
                <div className="flex items-center gap-1 text-gray-600">
                    <CalendarOutlined />
                    <span>
                        {dayjs(record.startDate).format('DD/MM/YYYY')} ~ {dayjs(record.endDate).format('DD/MM/YYYY')}
                    </span>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 150,
            render: (_, record) => {
                const { status, color } = getFlashSaleStatus(record.startDate, record.endDate);
                return (
                    <Tag color={color} className="font-semibold">
                        {status}
                    </Tag>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'actions',
            fixed: 'right',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm
                        title="Bạn có chắc muốn xóa?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <div className="mb-4">
                <Title level={4} className="mb-3">
                    <ThunderboltOutlined className="text-red-500 mr-2" />
                    Quản Lý Flash Sale
                </Title>

                <Row gutter={16} className="mb-4">
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Đang diễn ra"
                                value={activeCount}
                                valueStyle={{ color: '#3f8600' }}
                                prefix={<ThunderboltOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Sắp diễn ra"
                                value={scheduledCount}
                                valueStyle={{ color: '#1890ff' }}
                                prefix={<EyeOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Đã kết thúc"
                                value={expiredCount}
                                valueStyle={{ color: '#cf1322' }}
                                prefix={<DeleteOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Tổng Flash Sale"
                                value={flashSales.length}
                                valueStyle={{ color: '#722ed1' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="middle" className="mb-3">
                    Thêm Flash Sale Mới
                </Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                <Table
                    columns={columns}
                    dataSource={flashSales}
                    rowKey="_id"
                    size="small"
                        scroll={{ x: 'max-content' }}
                    pagination={{
                        total: flashSales.length,
                        pageSize: 10,
                        showSizeChanger: false,
                        showQuickJumper: false,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} flash sale`,
                    }}
                />
                </div>
            </Card>

            <Modal
                title={editingFlashSale ? 'Chỉnh sửa Flash Sale' : 'Thêm Flash Sale Mới'}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
                    <Form.Item
                        name="productId"
                        label="Chọn sản phẩm"
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất một sản phẩm!' }]}
                        tooltip="Bạn có thể chọn nhiều sản phẩm để áp dụng flash sale cùng lúc"
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn một hoặc nhiều sản phẩm"
                            showSearch
                            size="middle"
                            maxTagCount="responsive"
                        >
                            {products.map((product) => {
                                const existingFlashSale = flashSales.find(
                                    (fs) => {
                                        const productMatch = (fs.productId?._id?.toString() === product._id?.toString() || 
                                                             fs.productId?.toString() === product._id?.toString());
                                        const isNotEditing = fs._id !== editingFlashSale?._id;
                                        const { status } = getFlashSaleStatus(fs.startDate, fs.endDate);
                                        const isActiveOrScheduled = status === 'Đang diễn ra' || status === 'Sắp diễn ra';
                                        return productMatch && isNotEditing && isActiveOrScheduled;
                                    }
                                );
                                const isDisabled = existingFlashSale && !editingFlashSale;

                                return (
                                    <Select.Option key={product._id || product.id} value={product._id || product.id} disabled={isDisabled}>
                                        <div className="flex items-center space-x-2">
                                            <img
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
                                                alt={product.name || ''}
                                                className="w-8 h-8 object-cover rounded"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                            <div>
                                                <div
                                                    className={`font-medium text-sm ${
                                                        isDisabled ? 'text-gray-400' : ''
                                                    }`}
                                                >
                                                    {product.name}
                                                    {isDisabled && ' (Đã có Flash Sale)'}
                                                </div>
                                            </div>
                                        </div>
                                    </Select.Option>
                                );
                            })}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="discount"
                        label="Phần trăm giảm giá (%)"
                        rules={[
                            { required: true, message: 'Vui lòng nhập phần trăm giảm giá!' },
                            { type: 'number', min: 1, max: 99, message: 'Giảm giá phải từ 1% đến 99%!' },
                        ]}
                    >
                        <InputNumber
                            min={1}
                            max={99}
                            placeholder="Nhập phần trăm giảm giá"
                            size="middle"
                            className="w-full"
                            addonAfter="%"
                        />
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="Thời gian Flash Sale"
                        rules={[{ required: true, message: 'Vui lòng chọn thời gian flash sale!' }]}
                    >
                        <RangePicker
                            format="DD/MM/YYYY"
                            placeholder={['Thời gian bắt đầu', 'Thời gian kết thúc']}
                            size="middle"
                            className="w-full"
                        />
                    </Form.Item>

                    <Form.Item className="mb-0 text-right">
                        <Space>
                            <Button onClick={() => setIsModalVisible(false)} size="middle">
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading} size="middle">
                                {editingFlashSale ? 'Cập nhật' : 'Thêm mới'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default FlashSaleManagement;
