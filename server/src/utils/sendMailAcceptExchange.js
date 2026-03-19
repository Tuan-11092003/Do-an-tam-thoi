const nodemailer = require('nodemailer');
require('dotenv').config();

const SendMailAcceptExchange = async (email, orderCode) => {
    try {
        const transport = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });

        const storeName = 'KCONS VIỆT NAM';
        const returnAddress = 'Cổ Nhuế, Bắc Từ Liêm, Hà Nội';
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const info = await transport.sendMail({
            from: `"${storeName}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Xác nhận yêu cầu đổi hàng của bạn',
            text: `Yêu cầu đổi hàng cho đơn ${orderCode} của bạn đã được chấp nhận. Vui lòng gửi hàng về địa chỉ: ${returnAddress}.`,
            html: `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        background-color: #f5f5f5;
                        margin: 0;
                        padding: 16px;
                        color: #333333;
                    }
                    .wrapper {
                        width: 100%;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .header {
                        background-color: #dc3545;
                        padding: 28px 22px;
                        color: #ffffff;
                    }
                    .header-content {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }
                    .checkmark-box {
                        width: 56px;
                        height: 56px;
                        background-color: #28a745;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }
                    .checkmark {
                        font-size: 32px;
                        color: #ffffff;
                        font-weight: bold;
                    }
                    .header-text {
                        flex: 1;
                    }
                    .header h1 {
                        font-size: 22px;
                        font-weight: bold;
                        margin: 0 0 6px 0;
                        color: #ffffff;
                    }
                    .header p {
                        font-size: 13px;
                        margin: 0;
                        color: rgba(255,255,255,0.9);
                    }
                    .content {
                        background-color: #f8f9fa;
                        padding: 22px 20px;
                    }
                    .greeting {
                        font-size: 14px;
                        margin-bottom: 12px;
                        color: #333333;
                        font-weight: 500;
                    }
                    .intro {
                        font-size: 14px;
                        margin-bottom: 20px;
                        color: #333333;
                        line-height: 1.6;
                    }
                    .info-section {
                        background-color: #ffffff;
                        border-radius: 8px;
                        padding: 18px;
                        margin-bottom: 18px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                    }
                    .info-row {
                        display: flex;
                        margin-bottom: 12px;
                        align-items: flex-start;
                    }
                    .info-row:last-child {
                        margin-bottom: 0;
                    }
                    .info-label {
                        font-size: 13px;
                        color: #666666;
                        min-width: 140px;
                        font-weight: 500;
                    }
                    .info-value {
                        font-size: 13px;
                        color: #333333;
                        flex: 1;
                        font-weight: 600;
                    }
                    .info-value.code {
                        color: #dc3545;
                    }
                    .info-value.status {
                        color: #ff9800;
                    }
                    .message-section {
                        background-color: #ffffff;
                        border-radius: 8px;
                        padding: 18px;
                        margin-bottom: 18px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                    }
                    .message-item {
                        font-size: 14px;
                        margin-bottom: 12px;
                        color: #333333;
                        line-height: 1.7;
                    }
                    .message-item:last-child {
                        margin-bottom: 0;
                    }
                    .footer {
                        background-color: #ffffff;
                        padding: 22px 20px;
                        text-align: center;
                        border-top: 1px solid #e9ecef;
                    }
                    .footer-text {
                        font-size: 13px;
                        color: #666666;
                        line-height: 1.6;
                    }
                    .store-name {
                        font-weight: 600;
                        color: #333333;
                        margin-top: 8px;
                    }
                    @media screen and (max-width: 480px) {
                        body {
                            padding: 10px;
                        }
                        .header {
                            padding: 20px 16px;
                        }
                        .header-content {
                            flex-direction: row;
                            align-items: flex-start;
                        }
                        .header h1 {
                            font-size: 18px;
                        }
                        .content {
                            padding: 18px 14px;
                        }
                        .info-row {
                            flex-direction: column;
                        }
                        .info-label {
                            min-width: auto;
                            margin-bottom: 4px;
                        }
                        .checkmark-box {
                            width: 48px;
                            height: 48px;
                        }
                        .checkmark {
                            font-size: 28px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <div class="header-content">
                                <div class="checkmark-box">
                                    <div class="checkmark">✓</div>
                                </div>
                                <div class="header-text">
                                    <h1>Yêu cầu đổi trả đã được chấp nhận!</h1>
                                    <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi</p>
                                </div>
                            </div>
                        </div>
                        <div class="content">
                            <div class="greeting">Xin chào quý khách,</div>
                            <div class="intro">
                                Chúng tôi đã nhận được yêu cầu đổi trả của bạn và đã chấp nhận. Dưới đây là thông tin chi tiết:
                            </div>
                            
                            <div class="info-section">
                                <div class="info-row">
                                    <div class="info-label">Mã yêu cầu:</div>
                                    <div class="info-value code">${orderCode}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Ngày chấp nhận:</div>
                                    <div class="info-value">${formattedDate}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Trạng thái:</div>
                                    <div class="info-value status">Đã chấp nhận</div>
                                </div>
                            </div>

                            <div class="message-section">
                                <div class="message-item">
                                    Vui lòng để ý điện thoại, shipper sẽ liên hệ trong thời gian sớm nhất để hướng dẫn quý khách giao lại đơn hàng.
                                </div>
                                <div class="message-item">
                                    Sau khi nhận được hàng, chúng tôi sẽ tiến hành kiểm tra và gửi sản phẩm thay thế trong thời gian sớm nhất.
                                </div>
                            </div>
                        </div>
                        <div class="footer">
                            <div class="footer-text">
                                Trân trọng,<br>
                                <span class="store-name">Đội ngũ ${storeName}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `,
        });

        console.log('Email xác nhận đổi hàng đã được gửi:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.log('Lỗi khi gửi email xác nhận đổi hàng:', error);
        return { success: false, error: error.message };
    }
};

module.exports = SendMailAcceptExchange;
