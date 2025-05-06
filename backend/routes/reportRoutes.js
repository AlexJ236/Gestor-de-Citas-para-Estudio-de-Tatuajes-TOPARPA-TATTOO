const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticateToken = require('../middleware/authenticateToken');

router.get('/summary', reportController.getFinancialSummary);
router.get('/daily', reportController.getDailyReportData);
router.get('/monthly', reportController.getMonthlyReportData);

module.exports = router;