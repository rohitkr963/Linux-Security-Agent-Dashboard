const express  = require('express');
const router   = express.Router();

const asyncHandler       = require('../utils/asyncHandler');
const reportController   = require('../controllers/reportController');
const dashboardController= require('../controllers/dashboardController');
const hostController     = require('../controllers/hostController');

// ── Ingestion ────────────────────────────────────────────────────────────────
router.post('/report',              asyncHandler(reportController.ingestReport));

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard/summary',    asyncHandler(dashboardController.getSummary));

// ── Hosts ────────────────────────────────────────────────────────────────────
router.get('/hosts',                asyncHandler(hostController.getHosts));
router.get('/hosts/:id',            asyncHandler(hostController.getHostById));
router.get('/hosts/:id/packages',   asyncHandler(hostController.getHostPackages));
router.get('/hosts/:id/cis-results',asyncHandler(hostController.getHostChecks));

module.exports = router;
