import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, message, Space, Tooltip, Empty } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    GiftOutlined,
    SearchOutlined,
    ReloadOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Ticket, Percent, CalendarDays, Hash, Wallet, CheckCircle, Clock, XCircle } from 'lucide-react';
import dayjs from 'dayjs';
import {
    requestCreateCoupon,
    requestGetAllCoupon,
    requestUpdateCoupon,
    requestDeleteCoupon,
} from '../../../services/coupon/couponService';

const { RangePicker } = DatePicker;

function CouponManagement() {
    const [coupons, setCoupons] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await requestGetAllCoupon();
            setCoupons(res.metadata || []);
        } catch (error) {
            message.error('Không thể tải danh sách mã giảm giá');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const getCouponStatus = (startDate, endDate) => {
        const now = dayjs();
        if (now.isAfter(dayjs(endDate))) return { label: 'Đã kết thúc', bg: 'bg-gray-100', text: 'text-gray-500', icon: <XCircle className="w-3.5 h-3.5" /> };
        if (now.isAfter(dayjs(startDate))) return { label: 'Đang diễn ra', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> };
        return { label: 'Sắp diễn ra', bg: 'bg-blue-50', text: 'text-blue-700', icon: <Clock className="w-3.5 h-3.5" /> };
    };

    const filteredCoupons = useMemo(() => {
        if (!searchText.trim()) return coupons;
        const keyword = searchText.toLowerCase().trim();
        return coupons.filter((c) => c.nameCoupon?.toLowerCase().includes(keyword));
    }, [coupons, searchText]);

    const showModal = (coupon = null) => {
        setEditingCoupon(coupon);
        if (coupon) {
            form.setFieldsValue({
                nameCoupon: coupon.nameCoupon,
                discount: coupon.discount,
                quantity: coupon.quantity,
                dateRange: [dayjs(coupon.startDate), dayjs(coupon.endDate)],
                minPrice: coupon.minPrice,
            });
        } else {
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    const handleSubmit = () => {
        form.validateFields()
            .then(async (values) => {
                try {
                    setLoading(true);
                    const { dateRange, ...rest } = values;
                    const couponData = {
                        ...rest,
                        nameCoupon: values.nameCoupon.toUpperCase(),
                        startDate: dateRange[0].format('YYYY-MM-DD'),
                        endDate: dateRange[1].format('YYYY-MM-DD'),
                        productUsed: ['all'],
                    };

                    if (editingCoupon) {
                        await requestUpdateCoupon({ id: editingCoupon._id, ...couponData });
                        message.success('Cập nhật mã giảm giá thành công');
                    } else {
                        await requestCreateCoupon({ ...couponData, _id: Date.now().toString(), used: 0 });
                        message.success('Thêm mã giảm giá thành công');
                    }
                    fetchCoupons();
                    setIsModalOpen(false);
                    form.resetFields();
                } catch (error) {
                    message.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
                } finally {
                    setLoading(false);
                }
            })
            .catch(() => {});
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: 'Xoá mã giảm giá?',
            content: 'Hành động này không thể hoàn tác.',
            okText: 'Xoá',
            okType: 'danger',
            cancelText: 'Huỷ',
            icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
            async onOk() {
                try {
                    await requestDeleteCoupon(id);
                    fetchCoupons();
                    message.success('Đã xoá mã giảm giá');
                } catch (error) {
                    message.error('Xoá thất bại');
                }
            },
        });
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
            title: 'Mã giảm giá',
            dataIndex: 'nameCoupon',
            key: 'nameCoupon',
            render: (text) => (
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 flex-shrink-0">
                        <Ticket className="w-4 h-4" />
                    </div>
                    <span className="font-mono font-bold text-gray-800 tracking-wide">{text}</span>
                </div>
            ),
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
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            align: 'center',
            render: (q) => (
                <span className="inline-flex items-center gap-1 text-sm text-gray-700 font-medium">
                    <Hash className="w-3.5 h-3.5 text-gray-400" />
                    {q}
                </span>
            ),
        },
        {
            title: 'Đơn tối thiểu',
            dataIndex: 'minPrice',
            key: 'minPrice',
            width: 140,
            render: (price) => (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                    <Wallet className="w-3.5 h-3.5" />
                    {Number(price).toLocaleString('vi-VN')}đ
                </span>
            ),
        },
        {
            title: 'Thời gian',
            key: 'time',
            width: 200,
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
                const st = getCouponStatus(record.startDate, record.endDate);
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
            width: 140,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => showModal(record)}
                            className="border-blue-200 text-blue-600 hover:!bg-blue-50 hover:!border-blue-300"
                        >
                            Sửa
                        </Button>
                    </Tooltip>
                    <Tooltip title="Xoá">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record._id)}
                            className="border-red-200 text-red-600 hover:!bg-red-50 hover:!border-red-300"
                        >
                            Xoá
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <style>{`
                .coupon-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                    padding: 14px 16px;
                }
                .coupon-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9;
                    padding: 12px 16px;
                }
                .coupon-table .ant-table-tbody > tr:hover > td {
                    background: #f8fafc !important;
                }
                .coupon-table .ant-table-container {
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
            `}</style>

            {/* Header */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 shadow-sm">
                            <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý mã giảm giá</h1>
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                                    {coupons.length} mã
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">Quản lý tất cả mã giảm giá trong cửa hàng</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Input
                            placeholder="Tìm kiếm mã..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-52 rounded-lg"
                            allowClear
                        />
                        <Tooltip title="Tải lại">
                            <Button icon={<ReloadOutlined />} onClick={fetchCoupons} loading={loading} className="rounded-lg" />
                        </Tooltip>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => showModal()}
                            className="rounded-lg bg-blue-600 hover:!bg-blue-700 shadow-sm"
                        >
                            Thêm mã giảm giá
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <Table
                    dataSource={filteredCoupons}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    className="coupon-table"
                    pagination={{
                        total: filteredCoupons.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mã giảm giá`,
                        className: 'px-4 py-3',
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={<span className="text-gray-500">{searchText ? 'Không tìm thấy mã nào' : 'Chưa có mã giảm giá nào'}</span>}
                            />
                        ),
                    }}
                />
            </div>

            {/* Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        {editingCoupon ? (
                            <>
                                <EditOutlined className="text-blue-500" />
                                <span>Chỉnh sửa mã giảm giá</span>
                            </>
                        ) : (
                            <>
                                <GiftOutlined className="text-green-500" />
                                <span>Thêm mã giảm giá mới</span>
                            </>
                        )}
                    </div>
                }
                open={isModalOpen}
                onCancel={handleCancel}
                onOk={handleSubmit}
                okText={editingCoupon ? 'Cập nhật' : 'Thêm mới'}
                cancelText="Huỷ"
                confirmLoading={loading}
                width={560}
                centered
                maskClosable={false}
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="nameCoupon"
                        label="Mã giảm giá"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mã giảm giá' },
                            {
                                validator: (_, value) => {
                                    if (!value) return Promise.resolve();
                                    const isDuplicate = coupons.some(
                                        (c) => c.nameCoupon.toUpperCase() === value.toUpperCase() && c._id !== editingCoupon?._id,
                                    );
                                    return isDuplicate ? Promise.reject('Mã giảm giá đã tồn tại') : Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <Input placeholder="VD: PAT2026" className="rounded-lg uppercase" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="discount"
                            label="Giảm giá (%)"
                            rules={[
                                { required: true, message: 'Nhập giá trị giảm giá' },
                                { type: 'number', min: 1, max: 100, message: 'Giảm giá từ 1-100%' },
                            ]}
                        >
                            <InputNumber min={1} max={100} style={{ width: '100%' }} className="rounded-lg" placeholder="1 - 100" />
                        </Form.Item>
                        <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, message: 'Nhập số lượng' }]}>
                            <InputNumber min={1} style={{ width: '100%' }} className="rounded-lg" placeholder="Nhập số lượng" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="dateRange"
                        label="Thời gian hiệu lực"
                        rules={[{ required: true, message: 'Chọn thời gian hiệu lực' }]}
                    >
                        <RangePicker
                            className="w-full rounded-lg"
                            format="DD/MM/YYYY"
                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                    </Form.Item>

                    <Form.Item name="minPrice" label="Đơn hàng tối thiểu" rules={[{ required: true, message: 'Nhập giá trị đơn tối thiểu' }]}>
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            className="rounded-lg"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/,/g, '')}
                            placeholder="Nhập giá trị đơn tối thiểu"
                            addonAfter="đ"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default CouponManagement;
