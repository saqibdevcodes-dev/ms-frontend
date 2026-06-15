const { Router } = require("express");
const authController = require("../../controllers/auth");

const authRouter = Router();

authRouter.post("/register", authController.signUpNewUser);
authRouter.post("/check-client-access", authController.checkClientAccess);
authRouter.post("/login", authController.signIn);
authRouter.get("/logout", authController.signOut);
authRouter.get("/current", authController.currentUser);
authRouter.post("/refresh-token", authController.refreshToken);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);
authRouter.post("/validate-token", authController.validateToken);

// Role management routes
authRouter.get("/user_roles", authController.getUserRoles);
authRouter.post("/user_roles", authController.addUserRole);
authRouter.delete("/user_roles/:id", authController.deleteUserRole);

module.exports = authRouter;
