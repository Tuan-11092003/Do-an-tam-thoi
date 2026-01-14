import './App.css';
import Banner from './components/Banner';
import Category from './components/Category';
import Chatbot from './components/ChatBot';
import Counpon from './components/Counpon';
import FlashSale from './components/FlashSale';
import Footer from './components/Footer';
import Header from './components/Header';
import ModalChat from './components/chat/ModalChat';
import NewsHome from './components/NewsHome';

function App() {
    return (
        <div>
            <header>
                <Header />
            </header>

            <main className="pt-16">
                <Banner />
                <Counpon />
                <FlashSale />
                <Category />
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
