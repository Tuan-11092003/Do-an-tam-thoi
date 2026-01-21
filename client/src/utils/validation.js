/**
 * Validate email
 * @param {string} email - Email cần validate
 * @returns {boolean} - true nếu email hợp lệ
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate số điện thoại Việt Nam
 * @param {string} phone - Số điện thoại cần validate
 * @returns {boolean} - true nếu số điện thoại hợp lệ
 */
export const isValidPhone = (phone) => {
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    return phoneRegex.test(phone);
};

/**
 * Validate mật khẩu (ít nhất 6 ký tự)
 * @param {string} password - Mật khẩu cần validate
 * @returns {boolean} - true nếu mật khẩu hợp lệ
 */
export const isValidPassword = (password) => {
    return password && password.length >= 6;
};

