const express = require('express');
const router = express.Router();

const { asyncHandler, authAdmin } = require('../../auth/checkAuth');
const dashboardController = require('../../controller/admin/dashboard.admin.controller');

router.get('/', authAdmin, asyncHandler(dashboardController.getDashboard));

module.exports = router;

