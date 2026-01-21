/**
 * Format ngày tháng thành định dạng tiếng Việt
 * @param {string|Date} dateString - Ngày tháng cần format
 * @param {object} options - Tùy chọn format (year, month, day, hour, minute)
 * @returns {string} - Chuỗi ngày tháng đã được format
 */
export const formatDate = (dateString, options = {}) => {
    if (!dateString) return '';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
    };
    
    return new Date(dateString).toLocaleDateString('vi-VN', defaultOptions);
};

/**
 * Format ngày tháng với giờ phút
 * @param {string|Date} dateString - Ngày tháng cần format
 * @returns {string} - Chuỗi ngày tháng với giờ phút
 */
export const formatDateTime = (dateString) => {
    return formatDate(dateString, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

