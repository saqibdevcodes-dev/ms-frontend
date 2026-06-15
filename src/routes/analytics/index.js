const { Router } = require("express");
const { authenticated } = require("../../middlewares/auth");
const analyticsController = require("../../controllers/analytics");

const analyticsRouter = Router();

// Routes for different analytics views
analyticsRouter.get(
  "/scope",
  authenticated,
  analyticsController.getScopeAnalytics
);
analyticsRouter.get("/kpi", authenticated, analyticsController.getKpiAnalytics);
analyticsRouter.get(
  "/source",
  authenticated,
  analyticsController.getSourceAnalytics
);

// User performance analytics
analyticsRouter.get(
  "/user-performance",
  authenticated,
  analyticsController.getUserPerformanceAnalytics
);

// TEST ROUTE (no auth required) - Remove after debugging
analyticsRouter.get(
  "/test-user-performance",
  analyticsController.getUserPerformanceAnalytics
);

// Filter routes for analytics
analyticsRouter.get(
  "/filters",
  authenticated,
  analyticsController.getAnalyticsFilters
);

module.exports = analyticsRouter;
