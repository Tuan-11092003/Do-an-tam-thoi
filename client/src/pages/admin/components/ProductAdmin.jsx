import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Popconfirm, Select, Upload, Space, Empty, Tooltip, Tag } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UploadOutlined,
    SearchOutlined,
    ReloadOutlined,
    ShoppingOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { requestGetAllCategory } from '../../../services/category/categoryService';
import {
    requestCreateProduct,
    requestDeleteProduct,
    requestGetAllProduct,
    requestUpdateProduct,
    requestUploadImage,
} from '../../../services/product/productService';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../../utils/imageUrl';

function ProductManager() {
    const [products, setProducts] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [dataCategory, setDataCategory] = useState([]);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const fetchDataProduct = async () => {
        try {
            setLoading(true);
            const res = await requestGetAllProduct();
            setProducts(res.metadata || []);
        } catch (e) {
            toast.error('Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const cats = await requestGetAllCategory();
                setDataCategory(cats.metadata || []);
                await fetchDataProduct();
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    const filteredProducts = useMemo(() => {
        let result = products;
        if (searchText.trim()) {
            const keyword = searchText.toLowerCase().trim();
            result = result.filter((p) => p.name?.toLowerCase().includes(keyword));
        }
        if (filterCategory !== 'all') {
            result = result.filter((p) => p.category?._id === filterCategory);
        }
        return result;
    }, [products, searchText, filterCategory]);

    const handleAdd = () => {
        setEditingProduct(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingProduct(record);
        const firstColor = record.colors?.[0] || {};
        const colorImages = Array.isArray(firstColor.images) && firstColor.images.length > 0
            ? firstColor.images.map((img, index) => ({
                  uid: `-${index}`,
                  name: img,
                  status: 'done',
                  url: getImageUrl(img, 'products'),
              }))
            : firstColor.images
            ? [{ uid: '-1', name: firstColor.images, status: 'done', url: getImageUrl(firstColor.images, 'products') }]
            : [];

        form.setFieldsValue({
            name: record.name,
            price: Number(record.price || 0),
            discount: Number(record.discount || 0),
            category: record.category._id,
            description: record.description || '',
            colors: [{ name: firstColor.name || '', images: colorImages }],
            variants: (record.variants || []).map((v) => ({
                ...v,
                stock: Number(v.stock || 0),
            })),
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await requestDeleteProduct(id);
            await fetchDataProduct();
            toast.success('Xoá sản phẩm thành công');
        } catch (err) {
            toast.error('Xoá thất bại');
            setLoading(false);
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const colorEntry = values.colors?.[0] || {};
            const imageUrls = [];
            if (colorEntry.images && colorEntry.images.length > 0) {
                for (const fileItem of colorEntry.images) {
                    let imageUrl = null;
                    if (fileItem.url?.startsWith('http')) {
                        imageUrl = fileItem.url;
                    } else if (fileItem.url) {
                        imageUrl = fileItem.url.split('/uploads/products/').pop() || fileItem.url;
                    } else if (fileItem.originFileObj) {
                        const fd = new FormData();
                        fd.append('image', fileItem.originFileObj);
                        const r = await requestUploadImage(fd);
                        imageUrl = r?.url;
                    }
                    if (imageUrl) imageUrls.push(imageUrl);
                }
            }
            const uploadedColors = [{ name: colorEntry.name || '', images: imageUrls }];

            const processedVariants = (values.variants || []).map((v) => ({
                size: v.size,
                stock: Number(v.stock || 0),
            }));

            const payload = {
                name: values.name,
                price: Number(values.price || 0),
                discount: Number(values.discount || 0),
                category: values.category,
                description: values.description || '',
                colors: uploadedColors,
                variants: processedVariants,
            };

            if (editingProduct) {
                await requestUpdateProduct(editingProduct._id, payload);
                toast.success('Cập nhật sản phẩm thành công');
            } else {
                await requestCreateProduct(payload);
                toast.success('Tạo sản phẩm thành công');
            }

            await fetchDataProduct();
            setModalVisible(false);
            form.resetFields();
            setEditingProduct(null);
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi lưu sản phẩm');
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
            render: (_, __, index) => (
                <span className="text-gray-400 font-medium text-sm">{index + 1}</span>
            ),
        },
        {
            title: 'Sản phẩm',
            key: 'product',
            render: (_, record) => {
                const firstImage = record.colors?.[0]?.images;
                const imageUrl = Array.isArray(firstImage) ? firstImage[0] : firstImage;
                return (
                    <div className="flex items-center gap-3">
                        <img
                            src={getImageUrl(imageUrl, 'products')}
                            alt=""
                            className="w-14 h-14 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                        />
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate max-w-[280px]">{record.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{record.category?.categoryName || '—'}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            width: 150,
            render: (p) => (
                <span className="font-semibold text-gray-800">{formatCurrency(Number(p || 0))}</span>
            ),
        },
        {
            title: 'Giảm giá',
            dataIndex: 'discount',
            key: 'discount',
            width: 100,
            align: 'center',
            render: (d) => {
                const val = Number(d || 0);
                return val > 0 ? (
                    <Tag color="red" className="rounded-full px-2.5 font-medium border-0">-{val}%</Tag>
                ) : (
                    <span className="text-gray-400 text-sm">—</span>
                );
            },
        },
        {
            title: 'Tồn kho',
            dataIndex: 'variants',
            key: 'stock',
            width: 100,
            align: 'center',
            render: (variants) => {
                const total = (variants || []).reduce((sum, v) => sum + Number(v.stock || 0), 0);
                return (
                    <Tag
                        color={total > 10 ? 'green' : total > 0 ? 'orange' : 'red'}
                        className="rounded-full px-2.5 font-medium border-0"
                    >
                        {total}
                    </Tag>
                );
            },
        },
        {
            title: 'Hành động',
            key: 'action',
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
                        title="Xoá sản phẩm này?"
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
                .product-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                    padding: 14px 16px;
                }
                .product-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9;
                    padding: 12px 16px;
                }
                .product-table .ant-table-tbody > tr:hover > td {
                    background: #f8fafc !important;
                }
                .product-table .ant-table-container {
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
            `}</style>

            {/* Header */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                            <ShoppingOutlined className="text-xl" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý sản phẩm</h1>
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                    {products.length} sản phẩm
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">Quản lý tất cả sản phẩm trong cửa hàng</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Input
                            placeholder="Tìm kiếm sản phẩm..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-56 rounded-lg"
                            allowClear
                        />
                        <Select
                            value={filterCategory}
                            onChange={(val) => setFilterCategory(val)}
                            className="w-44"
                            popupMatchSelectWidth={false}
                        >
                            <Select.Option value="all">Tất cả danh mục</Select.Option>
                            {dataCategory.map((c) => (
                                <Select.Option key={c._id} value={c._id}>{c.categoryName}</Select.Option>
                            ))}
                        </Select>
                        <Tooltip title="Tải lại">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchDataProduct}
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
                            Thêm sản phẩm
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <Table
                    rowKey="_id"
                    columns={columns}
                    dataSource={filteredProducts}
                    loading={loading}
                    className="product-table"
                    pagination={{
                        total: filteredProducts.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`,
                        className: 'px-4 py-3',
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <span className="text-gray-500">
                                        {searchText || filterCategory !== 'all'
                                            ? 'Không tìm thấy sản phẩm nào'
                                            : 'Chưa có sản phẩm nào'}
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
                        {editingProduct ? (
                            <>
                                <EditOutlined className="text-blue-500" />
                                <span>Chỉnh sửa sản phẩm</span>
                            </>
                        ) : (
                            <>
                                <PlusOutlined className="text-green-500" />
                                <span>Thêm sản phẩm mới</span>
                            </>
                        )}
                    </div>
                }
                open={modalVisible}
                onOk={handleOk}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingProduct(null);
                }}
                okText={editingProduct ? 'Cập nhật' : 'Thêm mới'}
                cancelText="Huỷ"
                confirmLoading={loading}
                width={720}
                centered
                maskClosable={false}
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <div className="grid grid-cols-2 gap-6">
                        <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}>
                            <Input placeholder="Nhập tên sản phẩm" className="rounded-lg" />
                        </Form.Item>
                        <Form.Item name="price" label="Giá" rules={[{ required: true, message: 'Vui lòng nhập giá' }]}>
                            <InputNumber
                                style={{ width: '100%' }}
                                min={0}
                                className="rounded-lg"
                                placeholder="Nhập giá sản phẩm"
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value.replace(/,/g, '')}
                            />
                        </Form.Item>
                        <Form.Item name="discount" label="Giảm giá (%)">
                            <InputNumber style={{ width: '100%' }} min={0} max={100} className="rounded-lg" placeholder="0" />
                        </Form.Item>
                        <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}>
                            <Select placeholder="Chọn danh mục" className="rounded-lg">
                                {dataCategory.map((c) => (
                                    <Select.Option key={c._id} value={c._id}>{c.categoryName}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item name="description" label="Mô tả">
                        <ReactQuill theme="snow" style={{ height: 180 }} />
                    </Form.Item>

                    <div className="mt-12 rounded-xl border border-gray-200 p-5">
                        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-purple-50 text-purple-600 text-xs">🎨</span>
                            Màu sắc & Ảnh sản phẩm
                        </h3>
                        <Form.Item name={['colors', 0, 'name']} label="Tên màu" rules={[{ required: true, message: 'Nhập tên màu' }]}>
                            <Input placeholder="VD: Đen, Trắng, Xanh" className="rounded-lg" />
                        </Form.Item>
                        <Form.Item name={['colors', 0, 'images']} label="Ảnh sản phẩm" valuePropName="fileList" getValueFromEvent={(e) => e && e.fileList}>
                            <Upload listType="picture-card" multiple beforeUpload={() => false}>
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            </Upload>
                        </Form.Item>
                    </div>

                    <div className="mt-6 rounded-xl border border-gray-200 p-5">
                        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-orange-50 text-orange-600 text-xs">📏</span>
                            Kích thước
                        </h3>
                        <Form.List name="variants">
                            {(variantFields, { add: addVariant, remove: removeVariant }) => (
                                <div className="space-y-2">
                                    {variantFields.map(({ key: vKey, name: vName, ...vRest }) => (
                                        <div key={vKey} className="flex gap-3 items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <Form.Item {...vRest} name={[vName, 'size']} label="Size" rules={[{ required: true, message: 'Nhập size' }]} className="mb-0 flex-1">
                                                <Input placeholder="VD: 38, 39, 40" className="rounded-lg" />
                                            </Form.Item>
                                            <Form.Item {...vRest} name={[vName, 'stock']} label="Tồn kho" rules={[{ required: true, message: 'Nhập số lượng' }]} className="mb-0 flex-1">
                                                <InputNumber min={0} style={{ width: '100%' }} className="rounded-lg" />
                                            </Form.Item>
                                            <Button danger size="small" onClick={() => removeVariant(vName)} icon={<DeleteOutlined />} className="mt-7" />
                                        </div>
                                    ))}
                                    <Button type="dashed" block onClick={() => addVariant()} icon={<PlusOutlined />} className="rounded-lg">
                                        Thêm size
                                    </Button>
                                </div>
                            )}
                        </Form.List>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

export default ProductManager;
