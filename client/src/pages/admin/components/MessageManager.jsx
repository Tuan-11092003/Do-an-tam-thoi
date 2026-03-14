import { useState, useEffect, useRef } from 'react';
import { Input, Avatar, Badge, Button, Empty, Tag } from 'antd';
import { Search, Send, MessageCircle, User, Clock, CheckCheck, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import {
    requestCreateMessage,
    requestGetAllConversation,
    requestGetMessageByConversationIdAdmin,
    requestUpdateMessageIsRead,
} from '../../../services/message/messageService';
import { useStore } from '../../../hooks/useStore';

const { TextArea } = Input;

function MessageManager() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const { dataUser, newMessage } = useStore();

    const fetchConversations = async () => {
        const res = await requestGetAllConversation();
        setUsers(res.metadata);
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(() => {
            fetchConversations();
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedUser) {
            const fetchMessages = async () => {
                const res = await requestGetMessageByConversationIdAdmin(selectedUser._id);
                const data = {
                    conversationId: selectedUser._id,
                    sender: selectedUser.user._id,
                };
                await requestUpdateMessageIsRead(data);
                setMessages(res.metadata.messages);
            };
            fetchMessages();
        }
    }, [selectedUser]);

    useEffect(() => {
        if (newMessage) {
            setMessages((prev) => [...prev, newMessage]);
            fetchConversations();
        }
    }, [newMessage]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, lengthIsRead: 0 } : u)));
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !selectedUser) return;

        const data = {
            conversationId: selectedUser._id,
            content: inputMessage,
        };

        setInputMessage('');
        inputRef.current?.focus();

        const res = await requestCreateMessage(data);

        if (res) {
            setMessages((prev) => [...prev, res]);
            setUsers((prev) => prev.map((u) => (u._id === selectedUser._id ? { ...u, lengthIsRead: 0 } : u)));
            setTimeout(() => {
                fetchConversations().then(() => {
                    setUsers((prev) =>
                        prev.map((u) => {
                            if (u._id === selectedUser._id) return { ...u, lengthIsRead: 0 };
                            return u;
                        }),
                    );
                });
            }, 500);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getTimeDisplay = (time) => {
        const now = dayjs();
        const messageTime = dayjs(time);
        const diffInMinutes = now.diff(messageTime, 'minute');
        const diffInHours = now.diff(messageTime, 'hour');
        const diffInDays = now.diff(messageTime, 'day');

        if (diffInMinutes < 1) return 'Vừa xong';
        if (diffInMinutes < 60) return `${diffInMinutes}p`;
        if (diffInHours < 24) return `${diffInHours}h`;
        if (diffInDays < 7) return `${diffInDays}d`;
        return messageTime.format('DD/MM');
    };

    const isAdminMessage = (message) => {
        return message.sender === 'admin' || message.sender?._id === dataUser._id || message.sender === dataUser._id;
    };

    const totalUnread = users.reduce((sum, u) => sum + (u.lengthIsRead || 0), 0);

    return (
        <div className="space-y-6 h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shadow-sm">
                        <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý tin nhắn</h1>
                            <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                                {users.length} cuộc trò chuyện
                            </span>
                            {totalUnread > 0 && (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                                    {totalUnread} chưa đọc
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">Chat và hỗ trợ khách hàng</p>
                    </div>
                </div>
            </div>

            {/* Chat Container */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex" style={{ height: 'calc(100% - 120px)' }}>
                {/* Sidebar */}
                <div className="w-80 border-r border-gray-200 flex flex-col flex-shrink-0">
                    {/* Search */}
                    <div className="p-3 border-b border-gray-100">
                        <Input
                            placeholder="Tìm kiếm..."
                            prefix={<Search size={16} className="text-gray-400" />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="rounded-lg"
                            allowClear
                        />
                    </div>

                    {/* User List */}
                    <div className="flex-1 overflow-y-auto">
                        {users.length === 0 ? (
                            <div className="p-8 text-center">
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có tin nhắn" />
                            </div>
                        ) : (
                            users
                                .filter((c) => !searchQuery.trim() || c.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((conversation) => {
                                    const user = conversation.user;
                                    const lastMessage = conversation.lastMessage;
                                    const isActive = selectedUser?._id === conversation._id;
                                    const hasUnread = conversation.lengthIsRead > 0;

                                    return (
                                        <div
                                            key={conversation._id}
                                            onClick={() => handleSelectUser(conversation)}
                                            className={`px-3 py-3 cursor-pointer transition-all border-b border-gray-50 ${
                                                isActive
                                                    ? 'bg-blue-50 border-l-[3px] border-l-blue-600'
                                                    : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex-shrink-0">
                                                    <Avatar
                                                        size={44}
                                                        src={user?.avatar ? `${import.meta.env.VITE_API_URL}/uploads/avatars/${user.avatar}` : undefined}
                                                        icon={!user?.avatar ? <User size={18} /> : undefined}
                                                        className={isActive ? '!bg-blue-500' : '!bg-gray-300'}
                                                    >
                                                        {!user?.avatar && user?.fullName?.[0]}
                                                    </Avatar>
                                                    <span
                                                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${
                                                            user?.isOnline ? 'bg-emerald-400' : 'bg-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                            {user?.fullName}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                                                            {getTimeDisplay(lastMessage?.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-0.5">
                                                        <p className={`text-xs truncate flex-1 ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                                                            {lastMessage?.content}
                                                        </p>
                                                        {hasUnread && (
                                                            <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                                                {conversation.lengthIsRead}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-5 py-3 border-b border-gray-200 bg-white flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Avatar
                                                size={40}
                                                src={selectedUser.user?.avatar ? `${import.meta.env.VITE_API_URL}/uploads/avatars/${selectedUser.user.avatar}` : undefined}
                                                icon={!selectedUser.user?.avatar ? <User size={18} /> : undefined}
                                            >
                                                {!selectedUser.user?.avatar && selectedUser.user?.fullName?.[0]}
                                            </Avatar>
                                            <span
                                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${
                                                    selectedUser.user?.isOnline ? 'bg-emerald-400' : 'bg-gray-300'
                                                }`}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-sm">{selectedUser.user?.fullName}</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${selectedUser.user?.isOnline ? 'bg-emerald-400' : 'bg-gray-300'}`}
                                                />
                                                <span className="text-xs text-gray-500">
                                                    {selectedUser.user?.isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Tag className="rounded-full border-0 bg-blue-50 text-blue-600 font-medium text-xs px-2.5">
                                        Khách hàng
                                    </Tag>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50/50">
                                <AnimatePresence>
                                    {messages.map((message) => (
                                        <motion.div
                                            key={message._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className={`mb-3 flex ${isAdminMessage(message) ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex gap-2 max-w-[70%] ${isAdminMessage(message) ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {!isAdminMessage(message) && (
                                                    <Avatar
                                                        size={28}
                                                        src={selectedUser.user?.avatar ? `${import.meta.env.VITE_API_URL}/uploads/avatars/${selectedUser.user.avatar}` : undefined}
                                                        icon={!selectedUser.user?.avatar ? <User size={14} /> : undefined}
                                                        className="flex-shrink-0 mt-auto !bg-gray-300"
                                                    >
                                                        {!selectedUser.user?.avatar && selectedUser.user?.fullName?.[0]}
                                                    </Avatar>
                                                )}
                                                <div>
                                                    <div
                                                        className={`px-3.5 py-2.5 rounded-2xl ${
                                                            isAdminMessage(message)
                                                                ? 'bg-blue-600 text-white rounded-br-md'
                                                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                                                        }`}
                                                    >
                                                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                                                            {message.content}
                                                        </p>
                                                    </div>
                                                    <div className={`flex items-center gap-1 mt-1 px-1 ${isAdminMessage(message) ? 'justify-end' : 'justify-start'}`}>
                                                        <span className="text-[10px] text-gray-400">
                                                            {dayjs(message.createdAt).format('HH:mm')}
                                                        </span>
                                                        {isAdminMessage(message) && (
                                                            <CheckCheck size={12} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                </div>
                                                {isAdminMessage(message) && (
                                                    <Avatar size={28} className="flex-shrink-0 mt-auto !bg-blue-600">
                                                        <User size={14} />
                                                    </Avatar>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {isTyping && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mb-3">
                                        <Avatar
                                            size={28}
                                            src={selectedUser.user?.avatar ? `${import.meta.env.VITE_API_URL}/uploads/avatars/${selectedUser.user.avatar}` : undefined}
                                            icon={!selectedUser.user?.avatar ? <User size={14} /> : undefined}
                                            className="!bg-gray-300"
                                        >
                                            {!selectedUser.user?.avatar && selectedUser.user?.fullName?.[0]}
                                        </Avatar>
                                        <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-bl-md">
                                            <div className="flex gap-1">
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
                                <div className="flex items-end gap-2">
                                    <TextArea
                                        ref={inputRef}
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Nhập tin nhắn..."
                                        autoSize={{ minRows: 1, maxRows: 4 }}
                                        className="flex-1 !rounded-xl !border-gray-200 focus:!border-blue-400 hover:!border-blue-300"
                                    />
                                    <Button
                                        type="primary"
                                        icon={<Send size={16} />}
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim()}
                                        className="!rounded-xl !bg-blue-600 hover:!bg-blue-700 !border-0 !h-[38px] !px-5 disabled:!opacity-40"
                                    >
                                        Gửi
                                    </Button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                                    Enter để gửi · Shift+Enter để xuống dòng
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50/30">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <MessageCircle className="text-blue-500 w-10 h-10" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">Chọn cuộc trò chuyện</h3>
                                <p className="text-sm text-gray-400">Chọn người dùng từ danh sách bên trái để bắt đầu</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MessageManager;
