const express = require('express');
const {
  createLead,
  getLeads,
  updateLeadStatus,
  addNote,
  getAnalytics,
  updateLead,
  deleteLead,
  exportLeadsCsv,
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', createLead);
router.get('/', protect, getLeads);
router.get('/analytics', protect, getAnalytics);
router.put('/:id/status', protect, updateLeadStatus);
router.post('/:id/notes', protect, addNote); // now handles tags
router.put('/:id', protect, updateLead);
router.delete('/:id', protect, deleteLead);
router.get('/export', protect, exportLeadsCsv);

module.exports = router;
