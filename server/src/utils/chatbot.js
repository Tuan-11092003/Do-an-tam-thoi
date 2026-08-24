const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const Product = require('../models/product.model');
const MessageChatbot = require('../models/messageChatbot.model');

function normalizeProductReferences(text, productMap = new Map()) {
    if (!text || typeof text !== 'string') return text;

    let cleaned = text;

    cleaned = cleaned.replace(/\[([^\]]+)\]\((\/product\/[a-fA-F0-9]{24})\)\s*\((?:\1)\)/gi, (_, label, url) => `[${label}](${url})`);
    cleaned = cleaned.replace(/\[([^\]]+)\]\(\[([^\]]+)\]\((\/product\/[a-fA-F0-9]{24})\)\)/gi, (_, label, nestedLabel, url) => `[${label || nestedLabel}](${url})`);
    cleaned = cleaned.replace(/\[([^\]]+)\]\((?!\/product\/)([^)]+)\)/g, (_, label, url) => {
        if (label.trim() === url.trim()) {
            return label.trim();
        }
        return `[${label}](${url})`;
    });

    const rawProductPattern = /(?<!\]\()(?<!\])\/?product\/([a-fA-F0-9]{24})(?=\b|[\s)\]]|$)/g;
    cleaned = cleaned.replace(rawProductPattern, (match, productId) => {
        const productName = productMap.get(productId) || 'Sản phẩm';
        return `[${productName}](/product/${productId})`;
    });

    return cleaned;
}

const GROQ_MODEL_FALLBACKS = [
    process.env.GROQ_MODEL,
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'allam-2-7b',
].filter(Boolean);

function isRateLimitError(error) {
    return (
        error?.status === 429 ||
        error?.error?.code === 'rate_limit_exceeded' ||
        error?.code === 'rate_limit_exceeded' ||
        /rate limit reached|rate_limit_exceeded|tokens per day/i.test(error?.message || '')
    );
}

function extractAssistantTextFromCompletion(completion) {
    const choice = completion?.choices?.[0];
    const message = choice?.message ?? {};

    const contentCandidates = [];
    if (Array.isArray(message.content)) {
        contentCandidates.push(
            ...message.content.map((part) => (typeof part === 'string' ? part : part?.text || '')).filter(Boolean),
        );
    } else if (typeof message.content === 'string') {
        contentCandidates.push(message.content);
    }

    const joinedContent = contentCandidates.join(' ').trim();
    if (joinedContent) {
        return joinedContent;
    }

    const reasoning = typeof message.reasoning === 'string' ? message.reasoning.trim() : '';
    if (reasoning) {
        const sanitizedReasoning = reasoning.replace(/\s+/g, ' ');
        const looksLikeReasoning = /(?:The user says|The user asks|Need to|We should|So we can|This means|The instruction)/i.test(sanitizedReasoning);
        if (!looksLikeReasoning) return sanitizedReasoning;
    }

    return '';
}

async function createGroqChatCompletion(messages) {
    let lastError;

    for (const model of GROQ_MODEL_FALLBACKS) {
        try {
            const requestBody = {
                model,
                messages,
                temperature: 0.4,
                max_tokens: 300,
            };

            if (/gpt-oss/i.test(model)) {
                requestBody.reasoning_effort = 'low';
            }

            return await groq.chat.completions.create(requestBody);
        } catch (error) {
            lastError = error;
            const isModelNotFound = error?.status === 404 || error?.error?.code === 'model_not_found' || /does not exist or you do not have access/i.test(error?.message || '');
            const isTokenRateLimit = isRateLimitError(error);

            if (isModelNotFound || isTokenRateLimit) {
                console.warn(`Groq model unavailable: ${model}. Trying fallback model...`);
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

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

        const productMap = new Map(products.map((p) => [p._id.toString(), p.name]));

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
                Link markdown bắt buộc: [${p.name}](/product/${p._id})
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
            3. Viết câu trả lời theo kiểu tự nhiên, thân thiện, giống một nhân viên tư vấn thật, không chia thành bảng, không tạo hàng dọc kiểu "Tên | Giá | Màu | Size".
            4. Khi đề xuất sản phẩm, BẮT BUỘC dùng đúng format markdown link sau: [Tên sản phẩm](/product/{ID}). KHÔNG được viết dạng /product/{ID} hoặc (/product/{ID}) thuần.
            5. Ví dụ: "Tôi gợi ý bạn sản phẩm [Giày thể thao Nike Air Max](/product/507f1f77bcf86cd799439011)"
            6. Trả lời bằng câu văn tự nhiên, không liệt kê kiểu bảng. Nếu cần gợi ý 1 sản phẩm, hãy nói thành 1–2 câu ngắn. Nếu cần gợi ý nhiều sản phẩm, hãy nối bằng câu văn tự nhiên, không dạng danh sách cứng.
            7. Nếu người dùng hỏi tiếp, hãy phản hồi tự nhiên, ngắn gọn, không lặp lại toàn bộ thông tin.
            8. KHÔNG tạo đơn hàng, chỉ tư vấn sản phẩm.
            9. Nếu cần nhắc đến sản phẩm nào, hãy hiển thị tên sản phẩm làm text của link, không in ID lộ thiên.
            10. Không viết các câu kiểu "| Tên | Giá | Màu | Size |" hoặc bất kỳ định dạng bảng nào.
            `;

        const completion = await createGroqChatCompletion([
            {
                role: 'system',
                content: 'Bạn là SneakerBot – chuyên viên tư vấn giày dép, thân thiện và hiểu biết sản phẩm.',
            },
            { role: 'user', content: trainingPrompt },
        ]);

        const answer = extractAssistantTextFromCompletion(completion);
        const finalAnswer = normalizeProductReferences(String(answer || '').trim(), productMap);
        return finalAnswer || 'Xin lỗi, tôi chưa có câu trả lời phù hợp cho câu hỏi này. Vui lòng thử lại.';
    } catch (error) {
        console.error('❌ Lỗi askShoeAssistant:', error);

        if (isRateLimitError(error)) {
            return 'AI đang quá tải do giới hạn lượt sử dụng hôm nay. Vui lòng thử lại sau vài phút.';
        }

        return 'Xin lỗi, có lỗi xảy ra khi tư vấn sản phẩm. Vui lòng thử lại.';
    }
}

module.exports = { askShoeAssistant, normalizeProductReferences };
