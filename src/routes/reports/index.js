const { Router } = require("express");
const {
  saveReport,
  updateReport,
  getReports,
  getReportById,
  deleteReport,
  updateReportStatus,
  getClientDashboardData,
} = require("../../controllers/reports");

const {
  getUserPerformanceSummary,
  getClientUsersPerformance,
} = require("../../controllers/reports/user_performance");

const router = Router();

// GET /reports/client/:client_id - Get all reports for a client
router.get("/client/:client_id", getReports);

// GET /reports/:id - Get a specific report by ID
router.get("/:id", getReportById);

// POST /reports - Save a report
router.post("/", saveReport);

// PUT /reports/:id - Update a report
router.put("/:id", updateReport);

// DELETE /reports/:id - Delete a report
router.delete("/:id", deleteReport);

// PATCH /reports/:id/status - Update report status
router.patch("/:id/status", updateReportStatus);

// Also allow PUT method for status updates (to avoid CORS issues)
router.put("/:id/status", updateReportStatus);

// Add POST route for client dashboard data - specifically for the dashboard to avoid the video_url column
router.post("/client-dashboard-data", getClientDashboardData);

// User performance routes
router.get("/user-performance/:user_id", getUserPerformanceSummary);
router.get("/client-performance/:client_id", getClientUsersPerformance);

module.exports = router;
