const express = require('express');
const router = express.Router();

const { asyncHandler, authAdmin } = require('../../auth/checkAuth');
const adminUsersController = require('../../controller/admin/users.admin.controller');

router.get('/', authAdmin, asyncHandler(adminUsersController.getAllUser));
router.put('/:id', authAdmin, asyncHandler(adminUsersController.updateUser));
router.delete('/:id', authAdmin, asyncHandler(adminUsersController.deleteUser));

module.exports = router;

