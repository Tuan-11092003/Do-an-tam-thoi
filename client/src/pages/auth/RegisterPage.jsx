import { useState } from 'react';
import { Form, Input, Button } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined, MailOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import Footer from '../../components/layout/Footer';
import Header from '../../components/layout/Header';
import { Link, useNavigate } from 'react-router-dom';
import { requestLogin, requestRegister } from '../../services/user/userService';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';
import { useStore } from '../../hooks/useStore';
import cookies from 'js-cookie';

function RegisterPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { fetchAuth, fetchCart } = useStore();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Đăng ký tài khoản
            await requestRegister(values);

            // Tự động đăng nhập sau khi đăng ký để đồng bộ header, giỏ hàng,...
            const loginRes = await requestLogin({
                email: values.email,
                password: values.password,
            });

            cookies.set('logged', '1', { expires: 7 });

            // Cập nhật lại thông tin user và giỏ hàng trong global store
            if (fetchAuth) {
                await fetchAuth();
            }
            if (fetchCart) {
                await fetchCart();
            }

            toast.success('Đăng ký thành công!');

            const isAdmin = loginRes?.metadata?.isAdmin === true;
            navigate(isAdmin ? '/admin/dashboard' : '/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Header />

            <main className="flex items-center justify-center py-12 pt-28 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-8 text-center">
                            <Link to="/">
                                <img src={logo} alt="logo" className="h-12 mx-auto mb-4 drop-shadow-md" />
                            </Link>
                            <h1 className="text-2xl font-bold text-white">Tạo tài khoản mới</h1>
                            <p className="text-red-100 text-sm mt-1">Đăng ký để bắt đầu mua sắm</p>
                        </div>

                        {/* Form */}
                        <div className="p-8">
                            <Form
                                form={form}
                                name="register"
                                layout="vertical"
                                onFinish={onFinish}
                                autoComplete="off"
                                size="large"
                            >
                                <Form.Item
                                    name="fullName"
                                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                                >
                                    <Input
                                        prefix={<UserOutlined className="text-gray-400" />}
                                        placeholder="Họ và tên"
                                        className="!h-12 !rounded-xl"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="phone"
                                    rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                                >
                                    <Input
                                        prefix={<PhoneOutlined className="text-gray-400" />}
                                        placeholder="Số điện thoại"
                                        className="!h-12 !rounded-xl"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập email!' },
                                        { type: 'email', message: 'Email không hợp lệ!' },
                                    ]}
                                >
                                    <Input
                                        prefix={<MailOutlined className="text-gray-400" />}
                                        placeholder="Email"
                                        className="!h-12 !rounded-xl"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="password"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập mật khẩu!' },
                                        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined className="text-gray-400" />}
                                        placeholder="Mật khẩu"
                                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                        className="!h-12 !rounded-xl"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="confirmPassword"
                                    rules={[
                                        { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                                        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined className="text-gray-400" />}
                                        placeholder="Xác nhận mật khẩu"
                                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                        className="!h-12 !rounded-xl"
                                    />
                                </Form.Item>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    block
                                    className="!h-12 !rounded-xl !bg-red-500 hover:!bg-red-600 !border-0 !font-semibold !text-base !shadow-lg hover:!shadow-xl !transition-all !mt-2"
                                >
                                    Đăng ký
                                </Button>
                            </Form>

                            <p className="text-center text-sm text-gray-500 mt-6">
                                Đã có tài khoản?{' '}
                                <Link to="/login" className="text-red-500 hover:text-red-600 font-semibold">
                                    Đăng nhập ngay
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default RegisterPage;
