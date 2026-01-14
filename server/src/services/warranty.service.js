const Warranty = require('../models/warranty.model');
const User = require('../models/users.model');
const SendMailAcceptExchange = require('../utils/sendMailAcceptExchange');

class WarrantyService {
    async getWarrantyByUserId(userId) {
        const warranty = await Warranty.find({ userId }).populate('productId').lean();
        
        // Calculate warranty progress on server
        const now = new Date();
        const warrantyWithProgress = warranty.map((item) => {
            const received = new Date(item.receivedDate);
            const returnExpiry = new Date(item.returnDate);
            
            const totalDuration = returnExpiry - received;
            const elapsed = now - received;
            const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
            
            return {
                ...item,
                warrantyProgress: {
                    progress: Math.round(progress),
                    isExpired: now > returnExpiry,
                    daysLeft: Math.max(0, Math.ceil((returnExpiry - now) / (1000 * 60 * 60 * 24))),
                },
            };
        });
        
        return warrantyWithProgress;
    }

    async createWarranty(reason, warrantyId, images, status, description) {
        const warranty = await Warranty.findByIdAndUpdate(
            warrantyId,
            { reason, images, status, description },
            { new: true },
        );
        return warranty;
    }

    async getWarrantyByAdmin() {
        // Chỉ lấy các warranty đã có yêu cầu đổi trả (có reason hoặc description không null và không rỗng)
        // Warranty được tạo khi đơn hàng "delivered" có reason: null và description: null, nên sẽ không được lấy
        // Chỉ khi client submit return request thì reason/description mới có giá trị
        
        // Lấy tất cả warranty và filter ở JavaScript để đảm bảo chính xác
        const allWarranty = await Warranty.find({})
            .populate('productId', 'name price colors')
            .populate('userId', 'name email phone')
            .sort({ receivedDate: -1 })
            .lean();
        
        // Chỉ lấy warranty có reason hoặc description là string và có giá trị thực sự (không null, không rỗng, không chỉ khoảng trắng)
        // Warranty được tạo khi "delivered" có reason: null và description: undefined, nên sẽ bị loại bỏ
        const filteredWarranty = allWarranty.filter(item => {
            const hasReason = item.reason != null && 
                           typeof item.reason === 'string' && 
                           item.reason.trim().length > 0;
            const hasDescription = item.description != null && 
                                 typeof item.description === 'string' && 
                                 item.description.trim().length > 0;
            return hasReason || hasDescription;
        });
        
        return filteredWarranty;
    }

    async updateWarrantyStatus(warrantyId, status) {
        const warranty = await Warranty.findByIdAndUpdate(warrantyId, { status }, { new: true });
        
        let emailSent = false;
        
        // Gửi email khi trạng thái là "approved" (chấp nhận)
        // Chỉ cập nhật emailSent = true khi email gửi thành công (log "Exchange confirmation email sent:")
        if (status === 'approved') {
            try {
                const findUser = await User.findById(warranty.userId);
                if (findUser && findUser.email) {
                    const emailResult = await SendMailAcceptExchange(findUser.email, warranty._id.toString());
                    emailSent = emailResult.success === true;
                    
                    // Cập nhật emailSent vào database nếu email gửi thành công
                    if (emailSent) {
                        await Warranty.findByIdAndUpdate(warrantyId, { emailSent: true }, { new: true });
                        warranty.emailSent = true;
                    }
                }
            } catch (error) {
                console.error('Error sending warranty approval email:', error);
                emailSent = false;
            }
        }
        
        // Trả về warranty (đã có emailSent nếu email thành công)
        return warranty;
    }
}

module.exports = new WarrantyService();
