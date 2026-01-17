const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const modelApiKey = require('../models/apiKey.model');
const { AuthFailureError } = require('../core/error.response');
const { jwtDecode } = require('jwt-decode');

require('dotenv').config();

// Helper function để gia hạn ApiKey (tránh code trùng lặp)
const extendApiKeyExpiry = async (findApiKey) => {
    findApiKey.expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await findApiKey.save();
    return findApiKey;
};

const createApiKey = async (userId) => {
    const findApiKey = await modelApiKey.findOne({ userId });
    if (findApiKey) {
        return findApiKey;
    }

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

    const privateKeyString = privateKey.export({ type: 'pkcs8', format: 'pem' });
    const publicKeyString = publicKey.export({ type: 'spki', format: 'pem' });

    const newApiKey = new modelApiKey({ userId, publicKey: publicKeyString, privateKey: privateKeyString });
    return await newApiKey.save();
};

const createToken = async (payload) => {
    const findApiKey = await modelApiKey.findOne({ userId: payload.id });

    if (!findApiKey?.privateKey) {
        throw new Error('Private key not found for user');
    }

    return jwt.sign(payload, findApiKey.privateKey, {
        algorithm: 'RS256', // Quan trọng: Phải chỉ định thuật toán khi dùng RSA
        expiresIn: '15m',
    });
};

const createRefreshToken = async (payload) => {
    const findApiKey = await modelApiKey.findOne({ userId: payload.id });

    if (!findApiKey?.privateKey) {
        throw new Error('Private key not found for user');
    }

    return jwt.sign(payload, findApiKey.privateKey, {
        algorithm: 'RS256',
        expiresIn: '7d',
    });
};

const verifyToken = async (token) => {
    try {
        const { id } = jwtDecode(token);
        const findApiKey = await modelApiKey.findOne({ userId: id });

        if (!findApiKey) {
            throw new AuthFailureError('Vui lòng đăng nhập lại');
        }

        // Gia hạn ApiKey mỗi khi verify token thành công
        await extendApiKeyExpiry(findApiKey);

        return jwt.verify(token, findApiKey.publicKey, {
            algorithms: ['RS256'],
        });
    } catch (error) {
        throw new AuthFailureError('Vui lòng đăng nhập lại');
    }
};

module.exports = {
    createApiKey,
    createToken,
    createRefreshToken,
    verifyToken,
};
