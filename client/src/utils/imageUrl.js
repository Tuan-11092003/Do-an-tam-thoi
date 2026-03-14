/**
 * Trả về URL ảnh để hiển thị.
 * - Nếu value đã là URL đầy đủ (Cloudinary, http...) → dùng luôn.
 * - Nếu là tên file (ảnh cũ lưu local) → ghép với base URL + /uploads/{folder}/.
 * @param {string} value - URL đầy đủ hoặc tên file
 * @param {'avatars'|'products'|'previewProducts'|'warranty'} [folder='products']
 * @returns {string}
 */
export function getImageUrl(value, folder = 'products') {
    if (!value) return '';
    const str = typeof value === 'string' ? value : String(value);
    if (str.startsWith('http://') || str.startsWith('https://')) return str;
    const base = import.meta.env.VITE_API_URL || import.meta.env.VITE_URL_IMAGE || '';
    return `${base}/uploads/${folder}/${str}`;
}
