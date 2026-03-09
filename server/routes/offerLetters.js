const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const offerLetterController = require('../controllers/offerLetterController');

router.post('/', auth, authorize(['hr']), offerLetterController.createOfferLetter);
router.get('/', auth, authorize(['hr']), offerLetterController.getOfferLetters);
router.post('/:id/send', auth, authorize(['hr']), offerLetterController.sendOfferLetter);
router.patch('/:id/status', auth, authorize(['hr']), offerLetterController.updateOfferLetterStatus);

module.exports = router;
