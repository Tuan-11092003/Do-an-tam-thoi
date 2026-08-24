import { useState, useRef, useEffect } from 'react';
import { Button, Input, Spin, Avatar, Badge, Tooltip, Typography } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, CloseOutlined, MessageOutlined } from '@ant-design/icons';
import { Bot, Sparkles } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useNavigate, Link } from 'react-router-dom';
import { requestChatbot, requestGetMessageChatbot } from '../../services/user/userService';

const { Text } = Typography;

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const { dataUser } = useStore();
    const navigate = useNavigate();

    const fetchMessageChatbot = async () => {
        if (!dataUser._id) {
            setMessages([]);
            return [];
        }

        try {
            const res = await requestGetMessageChatbot();
            const nextMessages = Array.isArray(res?.metadata) ? res.metadata : [];
            setMessages(nextMessages);
            return nextMessages;
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error);
            setMessages([
                {
                    _id: 'welcome',
                    sender: 'bot',
                    content: '🤖 Xin chào! Tôi là trợ lý AI bạn cần hỗ trợ gì?',
                    timestamp: new Date(),
                },
            ]);
            return [];
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest',
            });
        }, 100);
    };

    useEffect(() => {
        if (!dataUser._id) return;
        fetchMessageChatbot();
    }, [dataUser._id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Cuá»™n xuá»‘ng khi tráº¡ng thÃ¡i loading thay Ä‘á»•i
    useEffect(() => {
        if (!isLoading) {
            scrollToBottom();
        }
    }, [isLoading]);

    // Cuá»™n xuá»‘ng khi má»Ÿ chat
    useEffect(() => {
        if (isOpen && messages.length > 0) {
            scrollToBottom();
        }
    }, [isOpen]);

    // Reset sá»‘ tin nháº¯n chÆ°a Ä‘á»c khi má»Ÿ chat
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    const handleSend = async () => {
        const question = inputValue.trim();
        if (!question) return;

        if (!dataUser._id) {
            const shouldLogin = window.confirm('🔐 Bạn cần đăng nhập để sử dụng chatbot.');
            if (shouldLogin) {
                navigate('/login');
            }
            return;
        }

        const userMessage = {
            _id: Date.now().toString(),
            sender: 'user',
            content: question,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setTimeout(() => scrollToBottom(), 50);

        try {
            const res = await requestChatbot({ question });
            const botContent = res?.metadata ?? 'Xin lỗi, tôi chưa có câu trả lời phù hợp cho câu hỏi này. Vui lòng thử lại.';

            setMessages((prev) => {
                const filtered = prev.filter((msg) => msg._id !== userMessage._id);
                return [...filtered, { _id: (Date.now() + 1).toString(), sender: 'user', content: question, timestamp: new Date() }, { _id: (Date.now() + 2).toString(), sender: 'bot', content: botContent, timestamp: new Date() }];
            });

            await fetchMessageChatbot();

            setTimeout(() => scrollToBottom(), 100);

            if (!isOpen) {
                setUnreadCount((prev) => prev + 1);
            }
        } catch (error) {
            setMessages((prev) => prev.filter((msg) => msg._id !== userMessage._id));
            await fetchMessageChatbot();
            console.error('Lỗi khi gửi tin nhắn chatbot:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Hàm parse và render link sản phẩm từ markdown format [text](/product/id)
    const renderMessageWithLinks = (content) => {
        if (!content) return null;

        const sanitizeDuplicatedProductLabel = (value) => {
            return String(value)
                .replace(/\[([^\]]+)\]\((\/product\/[a-fA-F0-9]{24})\)\s*\((?:\1)\)/gi, (_, label, url) => `[${label}](${url})`)
                .replace(/\[([^\]]+)\]\(\[([^\]]+)\]\((\/product\/[a-fA-F0-9]{24})\)\)/gi, (_, label, nestedLabel, url) => `[${label || nestedLabel}](${url})`)
                .replace(/\[([^\]]+)\]\((?!\/product\/)([^)]+)\)/g, (_, label, url) => {
                    if (label.trim() === url.trim()) {
                        return label.trim();
                    }
                    return `[${label}](${url})`;
                });
        };

        const sanitizedContent = sanitizeDuplicatedProductLabel(content);
        const linkRegex = /\[([^\]]+)\]\((\/product\/[^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        let hasLinks = false;

        while ((match = linkRegex.exec(sanitizedContent)) !== null) {
            hasLinks = true;
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: sanitizedContent.substring(lastIndex, match.index) });
            }
            parts.push({
                type: 'link',
                text: match[1],
                url: match[2],
            });
            lastIndex = linkRegex.lastIndex;
        }

        if (lastIndex < sanitizedContent.length) {
            parts.push({ type: 'text', content: sanitizedContent.substring(lastIndex) });
        }

        if (!hasLinks) {
            return sanitizedContent;
        }

        return (
            <>
                {parts.map((part, index) => {
                    if (part.type === 'link') {
                        return (
                            <Link
                                key={index}
                                to={part.url}
                                className="text-blue-600 hover:text-blue-800 underline font-medium"
                                onClick={() => setIsOpen(false)}
                            >
                                {part.text}
                            </Link>
                        );
                    }
                    return <span key={index}>{part.content}</span>;
                })}
            </>
        );
    };

    return (
        <div className="fixed bottom-30 right-6 z-50 font-sans">
            {isOpen ? (
                <div className="bg-white rounded-2xl shadow-2xl w-[380px] md:w-[420px] h-[550px] flex flex-col border border-gray-100 overflow-hidden font-sans">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 relative">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                                    <Bot className="text-white" size={22} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">AI hỗ trợ khách hàng</h3>
                                </div>
                            </div>
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:bg-white/20 rounded-full"
                                size="large"
                            />
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white scroll-smooth">
                        {messages.map((message, index) => (
                            <div
                                key={message._id || index}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
                            >
                                <div
                                    className={`flex items-start gap-2 max-w-[80%] ${
                                        message.sender === 'user' ? 'flex-row-reverse' : ''
                                    }`}
                                >
                                    {message.sender === 'bot' && (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white shadow-md flex items-center justify-center text-white">
                                            <Bot size={18} strokeWidth={2.2} />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <div
                                            className={`rounded-2xl px-4 py-3 shadow-sm ${
                                                message.sender === 'user'
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                                    : 'bg-white border border-gray-200'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                                {message.sender === 'bot' ? renderMessageWithLinks(message.content) : message.content}
                                            </p>
                                        </div>
                                        <Text
                                            className={`text-xs mt-1 ${
                                                message.sender === 'user'
                                                    ? 'text-right text-gray-500'
                                                    : 'text-left text-gray-400'
                                            }`}
                                        >
                                            {formatTime(message.timestamp)}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex items-start gap-2">
                                    <img
                                        src="https://promete.ai/wp-content/uploads/2023/03/avatar5-1.png"
                                        alt="avatar"
                                        className="w-10 h-10 object-cover rounded-full border-2 border-white shadow-md"
                                    />
                                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Spin size="small" />
                                            <Text className="text-gray-500 text-sm">AI đang trả lời...</Text>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-1" />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex gap-2">
                            <Input.TextArea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Nhập tin nhắn của bạn..."
                                autoSize={{ minRows: 1, maxRows: 4 }}
                                className="flex-1 rounded-xl border-gray-200 focus:border-indigo-500 focus:shadow-md transition-all font-sans"
                                disabled={isLoading}
                                autoFocus
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleSend}
                                disabled={isLoading || !inputValue.trim()}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 rounded-xl shadow-md hover:shadow-lg transition-all"
                                size="large"
                            />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <Text className="text-xs text-gray-400">
                                Nhấn Enter để gửi, Shift + Enter để xuống dòng
                            </Text>
                            {!dataUser._id && (
                                <Text className="text-xs text-orange-500">
                                    Đăng nhập để sử dụng đầy đủ tính năng
                                </Text>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <Tooltip title="Chat với AI Assistant" placement="left">
                    <div className="relative">
                        <button
                            onClick={() => setIsOpen(true)}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
                        >
                            <Bot className="text-white" size={28} strokeWidth={2.5} />
                        </button>
                        {unreadCount > 0 && (
                            <Badge
                                count={unreadCount}
                                className="absolute -top-2 -right-2"
                                style={{ backgroundColor: '#ff4d4f' }}
                            />
                        )}
                    </div>
                </Tooltip>
            )}
        </div>
    );
}

export default Chatbot;



