import { useState } from 'react';
import { Form, Input, Button } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined, MailOutlined } from '@ant-design/icons';
import Footer from '../../components/layout/Footer';
import Header from '../../components/layout/Header';
import { Link, useNavigate } from 'react-router-dom';
import { requestLogin, requestLoginGoogle } from '../../services/user/userService';
import { toast } from 'react-toastify';
import { useStore } from '../../hooks/useStore';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import logo from '../../assets/logo.png';

function LoginPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { fetchAuth, fetchCart } = useStore();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const res = await requestLogin(values);
            toast.success('Đăng nhập thành công!');
            await fetchAuth();
            await fetchCart();
            const isAdmin = res?.metadata?.isAdmin === true;
            navigate(isAdmin ? '/admin/dashboard' : '/');
        } catch (error) {
            if (error.response?.data) {
                toast.error(error.response.data.message || 'Đăng nhập thất bại');
            } else {
                toast.error(error.message || 'Không thể kết nối đến server');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = async (response) => {
        try {
            const res = await requestLoginGoogle({ credential: response.credential });
            toast.success(res.message);
            await fetchAuth();
            await fetchCart();
            const isAdmin = res?.metadata?.isAdmin === true;
            navigate(isAdmin ? '/admin/dashboard' : '/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đăng nhập Google thất bại');
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
                            <h1 className="text-2xl font-bold text-white">Chào mừng trở lại</h1>
                            <p className="text-red-100 text-sm mt-1">Đăng nhập để tiếp tục mua sắm</p>
                        </div>

                        {/* Form */}
                        <div className="p-8">
                            <Form
                                form={form}
                                name="login"
                                layout="vertical"
                                onFinish={onFinish}
                                autoComplete="off"
                                size="large"
                            >
                                <Form.Item
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập email!' },
                                        { type: 'email', message: 'Email không hợp lệ!' },
                                    ]}
                                >
                                    <Input
                                        prefix={<MailOutlined className="text-gray-400" />}
                                        placeholder="Email của bạn"
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

                                <div className="flex justify-end mb-5">
                                    <Link to="/forgot-password" className="text-sm text-red-500 hover:text-red-600 font-medium">
                                        Quên mật khẩu?
                                    </Link>
                                </div>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    block
                                    className="!h-12 !rounded-xl !bg-red-500 hover:!bg-red-600 !border-0 !font-semibold !text-base !shadow-lg hover:!shadow-xl !transition-all"
                                >
                                    Đăng nhập
                                </Button>

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-3 bg-white text-gray-400">hoặc</span>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
                                        <GoogleLogin
                                            onSuccess={handleSuccess}
                                            onError={() => toast.error('Đăng nhập Google thất bại')}
                                            shape="pill"
                                            width="100%"
                                        />
                                    </GoogleOAuthProvider>
                                </div>
                            </Form>

                            <p className="text-center text-sm text-gray-500 mt-6">
                                Chưa có tài khoản?{' '}
                                <Link to="/register" className="text-red-500 hover:text-red-600 font-semibold">
                                    Đăng ký ngay
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

export default LoginPage;
