const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const Product = require('../models/product.model');
const MessageChatbot = require('../models/messageChatbot.model');


async function askShoeAssistant(question, userId) {
    try {
        // 🧠 Lấy 5 tin nhắn gần nhất để hiểu ngữ cảnh hội thoại
        const recentMessages = await MessageChatbot.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();

        // Sắp xếp lại đúng thứ tự thời gian
        const conversation = recentMessages.reverse();

        // Chuyển đổi hội thoại thành dạng text
        const conversationText = conversation
            .map((msg) => `${msg.sender === 'user' ? 'Người dùng' : 'Bot'}: ${msg.content}`)
            .join('\n');

        // 🛍️ Lấy danh sách sản phẩm để AI tư vấn
        const products = await Product.find({ status: 'active' });
        if (!products.length) return 'Hiện tại chưa có sản phẩm nào trong cửa hàng.';

        const productData = products
            .map(
                (p) => `
                ID: ${p._id}
                Tên: ${p.name}
                Giá: ${p.price.toLocaleString('vi-VN')}đ
                Giảm giá: ${p.discount}%
                Màu: ${(p.colors || []).map((c) => c.name).join(', ') || 'Không có'}
                Size có sẵn: ${(p.variants || []).map((v) => v.size).join(', ') || 'Không có'}
                Mô tả: ${p.description ? p.description.substring(0, 80) + '...' : 'Không có'}
                Link: /product/${p._id}
                ========================`,
            )
            .join('\n');

        // 🧩 Prompt gửi cho AI
        const trainingPrompt = `
            Bạn là "SneakerBot" – chatbot bán giày thân thiện, chuyên tư vấn sản phẩm.
            Dưới đây là danh sách sản phẩm hiện có:

            ${productData}

            Lịch sử trò chuyện gần đây:
            ${conversationText}

            Người dùng vừa nói: "${question}"

            Hãy:
            1. Hiểu ngữ cảnh trò chuyện trước đó.
            2. Gợi ý sản phẩm phù hợp theo nội dung, màu, giá, size.
            3. Khi đề xuất sản phẩm, LUÔN LUÔN thêm link sản phẩm với format: [Tên sản phẩm](/product/{ID}) để người dùng có thể click vào xem chi tiết.
            4. Ví dụ: "Tôi gợi ý bạn sản phẩm [Giày thể thao Nike Air Max](/product/507f1f77bcf86cd799439011)"
            5. Nếu người dùng hỏi tiếp, hãy phản hồi tự nhiên, thân thiện, không lặp lại toàn bộ thông tin.
            6. KHÔNG tạo đơn hàng, chỉ tư vấn sản phẩm.
            `;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'Bạn là SneakerBot – chuyên viên tư vấn giày dép, thân thiện và hiểu biết sản phẩm.',
                },
                { role: 'user', content: trainingPrompt },
            ],
            temperature: 0.7,
            max_tokens: 800,
        });

        const answer = completion.choices[0].message.content.trim();
        return answer;
    } catch (error) {
        console.error('❌ Lỗi askShoeAssistant:', error);
        return 'Xin lỗi, có lỗi xảy ra khi tư vấn sản phẩm. Vui lòng thử lại.';
    }
}

module.exports = { askShoeAssistant };
