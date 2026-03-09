const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

router.get('/contacts', auth, chatController.getContacts);
router.get('/groups', auth, chatController.getGroups);
router.get('/history/:targetId', auth, chatController.getHistory);
router.post('/message', auth, chatController.sendMessage);

module.exports = router;
