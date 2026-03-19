const nodemailer = require('nodemailer');
require('dotenv').config();

const SendMailForgotPassword = async (email, otp) => {
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
        
        const info = await transport.sendMail({
            from: `"${storeName}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Yêu cầu đặt lại mật khẩu',
            text: `Mã OTP để đặt lại mật khẩu của bạn là: ${otp}\n\nLưu ý: Mã OTP này chỉ có hiệu lực trong 5 phút. Vui lòng sử dụng ngay.`,
            html: `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        background-color: #f2f4f8;
                        margin: 0;
                        padding: 12px;
                        color: #2d3436;
                    }
                    .wrapper {
                        width: 100%;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 6px 12px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #6c5ce7, #a29bfe);
                        padding: 20px 18px;
                        color: #ffffff;
                        text-align: center;
                    }
                    .header h2 {
                        margin: 0;
                        font-size: 20px;
                    }
                    .content {
                        padding: 20px 18px;
                    }
                    .message {
                        font-size: 14px;
                        margin-bottom: 14px;
                        line-height: 1.6;
                    }
                    .otp-box {
                        text-align: center;
                        background-color: #f1f2f6;
                        border: 1px dashed #6c5ce7;
                        padding: 14px;
                        font-size: 22px;
                        font-weight: bold;
                        color: #6c5ce7;
                        border-radius: 10px;
                        letter-spacing: 4px;
                        margin-bottom: 16px;
                    }
                    .footer {
                        text-align: center;
                        font-size: 13px;
                        padding: 16px;
                        background-color: #f1f2f6;
                        color: #636e72;
                    }
                    @media screen and (max-width: 480px) {
                        body {
                            padding: 8px;
                        }
                        .header {
                            padding: 16px 14px;
                        }
                        .header h2 {
                            font-size: 18px;
                        }
                        .content {
                            padding: 16px 14px;
                        }
                        .message {
                            font-size: 13px;
                        }
                        .otp-box {
                            font-size: 20px;
                            padding: 12px;
                        }
                        .footer {
                            padding: 12px;
                            font-size: 12px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <h2>Yêu cầu đặt lại mật khẩu</h2>
                        </div>
                        <div class="content">
                            <div class="message">
                                Bạn hoặc ai đó đã yêu cầu đặt lại mật khẩu cho tài khoản sử dụng địa chỉ email này.
                            </div>
                            <div class="message">
                                Vui lòng sử dụng mã OTP bên dưới để xác nhận và đặt lại mật khẩu:
                            </div>
                            <div class="otp-box">${otp}</div>
                            <div class="message" style="color: #e74c3c; font-weight: bold; text-align: center; margin-top: 8px;">
                                Lưu ý: Mã OTP này chỉ có hiệu lực trong <strong>5 phút</strong>. Vui lòng sử dụng ngay.
                            </div>
                            <div class="message">
                                Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.
                            </div>
                        </div>
                        <div class="footer">
                            Trân trọng,<br/>
                            <strong>${storeName}</strong>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `,
        });

        console.log('Email đặt lại mật khẩu đã được gửi:', info.messageId);
    } catch (error) {
        console.log('Lỗi khi gửi email đặt lại mật khẩu:', error);
    }
};

module.exports = SendMailForgotPassword;
