const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.get('/', auth, authorize(['hr']), analyticsController.getAnalytics);

module.exports = router;
