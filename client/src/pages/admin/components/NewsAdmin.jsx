import { useState, useEffect, useRef } from 'react';
import { Table, Button, Space, Modal, Form, Input, Tabs, Tag, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Editor } from '@tinymce/tinymce-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
    requestCreateNews,
    requestGetAllNews,
    requestDeleteNews,
    requestUpdateNews,
} from '../../../config/NewsRequest';

const { TabPane } = Tabs;
const { Option } = Select;

function NewsAdmin() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('1');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewNews, setPreviewNews] = useState(null);
    const editorRef = useRef(null);

    const newsTypeLabels = {
        terms: 'Điều khoản',
        privacy: 'Bảo mật',
        shipping: 'Vận chuyển',
        payment: 'Thanh toán',
        other: 'Khác',
    };

    // Fetch news
    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await requestGetAllNews();
            setNews(res.metadata);
        } catch (error) {
            toast.error('Lỗi khi tải tin tức!');
        } finally {
            setLoading(false);
        }
    };

    const showAddModal = () => {
        setEditingNews(null);
        form.resetFields();
        setIsModalVisible(true);
        setActiveTab('1');
    };

    const showEditModal = (newsItem) => {
        setEditingNews(newsItem);
        form.setFieldsValue({
            title: newsItem.title,
            content: newsItem.content,
            type: newsItem.type || 'other',
        });

        setIsModalVisible(true);
        setActiveTab('1');
    };

    const showPreview = (newsItem) => {
        setPreviewNews(newsItem);
        setPreviewVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setPreviewVisible(false);
    };

    const handleDelete = async (id) => {
        setLoading(true);
        try {
            await requestDeleteNews(id);
            toast.success('Xóa tin tức thành công!');
            fetchNews();
        } catch (error) {
            toast.error('Xóa tin tức thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            // Lấy content từ editor trước
            const content = editorRef.current ? editorRef.current.getContent() : '';
            
            // Validate content thủ công
            if (!content || content.trim() === '' || content === '<p></p>' || content === '<p><br></p>') {
                form.setFields([
                    {
                        name: 'content',
                        errors: ['Vui lòng nhập nội dung!'],
                    },
                ]);
                return;
            }
            
            // Cập nhật content vào form trước khi validate
            form.setFieldsValue({ content });
            
            // Validate các field khác
            const values = await form.validateFields();
            
            setLoading(true);

            const newsData = {
                ...values,
                content,
            };

            try {
                if (editingNews) {
                    await requestUpdateNews(editingNews._id, newsData);
                    toast.success('Cập nhật tin tức thành công!');
                } else {
                    await requestCreateNews(newsData);
                    toast.success('Thêm tin tức mới thành công!');
                }
                fetchNews();
                setIsModalVisible(false);
            } catch (error) {
                toast.error('Có lỗi xảy ra!');
            } finally {
                setLoading(false);
            }
        } catch (error) {
            // Validation error
            console.error('Validation error:', error);
        }
    };


    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div>
                    <div className="font-medium">{text}</div>
                    <Tag color={record.type === 'terms' ? 'red' : record.type === 'privacy' ? 'blue' : 'green'}>
                        {newsTypeLabels[record.type] || 'Khác'}
                    </Tag>
                </div>
            ),
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (
                <Tag color={type === 'terms' ? 'red' : type === 'privacy' ? 'blue' : 'green'}>
                    {newsTypeLabels[type] || 'Khác'}
                </Tag>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => showPreview(record)}>
                        Xem
                    </Button>
                    <Button type="default" size="small" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa tin tức này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <ToastContainer />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý tin tức</h1>
                <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                    Thêm tin tức mới
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={news}
                rowKey="_id"
                loading={loading}
                pagination={{
                    total: news.length,
                    pageSize: 10,
                    showSizeChanger: false,
                    showQuickJumper: false,
                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} tin tức`,
                }}
                className="bg-white rounded-lg shadow"
            />

            <Modal
                title={editingNews ? 'Chỉnh sửa tin tức' : 'Thêm tin tức mới'}
                open={isModalVisible}
                onCancel={handleCancel}
                width={1000}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Hủy
                    </Button>,
                    <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
                        {editingNews ? 'Cập nhật' : 'Thêm mới'}
                    </Button>,
                ]}
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane tab="Thông tin cơ bản" key="1">
                        <Form form={form} layout="vertical">
                            <Form.Item
                                name="title"
                                label="Tiêu đề"
                                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                            >
                                <Input placeholder="Nhập tiêu đề tin tức" />
                            </Form.Item>

                            <Form.Item
                                name="type"
                                label="Loại tin tức"
                                rules={[{ required: true, message: 'Vui lòng chọn loại tin tức!' }]}
                            >
                                <Select placeholder="Chọn loại tin tức">
                                    <Option value="terms">Điều khoản</Option>
                                    <Option value="privacy">Bảo mật</Option>
                                    <Option value="shipping">Vận chuyển</Option>
                                    <Option value="payment">Thanh toán</Option>
                                    <Option value="other">Khác</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="content"
                                label="Nội dung"
                                rules={[
                                    {
                                        validator: (_, value) => {
                                            const editorContent = editorRef.current ? editorRef.current.getContent() : '';
                                            if (!editorContent || editorContent.trim() === '') {
                                                return Promise.reject(new Error('Vui lòng nhập nội dung!'));
                                            }
                                            return Promise.resolve();
                                        },
                                    },
                                ]}
                            >
                                <Editor
                                    apiKey="g2qwk2y6zg5bza6a968m294w0md3zbil24ymnczb48mcys7m"
                                    onInit={(evt, editor) => {
                                        editorRef.current = editor;
                                        if (editingNews && editingNews.content) {
                                            const content = typeof editingNews.content === 'string' ? editingNews.content : String(editingNews.content || '');
                                            editor.setContent(content);
                                            form.setFieldsValue({ content });
                                        }
                                    }}
                                    onEditorChange={(content) => {
                                        form.setFieldsValue({ content });
                                        // Trigger validation
                                        form.validateFields(['content']);
                                    }}
                                    initialValue=""
                                    init={{
                                        height: 500,
                                        menubar: true,
                                        plugins: [
                                            'advlist',
                                            'autolink',
                                            'lists',
                                            'link',
                                            'image',
                                            'charmap',
                                            'preview',
                                            'anchor',
                                            'searchreplace',
                                            'visualblocks',
                                            'code',
                                            'fullscreen',
                                            'insertdatetime',
                                            'media',
                                            'table',
                                            'code',
                                            'help',
                                            'wordcount',
                                        ],
                                        toolbar:
                                            'undo redo | blocks | ' +
                                            'bold italic forecolor | alignleft aligncenter ' +
                                            'alignright alignjustify | bullist numlist outdent indent | ' +
                                            'removeformat | help',
                                        content_style:
                                            'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                                    }}
                                />
                            </Form.Item>
                        </Form>
                    </TabPane>
                </Tabs>
            </Modal>

            <Modal
                title="Xem trước tin tức"
                open={previewVisible}
                onCancel={handleCancel}
                width={800}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Đóng
                    </Button>,
                    previewNews && (
                        <Button
                            key="edit"
                            type="primary"
                            onClick={() => {
                                handleCancel();
                                showEditModal(previewNews);
                            }}
                        >
                            Chỉnh sửa
                        </Button>
                    ),
                ]}
            >
                {previewNews && (
                    <div className="preview-news">
                        <h1 className="text-2xl font-bold mb-4">{previewNews.title}</h1>
                        <Tag color={previewNews.type === 'terms' ? 'red' : 'blue'}>
                            {newsTypeLabels[previewNews.type] || 'Khác'}
                        </Tag>
                        <div className="mb-4 mt-2">
                            <strong className="block mb-2">Nội dung:</strong>
                            <div dangerouslySetInnerHTML={{ __html: previewNews.content }}></div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default NewsAdmin;

