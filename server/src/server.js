
const express = require('express');
const app = express();
const port = 3000;

const connectDB = require('./config/connectDB');
const routes = require('./routes/index.routes');

const { initSocket } = require('./socket');
const { createServer } = require('node:http');
const server = createServer(app);

const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration - cho phép nhiều origins (5173, 5174, 5175, và các localhost ports khác)
const allowedOrigins = [
    process.env.URL_CLIENT,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
].filter(Boolean); // Loại bỏ giá trị undefined/null

app.use(cors({ 
    origin: (origin, callback) => {
        // Cho phép (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Cho phép tất cả localhost với bất kỳ port nào (cho development)
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS: Origin không được phép: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true 
}));

app.use(express.static(path.join(__dirname, '../src')));

routes(app);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    // Không log lỗi 401/403 (unauthorized/forbidden) vì đây là hành vi bình thường
    // khi user chưa đăng nhập hoặc token hết hạn
    if (statusCode !== 401 && statusCode !== 403) {
        // Log lỗi để debug (chỉ log các lỗi thực sự)
    console.error('Error handler:', {
        statusCode,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });
    }
    
    // Đảm bảo luôn trả về JSON, không phải HTML
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Lỗi server',
    });
});

// Hàm để kiểm tra port có khả dụng không
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const testServer = require('http').createServer();
        testServer.listen(port, () => {
            testServer.once('close', () => resolve(true));
            testServer.close();
        });
        testServer.on('error', () => {
            resolve(false);
        });
    });
}

// Hàm để tìm port khả dụng
async function findAvailablePort(startPort, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        const testPort = startPort + i;
        const available = await isPortAvailable(testPort);
        if (available) {
            return testPort;
        }
    }
    throw new Error(`Không tìm thấy port khả dụng sau ${maxAttempts} lần thử`);
}

// Thử khởi động server
async function startServer(desiredPort) {
    let actualPort = desiredPort;

    const available = await isPortAvailable(desiredPort);

    if (!available) {
        console.log(`\n⚠️  Port ${desiredPort} đang được sử dụng, đang tìm port khác...`);
        try {
            actualPort = await findAvailablePort(desiredPort + 1);
            console.log(`🔄 Tìm thấy port khả dụng: ${actualPort}`);
        } catch (error) {
            console.error(`\n❌ Lỗi: ${error.message}`);
            console.error(`\n📋 Cách xử lý:`);
            console.error(`   1. Tìm và tắt tiến trình đang dùng port ${desiredPort}:`);
            console.error(`      netstat -ano | findstr :${desiredPort}`);
            console.error(`      taskkill /PID <PID> /F`);
            console.error(`   2. Hoặc đổi port trong file server.js (dòng 4)\n`);
            process.exit(1);
        }
    }

    // 🔥 CHỈ gọi initSocket 1 lần với httpServer đã được xác định (trước khi listen)
    initSocket(server);

    server.listen(actualPort, () => {
        console.log(`✅ Server đang chạy trên port ${actualPort}`);
        if (!available) {
            console.log(`⚠️  Lưu ý: Port ${desiredPort} đã được sử dụng, server đã tự động chuyển sang port ${actualPort}`);
        }
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\n❌ Lỗi: Port ${actualPort} đang được sử dụng!`);
            console.error(`\n📋 Cách xử lý:`);
            console.error(`   1. Tìm và tắt tiến trình đang dùng port ${actualPort}:`);
            console.error(`      netstat -ano | findstr :${actualPort}`);
            console.error(`      taskkill /PID <PID> /F`);
            console.error(`   2. Hoặc đổi port trong file server.js (dòng 4)\n`);
        } else {
            console.error(`\n❌ Lỗi khi khởi động server:`, err.message);
        }
        process.exit(1);
    });
}

startServer(port);
