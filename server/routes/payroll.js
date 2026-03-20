const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const payrollController = require('../controllers/payrollController');

router.use(auditLogger('Payroll'));

router.get('/', auth, payrollController.getPayroll);
router.get('/attendance-metrics', auth, authorize(['hr']), payrollController.getPayrollAttendanceMetrics);
router.get('/statutory-settings', auth, authorize(['hr']), payrollController.getStatutorySettings);
router.put('/statutory-settings', auth, authorize(['hr']), payrollController.updateStatutorySettings);
router.get('/compliance-report', auth, authorize(['hr']), payrollController.getMonthlyComplianceReport);
router.post('/', auth, authorize(['hr']), payrollController.createPayroll);
router.post('/:id/send', auth, authorize(['hr']), payrollController.sendPayslip);

module.exports = router;
