const CryptoJS = require('crypto-js');

/**
 * Tạo MAC (Message Authentication Code) cho ZaloPay
 * @param {Number} appId - App ID
 * @param {String} appTransId - App Transaction ID
 * @param {String} appUser - App User
 * @param {Number} amount - Số tiền
 * @param {Number} appTime - Timestamp
 * @param {String} embedData - Embed data (JSON string)
 * @param {String} item - Item data (JSON string)
 * @param {String} key - Key để tạo MAC
 * @returns {String} MAC signature
 */
function createZaloPayMac(appId, appTransId, appUser, amount, appTime, embedData, item, key) {
    // Format MAC theo ZaloPay: app_id + | + app_trans_id + | + app_user + | + amount + | + app_time + | + embed_data + | + item
    const hmacInput = `${appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${item}`;
    
    // Tạo MAC bằng HMAC SHA256
    const mac = CryptoJS.HmacSHA256(hmacInput, key).toString();
    
    return mac;
}

/**
 * Format date theo format ZaloPay (yymmdd) - Vietnam timezone
 * @returns {String} Date string theo format yymmdd
 */
function formatZaloPayDate() {
    // Tạo yymmdd theo timezone Vietnam (GMT+7)
    const now = new Date();
    // Convert sang Vietnam timezone (GMT+7)
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const year = vietnamTime.getUTCFullYear().toString().slice(-2); // 2 số cuối của năm
    const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * Tạo ID thanh toán bao gồm cả giây để tránh trùng lặp
 * @returns {String} Payment ID
 */
function generatePayID() {
    // Tạo ID thanh toán bao gồm cả giây để tránh trùng lặp
    const now = new Date();
    const timestamp = now.getTime();
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    return `PAY${timestamp}${seconds}${milliseconds}`;
}

module.exports = {
    createZaloPayMac,
    formatZaloPayDate,
    generatePayID,
};

