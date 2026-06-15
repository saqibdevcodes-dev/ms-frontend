const { Router } = require("express");
const { authenticated } = require("../middlewares/auth");
const authRouter = require("./auth");
const clientRouter = require("./client");
const essentialRouter = require("./essentials");
const scopeRouter = require("./scopes");
const userRouter = require("./users");
const branchRouter = require("./branch");
const responseRouter = require("./responses");
const rangeRouter = require("./ranges");
const templateRouter = require("./templates");
const reportRouter = require("./reports");
const adminRouter = require("./admin");
const analyticsRouter = require("./analytics");
const migrationsRouter = require("./migrations");

const apiRouter = Router();

// Auth routes (no authentication required)
apiRouter.use("/auth", authRouter);

// Protected routes (authentication required)
apiRouter.use("/client", authenticated, clientRouter);
apiRouter.use("/essentials", essentialRouter);
apiRouter.use("/scopes", authenticated, scopeRouter);
apiRouter.use("/users", authenticated, userRouter);
apiRouter.use("/branch", authenticated, branchRouter);
apiRouter.use("/response", authenticated, responseRouter);
apiRouter.use("/range", authenticated, rangeRouter);
apiRouter.use("/templates", authenticated, templateRouter);
apiRouter.use("/reports", authenticated, reportRouter);
apiRouter.use("/analytics", authenticated, analyticsRouter);
apiRouter.use("/migrations", authenticated, migrationsRouter);

// Admin routes (authentication and admin role required)
apiRouter.use("/admin", adminRouter);

module.exports = apiRouter;
