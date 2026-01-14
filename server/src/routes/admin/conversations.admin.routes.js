const express = require('express');
const router = express.Router();

const { asyncHandler, authAdmin } = require('../../auth/checkAuth');
const adminConversationsController = require('../../controller/admin/conversations.admin.controller');

router.get('/all', authAdmin, asyncHandler(adminConversationsController.getAllConversation));

module.exports = router;

