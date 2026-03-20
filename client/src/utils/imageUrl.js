
export function getImageUrl(value, folder = 'products') {
    if (!value) return '';

    // Support common shapes from backend: string URL/filename, or object like { secure_url / url }
    const resolved =
        typeof value === 'object' && value !== null
            ? (value.secure_url ?? value.url ?? value.image ?? value.path ?? value.filename)
            : value;

    const str = (typeof resolved === 'string' ? resolved : String(resolved)).trim();
    if (!str || str === 'undefined' || str === 'null') return '';

    // If already a full URL -> use as-is
    if (str.startsWith('http://') || str.startsWith('https://')) return str;

    // data URI
    if (str.startsWith('data:image/')) return str;

    // protocol-relative URL: //res.cloudinary.com/...
    if (str.startsWith('//')) return `https:${str}`;

    // cloudinary without protocol
    if (str.startsWith('res.cloudinary.com') || str.includes('.cloudinary.com/')) return `https://${str}`;

    // otherwise treat as a local filename/path
    const base = import.meta.env.VITE_API_URL || import.meta.env.VITE_URL_IMAGE || '';
    return `${base}/uploads/${folder}/${str}`;
}
