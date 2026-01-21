/**
 * Format số tiền thành định dạng VND
 * @param {number} price - Số tiền cần format
 * @returns {string} - Chuỗi đã được format (ví dụ: "1.000.000 ₫")
 */
export const formatPrice = (price) => {
    if (!price && price !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
    }).format(price);
};

