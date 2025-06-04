const express = require('express');
const router = express.Router();

const {
    bulkTicketCancel,
} = require('../controllers/bulkCancel/bulkTicketCancelController');

const {
    stopBulkCancellation,
} = require('../controllers/bulkCancel/stopBulkCancelController');

const {
    downloadCsv,
} = require('../controllers/downloadController');

const {
    checkCsvReady,
} = require('../controllers/checkCsvReadyController');

// === Bulk Ticket Cancel Management Routes ===
router.post('/bulkCancel', bulkTicketCancel);
router.post('/stopBulkCancellation', stopBulkCancellation);

// === Download Routes ===
router.post('/downloadLogs', downloadCsv);
router.get('/checkCsvReady', checkCsvReady);

module.exports = router;