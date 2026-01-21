import './App.css';
import Banner from './components/banner/Banner';
import CategoryList from './components/category/CategoryList';
import Chatbot from './components/chat/ChatBot';
import Coupon from './components/coupon/Coupon';
import FlashSale from './components/flashsale/FlashSale';
import Footer from './components/layout/Footer';
import Header from './components/layout/Header';
import ModalChat from './components/chat/ModalChat';
import NewsHome from './components/news/NewsHome';

function App() {
    return (
        <div>
            <header>
                <Header />
            </header>

            <main className="pt-16">
                <Banner />
                <Coupon />
                <FlashSale />
                <CategoryList />
                <NewsHome />
                <ModalChat />
                <Chatbot />
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default App;
