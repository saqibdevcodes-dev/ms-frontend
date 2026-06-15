const { Router } = require("express");
const adminController = require("../../controllers/admin");
const { verifyAdminRole } = require("../../middleware/auth");

const adminRouter = Router();

// Apply admin role verification middleware to all routes
adminRouter.use(verifyAdminRole);

// Dashboard data routes
adminRouter.get("/stats", adminController.getSystemStats);
adminRouter.get("/activities", adminController.getRecentActivities);
adminRouter.get("/system-health", adminController.getSystemHealth);
adminRouter.get(
  "/password-reset-requests",
  adminController.getPasswordResetRequests
);
adminRouter.get("/login-history", adminController.getLoginHistory);
adminRouter.post("/resend-reset-email", adminController.resendResetEmail);

// Cleanup service routes
adminRouter.get("/cleanup-status", adminController.getCleanupStatus);
adminRouter.post("/run-cleanup", adminController.runCleanup);

module.exports = adminRouter;
