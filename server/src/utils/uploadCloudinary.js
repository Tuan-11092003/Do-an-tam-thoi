const cloudinary = require('../config/cloudinary.config');

/**
 * Upload buffer (từ multer memoryStorage) lên Cloudinary.
 * @param {Buffer} buffer - Buffer file từ req.file.buffer
 * @param {string} folder - Thư mục trên Cloudinary (vd: 'avatars', 'products', 'previewProducts', 'warranty')
 * @param {string} [mimetype] - MIME type (vd: 'image/jpeg') để tạo data URI
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
async function uploadToCloudinary(buffer, folder, mimetype = 'image/jpeg') {
    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
        folder: `my-app/${folder}`,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
    });
    return { secure_url: result.secure_url, public_id: result.public_id };
}

/**
 * Upload nhiều file (req.files) lên Cloudinary.
 * @param {Array<{ buffer: Buffer, mimetype: string }>} files
 * @param {string} folder
 * @returns {Promise<string[]>} Mảng secure_url
 */
async function uploadMultipleToCloudinary(files, folder) {
    const urls = await Promise.all(
        files.map((file) => uploadToCloudinary(file.buffer, folder, file.mimetype).then((r) => r.secure_url))
    );
    return urls;
}

module.exports = { uploadToCloudinary, uploadMultipleToCloudinary };
