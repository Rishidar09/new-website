const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const announcementController = require('../controllers/announcementController');

router.get('/', auth, announcementController.getAnnouncements);
router.post('/', auth, announcementController.createAnnouncement);

module.exports = router;
