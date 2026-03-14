import { useEffect, useState, useMemo } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Select,
    InputNumber,
    DatePicker,
    Space,
    Popconfirm,
    message,
    Input,
    Tooltip,
    Empty,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Zap, Percent, CalendarDays, CheckCircle, Clock, XCircle } from 'lucide-react';
import dayjs from 'dayjs';

import {
    requestCreateFlashSale,
    requestGetAllFlashSale,
    requestDeleteFlashSale,
    requestUpdateFlashSale,
} from '../../../services/flashSale/flashSaleService';
import { requestGetAllProduct } from '../../../services/product/productService';
import { getImageUrl } from '../../../utils/imageUrl';

const { RangePicker } = DatePicker;

function FlashSaleManagement() {
    const [flashSales, setFlashSales] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingFlashSale, setEditingFlashSale] = useState(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await requestGetAllProduct();
                setProducts(res.metadata || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchProducts();
    }, []);

    const fetchDataFlashSale = async () => {
        try {
            setLoading(true);
            const res = await requestGetAllFlashSale();
            setFlashSales(res?.metadata || []);
        } catch (e) {
            message.error('Không thể tải danh sách khuyến mãi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDataFlashSale();
    }, []);

    const getFlashSaleStatus = (startDate, endDate) => {
        const now = dayjs();
        if (now.isAfter(dayjs(endDate))) return { label: 'Đã kết thúc', bg: 'bg-gray-100', text: 'text-gray-500', icon: <XCircle className="w-3.5 h-3.5" /> };
        if (now.isAfter(dayjs(startDate))) return { label: 'Đang diễn ra', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> };
        return { label: 'Sắp diễn ra', bg: 'bg-blue-50', text: 'text-blue-700', icon: <Clock className="w-3.5 h-3.5" /> };
    };

    const getProductImage = (productId) => {
        const color = productId?.colors?.[0];
        if (!color?.images) return '';
        return Array.isArray(color.images) ? color.images[0] || '' : color.images;
    };

    const filteredFlashSales = useMemo(() => {
        if (!searchText.trim()) return flashSales;
        const keyword = searchText.toLowerCase().trim();
        return flashSales.filter((fs) => fs.productId?.name?.toLowerCase().includes(keyword));
    }, [flashSales, searchText]);

    const handleAdd = () => {
        setEditingFlashSale(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingFlashSale(record);
        const productIdValue = record.productId?._id || record.productId;
        form.setFieldsValue({
            productId: [productIdValue],
            discount: record.discount,
            dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await requestDeleteFlashSale(id);
            await fetchDataFlashSale();
            message.success('Xoá khuyến mãi thành công');
        } catch (err) {
            message.error('Xoá thất bại');
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            if (editingFlashSale) {
                const productIdValue = values.productId[0];
                await requestUpdateFlashSale({
                    _id: editingFlashSale._id,
                    productId: productIdValue,
                    discount: values.discount,
                    startDate: values.dateRange[0].toISOString(),
                    endDate: values.dateRange[1].toISOString(),
                });
                message.success('Cập nhật khuyến mãi thành công');
            } else {
                const newFlashSales = values.productId.map((productId) => ({
                    productId,
                    discount: values.discount,
                    startDate: values.dateRange[0].toISOString(),
                    endDate: values.dateRange[1].toISOString(),
                }));
                await requestCreateFlashSale(newFlashSales);
                message.success(`Thêm ${newFlashSales.length} khuyến mãi thành công`);
            }
            await fetchDataFlashSale();
            setIsModalVisible(false);
            form.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: '#',
            key: 'index',
            width: 50,
            align: 'center',
            render: (_, __, index) => <span className="text-gray-400 font-medium text-sm">{index + 1}</span>,
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'productId',
            key: 'product',
            render: (productId) => {
                if (!productId) return <span className="text-gray-400 text-sm">Không có sản phẩm</span>;
                const imgUrl = getProductImage(productId);
                return (
                    <div className="flex items-center gap-3">
                        <img
                            src={getImageUrl(imgUrl, 'products')}
                            alt={productId?.name || ''}
                            className="w-12 h-12 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                            onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="8"%3ENo img%3C/text%3E%3C/svg%3E';
                            }}
                        />
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate max-w-[260px]">{productId?.name || 'N/A'}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Giảm giá',
            dataIndex: 'discount',
            key: 'discount',
            width: 100,
            align: 'center',
            render: (d) => (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                    <Percent className="w-3 h-3" />
                    {d}%
                </span>
            ),
        },
        {
            title: 'Thời gian',
            key: 'time',
            width: 210,
            render: (_, record) => (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{dayjs(record.startDate).format('DD/MM/YYYY')}</span>
                    <span className="text-gray-300">→</span>
                    <span>{dayjs(record.endDate).format('DD/MM/YYYY')}</span>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 140,
            align: 'center',
            render: (_, record) => {
                const st = getFlashSaleStatus(record.startDate, record.endDate);
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
                        {st.icon}
                        {st.label}
                    </span>
                );
            },
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 160,
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
                        title="Xoá khuyến mãi này?"
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
            <style>{`
                .flashsale-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                    padding: 14px 16px;
                }
                .flashsale-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9;
                    padding: 12px 16px;
                }
                .flashsale-table .ant-table-tbody > tr:hover > td {
                    background: #f8fafc !important;
                }
                .flashsale-table .ant-table-container {
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
            `}</style>

            {/* Header */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 shadow-sm">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý khuyến mãi</h1>
                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                                    {flashSales.length} khuyến mãi
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">Quản lý tất cả chương trình Flash Sale</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Input
                            placeholder="Tìm kiếm sản phẩm..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-52 rounded-lg"
                            allowClear
                        />
                        <Tooltip title="Tải lại">
                            <Button icon={<ReloadOutlined />} onClick={fetchDataFlashSale} loading={loading} className="rounded-lg" />
                        </Tooltip>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            className="rounded-lg bg-blue-600 hover:!bg-blue-700 shadow-sm"
                        >
                            Thêm khuyến mãi
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={filteredFlashSales}
                    rowKey="_id"
                    loading={loading}
                    className="flashsale-table"
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        total: filteredFlashSales.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} khuyến mãi`,
                        className: 'px-4 py-3',
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={<span className="text-gray-500">{searchText ? 'Không tìm thấy khuyến mãi nào' : 'Chưa có khuyến mãi nào'}</span>}
                            />
                        ),
                    }}
                />
            </div>

            {/* Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        {editingFlashSale ? (
                            <>
                                <EditOutlined className="text-blue-500" />
                                <span>Chỉnh sửa khuyến mãi</span>
                            </>
                        ) : (
                            <>
                                <PlusOutlined className="text-green-500" />
                                <span>Thêm khuyến mãi mới</span>
                            </>
                        )}
                    </div>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={560}
                centered
                maskClosable={false}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
                    <Form.Item
                        name="productId"
                        label="Chọn sản phẩm"
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất một sản phẩm' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn một hoặc nhiều sản phẩm"
                            showSearch
                            maxTagCount="responsive"
                            className="rounded-lg"
                            filterOption={(input, option) =>
                                option?.['data-name']?.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {products.map((product) => {
                                const existingFlashSale = flashSales.find((fs) => {
                                    const productMatch =
                                        fs.productId?._id?.toString() === product._id?.toString() ||
                                        fs.productId?.toString() === product._id?.toString();
                                    const isNotEditing = fs._id !== editingFlashSale?._id;
                                    const { label } = getFlashSaleStatus(fs.startDate, fs.endDate);
                                    return productMatch && isNotEditing && (label === 'Đang diễn ra' || label === 'Sắp diễn ra');
                                });
                                const isDisabled = !!existingFlashSale && !editingFlashSale;
                                const imgUrl = getProductImage(product);

                                return (
                                    <Select.Option key={product._id} value={product._id} disabled={isDisabled} data-name={product.name}>
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={getImageUrl(imgUrl, 'products')}
                                                alt=""
                                                className="w-7 h-7 object-cover rounded"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            <span className={`text-sm ${isDisabled ? 'text-gray-400' : 'font-medium'}`}>
                                                {product.name}
                                                {isDisabled && ' (Đã có Flash Sale)'}
                                            </span>
                                        </div>
                                    </Select.Option>
                                );
                            })}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="discount"
                        label="Giảm giá (%)"
                        rules={[
                            { required: true, message: 'Nhập phần trăm giảm giá' },
                            { type: 'number', min: 1, max: 99, message: 'Giảm giá từ 1% đến 99%' },
                        ]}
                    >
                        <InputNumber min={1} max={99} placeholder="Nhập phần trăm" className="w-full rounded-lg" addonAfter="%" />
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="Thời gian khuyến mãi"
                        rules={[{ required: true, message: 'Chọn thời gian khuyến mãi' }]}
                    >
                        <RangePicker
                            format="DD/MM/YYYY"
                            placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                            className="w-full rounded-lg"
                        />
                    </Form.Item>

                    <Form.Item className="mb-0 text-right">
                        <Space>
                            <Button onClick={() => setIsModalVisible(false)} className="rounded-lg">
                                Huỷ
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading} className="rounded-lg bg-blue-600 hover:!bg-blue-700">
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
