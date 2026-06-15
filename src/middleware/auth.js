const jwt = require("jsonwebtoken");
const db = require("../database/sql");

/**
 * Middleware to verify the JWT token
 * This should be used on protected routes
 */
async function verifyToken(request, response, next) {
  try {
    // Extract token from Authorization header
    const token = request.headers.authorization?.split(" ")[1];

    if (!token) {
      return response.status(401).json({ message: "Authentication required" });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, "mystery_shopping_secret");

      // Check if the token exists in the database
      const [sessions] = await db.query(
        "SELECT * FROM sessions WHERE token = ?",
        [token]
      );

      if (sessions.length === 0) {
        return response
          .status(401)
          .json({ message: "Invalid or expired token" });
      }

      // Check if the token has expired
      const session = sessions[0];
      if (new Date(session.expires_at) < new Date()) {
        return response.status(401).json({ message: "Token has expired" });
      }

      // Fetch the user from the database
      const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
        decoded.email,
      ]);

      if (users.length === 0) {
        return response.status(404).json({ message: "User not found" });
      }

      const user = users[0];
      delete user.password; // Don't include the password

      // Attach the user to the request object
      request.user = user;
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return response.status(401).json({ message: "Token has expired" });
      }
      return response.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error("Error in token verification:", error);
    return response.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Middleware to verify admin role
 * This should be used on admin-only routes
 */
async function verifyAdminRole(request, response, next) {
  try {
    // First verify that the token is valid
    await verifyToken(request, response, () => {
      // Check if the user has admin role
      if (request.user && request.user.system_role === "admin") {
        next();
      } else {
        return response.status(403).json({
          message: "Access denied: Admin privileges required",
        });
      }
    });
  } catch (error) {
    console.error("Error in admin role verification:", error);
    return response.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = {
  verifyToken,
  verifyAdminRole,
};
