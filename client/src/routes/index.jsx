import App from '../App';
import Admin from '../pages/admin';
import CartPage from '../pages/cart/CartPage';
import CheckoutPage from '../pages/cart/CheckoutPage';
import ProductDetailPage from '../pages/product/ProductDetailPage';
import InfoUser from '../pages/InfoUser';
import LoginPage from '../pages/auth/LoginPage';
import PaymentSuccessPage from '../pages/payment/PaymentSuccessPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ProductListPage from '../pages/product/ProductListPage';
import DetailNewsPage from '../pages/news/DetailNewsPage';

// Admin components
import Dashboard from '../pages/admin/components/Dashboard';
import CategoryAdmin from '../pages/admin/components/CategoryAdmin';
import ProductAdmin from '../pages/admin/components/ProductAdmin';
import CouponManagement from '../pages/admin/components/CouponManager';
import OrderAdmin from '../pages/admin/components/OrderAdmin';
import WarrantyAdmin from '../pages/admin/components/WarrantyAdmin';
import MessageManager from '../pages/admin/components/MessageManager';
import FlashSaleAdmin from '../pages/admin/components/FlashSaleManagement';
import NewsAdmin from '../pages/admin/components/NewsAdmin';
import UserAdmin from '../pages/admin/components/UserAdmin';
import AdminRedirect from '../pages/admin/components/AdminRedirect';

export const routes = [
    {
        path: '/login',
        component: <LoginPage />,
    },
    {
        path: '/',
        component: <App />,
    },
    {
        path: '/register',
        component: <RegisterPage />,
    },
    {
        path: '/admin',
        component: <Admin />,
        children: [
            {
                path: '',
                component: <AdminRedirect />,
            },
            {
                path: 'dashboard',
                component: <Dashboard />,
            },
            {
                path: 'category',
                component: <CategoryAdmin />,
            },
            {
                path: 'product',
                component: <ProductAdmin />,
            },
            {
                path: 'coupon',
                component: <CouponManagement />,
            },
            {
                path: 'order',
                component: <OrderAdmin />,
            },
            {
                path: 'warranty',
                component: <WarrantyAdmin />,
            },
            {
                path: 'message',
                component: <MessageManager />,
            },
            {
                path: 'flashSale',
                component: <FlashSaleAdmin />,
            },
            {
                path: 'news',
                component: <NewsAdmin />,
            },
            {
                path: 'user',
                component: <UserAdmin />,
            },
        ],
    },
    {
        path: '/product/:id',
        component: <ProductDetailPage />,
    },
    {
        path: '/cart',
        component: <CartPage />,
    },
    {
        path: '/checkout',
        component: <CheckoutPage />,
    },
    {
        path: '/payment/success/:id',
        component: <PaymentSuccessPage />,
    },
    {
        path: '/profile',
        component: <InfoUser />,
    },
    {
        path: '/order',
        component: <InfoUser />,
    },
    {
        path: '/warranty',
        component: <InfoUser />,
    },
    {
        path: '/forgot-password',
        component: <ForgotPasswordPage />,
    },
    {
        path: '/favourite',
        component: <InfoUser />,
    },
    {
        path: '/category',
        component: <ProductListPage />,
    },
    {
        path: '/news/:id',
        component: <DetailNewsPage />,
    },
];
