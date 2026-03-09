const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const payrollController = require('../controllers/payrollController');

router.use(auditLogger('Payroll'));

router.get('/', auth, payrollController.getPayroll);
router.post('/', auth, authorize(['hr']), payrollController.createPayroll);
router.post('/:id/send', auth, authorize(['hr']), payrollController.sendPayslip);

module.exports = router;
