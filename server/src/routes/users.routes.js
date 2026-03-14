const express = require('express');
const router = express.Router();

const multer = require('multer');

// Lưu vào memory để upload lên Cloudinary (không lưu disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const userController = require('../controller/user.controller');

const { asyncHandler, authUser } = require('../auth/checkAuth');

router.post('/register', asyncHandler(userController.createUser));
router.get('/auth', authUser, asyncHandler(userController.auth));
router.post('/login', asyncHandler(userController.login));
router.post('/logout', authUser, asyncHandler(userController.logout));
router.get('/refresh-token', asyncHandler(userController.refreshToken));
router.post('/login-google', asyncHandler(userController.loginGoogle));
router.post('/forgot-password', asyncHandler(userController.forgotPassword));
router.post('/reset-password', asyncHandler(userController.resetPassword));
router.put('/update', authUser, asyncHandler(userController.updateUser));
router.post('/upload-avatar', authUser, upload.single('avatar'), asyncHandler(userController.uploadAvatar));
router.post('/chatbot', authUser, asyncHandler(userController.chatbot));
router.get('/message-chatbot', authUser, asyncHandler(userController.getMessageChatbot));

module.exports = router;
