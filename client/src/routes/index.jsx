import App from '../App';
import Admin from '../pages/admin';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import DetailProduct from '../pages/DetailProduct';
import InfoUser from '../pages/InfoUser';
import LoginUser from '../pages/LoginUser';
import PaymentSucces from '../pages/PaymentSucces';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import Category from '../pages/Category';
import DetailNewsPage from '../pages/DetailNewsPage';

// Admin components
import Dashbroad from '../pages/admin/components/Dashbroad';
import CategoryAdmin from '../pages/admin/components/CategoryAdmin';
import ProductAdmin from '../pages/admin/components/ProductAdmin';
import CouponManagement from '../pages/admin/components/CounponManager';
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
        component: <LoginUser />,
    },
    {
        path: '/',
        component: <App />,
    },
    {
        path: '/register',
        component: <Register />,
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
                component: <Dashbroad />,
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
        component: <DetailProduct />,
    },
    {
        path: '/cart',
        component: <Cart />,
    },
    {
        path: '/checkout',
        component: <Checkout />,
    },
    {
        path: '/payment/success/:id',
        component: <PaymentSucces />,
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
        component: <ForgotPassword />,
    },
    {
        path: '/favourite',
        component: <InfoUser />,
    },
    {
        path: '/category',
        component: <Category />,
    },
    {
        path: '/news/:id',
        component: <DetailNewsPage />,
    },
];
